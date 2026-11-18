import { useState } from 'react';
import { AtendimentoTab } from './components/AtendimentoTab';
import { GovernancaTab } from './components/GovernancaTab';
import { QualidadeTab } from './components/QualidadeTab';
import { TopBar } from './components/TopBar';
import {
  ERP_LOTES_PRODUCAO,
  ERP_PEDIDOS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CHAMADOS,
  INITIAL_LAUDOS_FILA,
} from './data/mockDatabase';
import {
  ActiveTab,
  AuditLogEntry,
  Chamado,
  ChecklistDraft,
  LaudoQualidade,
} from './types/medrastreia';
import {
  formatCurrentTimestamp,
  runDeterministicErpCorrelation,
} from './utils/erpCopilot';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('atendimento');
  const [chamados, setChamados] = useState<Chamado[]>(() => INITIAL_CHAMADOS);
  const [selectedChamadoId, setSelectedChamadoId] = useState<string>(
    INITIAL_CHAMADOS[0].id
  );
  const [laudosFila, setLaudosFila] = useState<LaudoQualidade[]>(
    () => INITIAL_LAUDOS_FILA
  );
  const [selectedLaudoId, setSelectedLaudoId] = useState<string>(
    INITIAL_LAUDOS_FILA[0].id
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(
    () => INITIAL_AUDIT_LOGS
  );
  const [sigiloBloqueiosCount, setSigiloBloqueiosCount] = useState<number>(1);
  const [sigiloChamadosContabilizados, setSigiloChamadosContabilizados] =
    useState<Record<string, boolean>>({});

  const appendAuditLog = (
    usuarioResponsavel: string,
    acao: string,
    fontesValidadas: string,
    categoria: AuditLogEntry['categoria']
  ) => {
    const newEntry: AuditLogEntry = {
      id: `AUD-${1000 + auditLogs.length + 1}`,
      dataHora: formatCurrentTimestamp(),
      usuarioResponsavel,
      acao,
      fontesValidadas,
      categoria,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleResetDemo = () => {
    setChamados(INITIAL_CHAMADOS);
    setSelectedChamadoId(INITIAL_CHAMADOS[0].id);
    setLaudosFila(INITIAL_LAUDOS_FILA);
    setSelectedLaudoId(INITIAL_LAUDOS_FILA[0].id);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSigiloBloqueiosCount(1);
    setSigiloChamadosContabilizados({});
    setActiveTab('atendimento');
  };

  const handleAnalisarErp = (chamadoId: string) => {
    const target = chamados.find((c) => c.id === chamadoId);
    if (!target) return;

    const result = runDeterministicErpCorrelation(target);

    let defaultAcaoPrazo = '';
    if (result.politicaB2B?.isConsumidorFinal) {
      defaultAcaoPrazo = 'Indicar Distribuidora Minas Sabores · retorno imediato';
    } else if (result.alertaSigilo?.ativo) {
      defaultAcaoPrazo =
        'Confirmar coleta FOB Doca 03 em 20/11 + recusar tabela de terceiro';
    } else if (result.exigeLaudo && result.lote.encontrado) {
      defaultAcaoPrazo =
        'Segregação preventiva no CD + Laudo Louveira (retorno em até 4h úteis)';
    } else if (result.exigeLaudo && !result.lote.encontrado) {
      defaultAcaoPrazo =
        'Solicitar NF ou foto da etiqueta do lote · reposição em até 24h úteis';
    } else {
      defaultAcaoPrazo =
        'Entrega reprogramada em contingência hoje (18/11) até 17h30';
    }

    setChamados((prev) =>
      prev.map((c) => {
        if (c.id !== chamadoId) return c;
        return {
          ...c,
          status: c.status === 'Pendente' ? 'Analisado' : c.status,
          correlacao: result,
          checklist: {
            pedidoCerto: result.pedido.encontrado ? result.pedido.valor ?? '' : '',
            nfCerta: result.notaFiscal.encontrado ? result.notaFiscal.valor ?? '' : '',
            lote: result.lote.encontrado ? result.lote.valor ?? '' : '',
            acaoPrazo: defaultAcaoPrazo,
            conferidoPorHumano: false,
            textoResposta: result.rascunhoSugerido,
          },
        };
      })
    );

    const fontes = [
      result.pedido.fonte,
      result.notaFiscal.fonte,
      result.lote.fonte,
    ]
      .filter(Boolean)
      .join(' · ') || 'Base ERP consultada — conferência manual sinalizada';

    appendAuditLog(
      'Camila Duarte (Atendimento)',
      `Correlação ERP executada no chamado ${chamadoId} (${target.remetenteNome})`,
      fontes,
      'ERP'
    );

    if (result.alertaSigilo?.ativo && !sigiloChamadosContabilizados[chamadoId]) {
      setSigiloChamadosContabilizados((prev) => ({ ...prev, [chamadoId]: true }));
      setSigiloBloqueiosCount((prev) => prev + 1);
      appendAuditLog(
        'MedRastreia Guardrail (Automático)',
        `Alerta vermelho de sigilo bloqueado no chamado ${chamadoId}: pedido de tabela de preços de terceiro`,
        'Política Interna LGPD & Compliance Comercial §4.2',
        'Sigilo/LGPD'
      );
    }
  };

  const criarOuAbrirDossieNaQualidade = (chamado: Chamado) => {
    const existente = laudosFila.find((l) => l.chamadoId === chamado.id);
    if (existente) {
      setSelectedLaudoId(existente.id);
      return existente;
    }

    const correlacao =
      chamado.correlacao ?? runDeterministicErpCorrelation(chamado);
    const nf = correlacao.notaFiscal.valor ?? 'NF não informada';
    const pedidoObj = ERP_PEDIDOS.find(
      (p) => p.nfNumero === nf || p.pedidoId === correlacao.pedido.valor
    );

    const comLote = correlacao.lote.encontrado && Boolean(correlacao.lote.valor);
    const novoLaudoId = `QL-2026-0${89 + laudosFila.length - 1}`;

    const novoLaudo: LaudoQualidade = {
      id: novoLaudoId,
      chamadoId: chamado.id,
      clienteNome: chamado.remetenteNome,
      clienteLocal: chamado.remetenteLocal,
      nfNumero: nf,
      cargaId: pedidoObj?.cargaId ?? null,
      loteIdentificado: comLote ? correlacao.lote.valor : null,
      fonteLote: comLote
        ? 'Registro Produção Louveira'
        : 'Não localizado automaticamente — conferência manual obrigatória',
      comLoteIdentificado: comLote,
      tempoEstimadoMin: comLote ? 20 : 40,
      cruzamentoTexto: comLote
        ? `${nf} -> ${pedidoObj?.cargaId ?? 'Carga #C-310'} -> Lote ${correlacao.lote.valor} (Fonte: Registro Produção Louveira)`
        : `${chamado.id} -> Múltiplos pedidos candidatos sem NF/Lote único confirmado`,
      produtoDescricao:
        pedidoObj?.itens[0]?.descricao ?? 'Item reportado na ocorrência',
      motivoOcorrencia: chamado.assunto,
      recebidoEm: formatCurrentTimestamp(),
      status: 'Aguardando Análise',
      parecerTecnico: '',
      analistaNome: 'Dra. Marina Vasconcelos',
      analistaCrq: 'CRQ 04419283',
    };

    setLaudosFila((prev) => [novoLaudo, ...prev]);
    setSelectedLaudoId(novoLaudo.id);

    setChamados((prev) =>
      prev.map((c) =>
        c.id === chamado.id
          ? {
              ...c,
              correlacao,
              status: 'Em Qualidade',
              enviadoParaQualidadeEm: formatCurrentTimestamp(),
            }
          : c
      )
    );

    appendAuditLog(
      'Camila Duarte (Atendimento)',
      `Dossiê ${novoLaudo.id} (${chamado.id}) enviado para Qualidade Louveira (${
        comLote ? 'Com Lote · 20 min' : 'Sem Lote · 40 min'
      })`,
      comLote
        ? `${nf} · ${pedidoObj?.cargaId ?? 'Carga #C-310'} · Lote ${correlacao.lote.valor}`
        : 'Pendente identificação manual de lote na planta',
      'Qualidade'
    );

    return novoLaudo;
  };

  const handleEnviarQualidade = (chamadoId: string) => {
    const target = chamados.find((c) => c.id === chamadoId);
    if (!target) return;
    criarOuAbrirDossieNaQualidade(target);
  };

  const handlePuxarCasoRecife = () => {
    const recife = chamados.find((c) => c.id === 'CH-2026-041');
    if (!recife) return;
    const correlacao = recife.correlacao ?? runDeterministicErpCorrelation(recife);
    const atualizado: Chamado = {
      ...recife,
      correlacao,
      status: 'Em Qualidade',
      checklist: {
        pedidoCerto: correlacao.pedido.valor ?? '#1042',
        nfCerta: correlacao.notaFiscal.valor ?? 'NF-8841',
        lote: correlacao.lote.valor ?? 'L-2026-10A',
        acaoPrazo:
          'Segregação preventiva no CD + Laudo Louveira (retorno em até 4h úteis)',
        conferidoPorHumano: false,
        textoResposta: correlacao.rascunhoSugerido,
      },
    };
    setChamados((prev) =>
      prev.map((c) => (c.id === 'CH-2026-041' ? atualizado : c))
    );
    criarOuAbrirDossieNaQualidade(atualizado);
  };

  const handleUpdateChecklist = (
    chamadoId: string,
    patch: Partial<ChecklistDraft>
  ) => {
    setChamados((prev) =>
      prev.map((c) =>
        c.id === chamadoId
          ? { ...c, checklist: { ...c.checklist, ...patch } }
          : c
      )
    );
  };

  const handleAprovarECopiar = (chamadoId: string) => {
    const target = chamados.find((c) => c.id === chamadoId);
    if (!target) return;

    setChamados((prev) =>
      prev.map((c) =>
        c.id === chamadoId
          ? {
              ...c,
              status: 'Revisado e Copiado',
              revisadoECopiadoEm: formatCurrentTimestamp(),
            }
          : c
      )
    );

    appendAuditLog(
      'Camila Duarte (Atendimento)',
      `Resposta revisada, aprovada e copiada manualmente para ${chamadoId}`,
      `Pedido: ${target.checklist.pedidoCerto} · NF: ${target.checklist.nfCerta} · Lote: ${target.checklist.lote}`,
      'Atendimento'
    );
  };

  const handleAssignManualLote = (laudoId: string, loteCode: string) => {
    const prod = ERP_LOTES_PRODUCAO.find((p) => p.lote === loteCode);
    setLaudosFila((prev) =>
      prev.map((l) =>
        l.id === laudoId
          ? {
              ...l,
              loteIdentificado: loteCode,
              cargaId: prod?.cargaId ?? l.cargaId,
              fonteLote: 'Conferência Manual — Registro Produção Louveira',
              cruzamentoTexto: `${l.nfNumero} -> ${prod?.cargaId ?? 'Carga localizada'} -> Lote ${loteCode} (Vinculado manualmente pela Qualidade)`,
            }
          : l
      )
    );
    appendAuditLog(
      'Dra. Marina Vasconcelos (CRQ 04419283)',
      `Lote ${loteCode} vinculado manualmente ao dossiê ${laudoId}`,
      `Registro Produção Louveira · ${loteCode}`,
      'Qualidade'
    );
  };

  const handleAssinarEDevolver = (
    laudoId: string,
    parecerTecnico: string,
    analistaNome: string,
    analistaCrq: string
  ) => {
    const targetLaudo = laudosFila.find((l) => l.id === laudoId);
    if (!targetLaudo) return;
    const timestamp = formatCurrentTimestamp();

    setLaudosFila((prev) =>
      prev.map((l) =>
        l.id === laudoId
          ? {
              ...l,
              status: 'Assinado e Devolvido',
              parecerTecnico,
              analistaNome,
              analistaCrq,
              assinadoEm: timestamp,
            }
          : l
      )
    );

    if (targetLaudo.chamadoId) {
      setChamados((prev) =>
        prev.map((c) => {
          if (c.id !== targetLaudo.chamadoId) return c;
          return {
            ...c,
            status: 'Laudo Devolvido',
            laudoDevolvido: {
              laudoId: targetLaudo.id,
              parecerTecnico,
              analistaNome,
              analistaCrq,
              assinadoEm: timestamp,
              loteConfirmado: targetLaudo.loteIdentificado ?? 'Não informado',
              fonteLote: targetLaudo.fonteLote,
            },
          };
        })
      );
    }

    appendAuditLog(
      `${analistaNome} (${analistaCrq})`,
      `Laudo ${laudoId} assinado manualmente e devolvido ao Atendimento`,
      `Registro Produção Louveira ${targetLaudo.loteIdentificado ?? ''} · ${targetLaudo.nfNumero}`,
      'Qualidade'
    );
  };

  const handleIrParaQualidade = (chamadoId?: string) => {
    if (chamadoId) {
      const laudo = laudosFila.find((l) => l.chamadoId === chamadoId);
      if (laudo) setSelectedLaudoId(laudo.id);
    }
    setActiveTab('qualidade');
  };

  const pendingAtendimentoCount = chamados.filter(
    (c) => c.status !== 'Revisado e Copiado'
  ).length;
  const pendingQualidadeCount = laudosFila.filter(
    (l) => l.status === 'Aguardando Análise'
  ).length;
  const recifeAguardandoTriagem = !laudosFila.some(
    (l) => l.chamadoId === 'CH-2026-041'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-[#0F172A]">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResetDemo={handleResetDemo}
        pendingAtendimentoCount={pendingAtendimentoCount}
        pendingQualidadeCount={pendingQualidadeCount}
      />

      <div className="flex-1">
        {activeTab === 'atendimento' && (
          <AtendimentoTab
            chamados={chamados}
            selectedChamadoId={selectedChamadoId}
            onSelectChamado={setSelectedChamadoId}
            onAnalisarErp={handleAnalisarErp}
            onEnviarQualidade={handleEnviarQualidade}
            onUpdateChecklist={handleUpdateChecklist}
            onAprovarECopiar={handleAprovarECopiar}
            onIrParaQualidade={handleIrParaQualidade}
          />
        )}

        {activeTab === 'qualidade' && (
          <QualidadeTab
            laudosFila={laudosFila}
            selectedLaudoId={selectedLaudoId}
            onSelectLaudo={setSelectedLaudoId}
            onAssignManualLote={handleAssignManualLote}
            onAssinarEDevolver={handleAssinarEDevolver}
            recifeAguardandoTriagem={recifeAguardandoTriagem}
            onPuxarCasoRecife={handlePuxarCasoRecife}
          />
        )}

        {activeTab === 'governanca' && (
          <GovernancaTab
            chamados={chamados}
            laudosFila={laudosFila}
            auditLogs={auditLogs}
            sigiloBloqueiosCount={sigiloBloqueiosCount}
          />
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white py-3.5 px-6 mt-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Mediterrânea Alimentos · MedRastreia — Uso Interno (Atendimento B2B &amp; Garantia da Qualidade Louveira/SP)
          </span>
          <span>
            Governança Human-in-the-Loop · Dados simulados para demonstração operacional
          </span>
        </div>
      </footer>
    </div>
  );
}
