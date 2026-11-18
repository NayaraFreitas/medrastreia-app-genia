import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Database,
  FileCheck2,
  Lock,
  Search,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import {
  Chamado,
  ChecklistDraft,
  ErpFieldResult,
  TicketOrigin,
} from '../types/medrastreia';

interface AtendimentoTabProps {
  chamados: Chamado[];
  selectedChamadoId: string;
  onSelectChamado: (id: string) => void;
  onAnalisarErp: (chamadoId: string) => void;
  onEnviarQualidade: (chamadoId: string) => void;
  onUpdateChecklist: (chamadoId: string, patch: Partial<ChecklistDraft>) => void;
  onAprovarECopiar: (chamadoId: string) => void;
  onIrParaQualidade: (laudoChamadoId?: string) => void;
}

export function AtendimentoTab({
  chamados,
  selectedChamadoId,
  onSelectChamado,
  onAnalisarErp,
  onEnviarQualidade,
  onUpdateChecklist,
  onAprovarECopiar,
  onIrParaQualidade,
}: AtendimentoTabProps) {
  const [originFilter, setOriginFilter] = useState<'Todas' | TicketOrigin>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const filteredChamados = chamados.filter((c) => {
    const matchesOrigin = originFilter === 'Todas' || c.origem === originFilter;
    const matchesQuery =
      searchTerm.trim() === '' ||
      c.remetenteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOrigin && matchesQuery;
  });

  const selectedChamado =
    chamados.find((c) => c.id === selectedChamadoId) ?? chamados[0];

  const { checklist, correlacao } = selectedChamado;

  const isChecklistComplete =
    checklist.pedidoCerto.trim().length > 0 &&
    checklist.nfCerta.trim().length > 0 &&
    checklist.lote.trim().length > 0 &&
    checklist.acaoPrazo.trim().length > 0 &&
    checklist.textoResposta.trim().length > 0 &&
    checklist.conferidoPorHumano;

  const handleCopyAndApprove = async () => {
    if (!isChecklistComplete) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(checklist.textoResposta);
      }
    } catch {
      // Fallback silencioso caso o navegador bloqueie clipboard em iframe
    }
    onAprovarECopiar(selectedChamado.id);
    setCopyFeedbackId(selectedChamado.id);
    setTimeout(() => {
      setCopyFeedbackId((prev) => (prev === selectedChamado.id ? null : prev));
    }, 3500);
  };

  const handleInserirLaudoNoRascunho = () => {
    if (!selectedChamado.laudoDevolvido) return;
    const laudo = selectedChamado.laudoDevolvido;
    const blocoLaudo = `\n\nParecer Técnico da Qualidade (Louveira/SP — ${laudo.laudoId}):\n• Lote analisado: ${laudo.loteConfirmado}\n• Parecer (${laudo.analistaNome} · ${laudo.analistaCrq} em ${laudo.assinadoEm}): ${laudo.parecerTecnico}`;
    if (!checklist.textoResposta.includes(laudo.laudoId)) {
      onUpdateChecklist(selectedChamado.id, {
        textoResposta: `${checklist.textoResposta}${blocoLaudo}`,
        lote: checklist.lote || laudo.loteConfirmado,
        acaoPrazo:
          checklist.acaoPrazo ||
          `Laudo ${laudo.laudoId} emitido em ${laudo.assinadoEm} — seguir orientação técnica da Qualidade`,
      });
    }
  };

  const renderStatusLabel = (status: Chamado['status']) => {
    switch (status) {
      case 'Revisado e Copiado':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Revisado e Copiado
          </span>
        );
      case 'Laudo Devolvido':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
            <FileCheck2 className="w-3.5 h-3.5" />
            Laudo Devolvido
          </span>
        );
      case 'Em Qualidade':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706]">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Em Qualidade (Louveira)
          </span>
        );
      case 'Analisado':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B365D]">
            <Database className="w-3.5 h-3.5" />
            Correlacionado no ERP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
            Pendente de Triagem
          </span>
        );
    }
  };

  const renderErpCard = (title: string, field: ErpFieldResult) => {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">{title}</span>
          {field.encontrado ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#EEF3F9] text-[#1B365D] border border-[#1B365D]/20 rounded">
              <Database className="w-3 h-3" />
              {field.fonte}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200 rounded">
              <AlertTriangle className="w-3 h-3" />
              Conferência manual
            </span>
          )}
        </div>

        <div
          className={`font-mono text-base font-semibold tabular-nums ${
            field.encontrado ? 'text-[#0F172A]' : 'text-[#D97706]'
          }`}
        >
          {field.valor ?? 'Não localizado no ERP'}
        </div>

        {field.alertaManual && (
          <div className="text-xs text-[#B45309] bg-amber-50/80 border border-amber-200 rounded px-2.5 py-2 leading-relaxed">
            <strong>Alerta:</strong> {field.alertaManual}
          </div>
        )}

        {field.candidatos && field.candidatos.length > 0 && (
          <ul className="text-xs text-slate-700 space-y-1 pt-1 border-t border-slate-100 font-mono">
            {field.candidatos.map((cand) => (
              <li key={cand}>• {cand}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6">
      {/* Subheader contextual operacional */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B365D] tracking-tight">
            Atendimento &amp; Triagem B2B — Mediterrânea Alimentos
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Massas, molhos e conservas · Correlação determinística com ERP e aprovação humana obrigatória (nenhuma mensagem é enviada automaticamente).
          </p>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap shrink-0">
          Operador logado: <strong className="text-slate-800">Camila Duarte</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista lateral de chamados recebidos */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1B365D]">
                Chamados Recebidos
              </h2>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {filteredChamados.length} de {chamados.length}
              </span>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, assunto ou ID..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#1B365D] focus:bg-white transition-colors"
              />
            </div>

            {/* Filtro rápido por origem */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-md">
              {(['Todas', 'Atendimento', 'Caixa Comercial', 'Instagram/Marketing'] as const).map(
                (orig) => (
                  <button
                    key={orig}
                    type="button"
                    onClick={() => setOriginFilter(orig)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      originFilter === orig
                        ? 'bg-white text-[#1B365D] font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {orig === 'Instagram/Marketing' ? 'Instagram' : orig}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredChamados.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhum chamado encontrado com este filtro.
              </div>
            ) : (
              filteredChamados.map((chamado) => {
                const isSelected = chamado.id === selectedChamado.id;
                const hasSigiloAlert = chamado.correlacao?.alertaSigilo?.ativo;

                return (
                  <button
                    key={chamado.id}
                    type="button"
                    onClick={() => onSelectChamado(chamado.id)}
                    className={`w-full text-left p-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B365D] ${
                      isSelected
                        ? 'bg-[#EEF3F9]'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Metadata limpa sem pílulas */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="truncate">
                        <strong className="font-mono text-[#1B365D] tabular-nums">
                          {chamado.id}
                        </strong>{' '}
                        <span aria-hidden="true">·</span> {chamado.origem}
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {chamado.recebidoEm.split(' ')[1]}
                      </span>
                    </div>

                    <div className="mt-1.5 text-sm font-semibold text-slate-900 leading-snug">
                      {chamado.remetenteNome}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                      {chamado.assunto}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      {renderStatusLabel(chamado.status)}
                      {hasSigiloAlert && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Sigilo
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Área central e fluxo de triagem */}
        <main className="lg:col-span-8 space-y-5">
          {/* Card 1: Dados do Chamado + Mensagem Original + Botão de Análise */}
          <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-[#1B365D] tabular-nums">
                    {selectedChamado.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Origem: {selectedChamado.origem}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Recebido em {selectedChamado.recebidoEm}
                  </span>
                </div>
                <h2 className="mt-1.5 text-lg font-bold text-slate-900">
                  {selectedChamado.assunto}
                </h2>
                <div className="mt-1 text-sm text-slate-600">
                  {selectedChamado.remetenteNome}{' '}
                  <span aria-hidden="true">·</span> {selectedChamado.remetenteDocumento}{' '}
                  <span aria-hidden="true">·</span> {selectedChamado.remetenteLocal}
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => onAnalisarErp(selectedChamado.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1B365D] rounded-md hover:bg-[#234575] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B365D] focus-visible:ring-offset-2"
                >
                  <Database className="w-4 h-4" />
                  <span>
                    {correlacao
                      ? 'Reanalisar e Correlacionar no ERP'
                      : 'Analisar e Correlacionar no ERP'}
                  </span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
              <div className="text-xs font-semibold text-slate-500 mb-1.5">
                Mensagem Original Recebida
              </div>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {selectedChamado.mensagemOriginal}
              </p>
            </div>
          </section>

          {/* Resultados da Correlação ERP */}
          {!correlacao ? (
            <section className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">
                Correlação ERP ainda não executada
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Clique em <strong>&ldquo;Analisar e Correlacionar no ERP&rdquo;</strong> para cruzar automaticamente Pedido, Nota Fiscal, Carga e Lote na base oficial, verificar alertas de sigilo LGPD e classificar necessidade de Laudo da Qualidade.
              </p>
            </section>
          ) : (
            <>
              {/* Alerta Vermelho de Sigilo / Segurança (Caso 4) */}
              {correlacao.alertaSigilo?.ativo && (
                <section
                  role="alert"
                  className="bg-red-50 border border-red-300 rounded-lg p-5 flex items-start gap-3.5"
                >
                  <ShieldAlert className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#991B1B]">
                        {correlacao.alertaSigilo.titulo}
                      </h3>
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#DC2626] text-white rounded">
                        Bloqueio de Segurança Ativo
                      </span>
                    </div>
                    <p className="text-sm text-red-900 leading-relaxed">
                      {correlacao.alertaSigilo.descricao}
                    </p>
                    <p className="text-xs font-mono text-red-800">
                      Trecho bloqueado: &ldquo;{correlacao.alertaSigilo.termoDetectado}&rdquo; · Registrado no Log de Auditoria LGPD
                    </p>
                  </div>
                </section>
              )}

              {/* Política B2B Consumidor Final (Caso 3) */}
              {correlacao.politicaB2B?.isConsumidorFinal && (
                <section className="bg-[#EEF3F9] border border-[#1B365D]/25 rounded-lg p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#1B365D]">
                      Classificação Comercial B2B — Indicação de Distribuidor Regional
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-white text-[#1B365D] border border-[#1B365D]/20 rounded">
                      Fonte: Política Comercial Mediterrânea Alimentos
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    A Mediterrânea Alimentos vende exclusivamente para distribuidores regionais e food service (nunca consumidor final). Distribuidor indicado para {selectedChamado.remetenteLocal}:
                  </p>
                  <div className="bg-white border border-slate-200 rounded px-3.5 py-2.5 text-sm font-medium text-slate-900">
                    {correlacao.politicaB2B.distribuidorIndicado} ·{' '}
                    <span className="text-slate-600 font-normal">
                      {correlacao.politicaB2B.contatoDistribuidor}
                    </span>
                  </div>
                </section>
              )}

              {/* Cards de Rastreabilidade (Pedido, NF, Lote) */}
              <section aria-label="Rastreabilidade ERP" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1B365D]">
                    Rastreabilidade Oficial no ERP
                  </h3>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    Consultado em {correlacao.analisadoEm}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderErpCard('Pedido', correlacao.pedido)}
                  {renderErpCard('Nota Fiscal', correlacao.notaFiscal)}
                  {renderErpCard('Lote de Produção', correlacao.lote)}
                </div>

                {correlacao.cruzamentoCadeia && (
                  <div className="bg-white border border-slate-200 rounded-md px-4 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>Cadeia de Rastreio:</strong>{' '}
                      <span className="font-mono text-[#1B365D]">
                        {correlacao.cruzamentoCadeia}
                      </span>
                    </span>
                  </div>
                )}
              </section>

              {/* Classificação de Laudo da Qualidade + Envio */}
              <section className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Triagem Técnica de Qualidade:
                    </span>
                    {correlacao.exigeLaudo ? (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-[#D97706] border border-amber-200 rounded">
                        Exige Laudo da Qualidade (Louveira)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200 rounded">
                        Dispensado Laudo da Qualidade
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">
                    {correlacao.motivoClassificacao}
                  </p>
                </div>

                {correlacao.exigeLaudo && (
                  <div className="shrink-0">
                    {selectedChamado.status === 'Em Qualidade' ? (
                      <button
                        type="button"
                        onClick={() => onIrParaQualidade(selectedChamado.id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#1B365D] bg-[#EEF3F9] border border-[#1B365D]/25 rounded-md hover:bg-[#dfe8f4] transition-colors whitespace-nowrap"
                      >
                        <span>Ver Dossiê na Fila da Qualidade</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : selectedChamado.status === 'Laudo Devolvido' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
                        <CheckCircle2 className="w-4 h-4" />
                        Laudo assinado e devolvido
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEnviarQualidade(selectedChamado.id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1B365D] rounded-md hover:bg-[#234575] transition-colors whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {correlacao.lote.encontrado
                            ? 'Enviar Dossiê com Lote Identificado para Qualidade'
                            : 'Enviar Dossiê Sem Lote Definido para Qualidade'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Laudo Devolvido pela Qualidade (quando assinado na Aba 2) */}
              {selectedChamado.laudoDevolvido && (
                <section className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-[#16A34A]" />
                      <h3 className="text-sm font-bold text-emerald-950">
                        Laudo Técnico Devolvido pela Qualidade ({selectedChamado.laudoDevolvido.laudoId})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleInserirLaudoNoRascunho}
                      className="px-3 py-1.5 text-xs font-semibold text-[#1B365D] bg-white border border-emerald-300 rounded hover:bg-emerald-50 transition-colors whitespace-nowrap self-start sm:self-auto"
                    >
                      Inserir Parecer no Rascunho Abaixo
                    </button>
                  </div>
                  <p className="text-sm text-slate-800 bg-white border border-emerald-200 rounded p-3.5 leading-relaxed">
                    {selectedChamado.laudoDevolvido.parecerTecnico}
                  </p>
                  <div className="text-xs text-emerald-900 font-mono flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <strong>Assinado por:</strong> {selectedChamado.laudoDevolvido.analistaNome} ({selectedChamado.laudoDevolvido.analistaCrq})
                    </span>
                    <span>
                      <strong>Data/Hora:</strong> {selectedChamado.laudoDevolvido.assinadoEm}
                    </span>
                    <span>
                      <strong>Lote:</strong> {selectedChamado.laudoDevolvido.loteConfirmado} ({selectedChamado.laudoDevolvido.fonteLote})
                    </span>
                  </div>
                </section>
              )}

              {/* Gerador de Rascunho de 1ª Resposta + Checklist Human-in-the-Loop */}
              <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3.5">
                  <div>
                    <h3 className="text-base font-bold text-[#1B365D]">
                      Gerador de Rascunho de 1ª Resposta — Validação Human-in-the-Loop
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      O sistema nunca envia mensagens automaticamente. Preencha/confirme os 4 itens obrigatórios para liberar a cópia.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Checklist Obrigatório (4/4)
                  </span>
                </div>

                {/* 4 Itens Obrigatórios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="chk-pedido"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      1. Pedido certo <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="chk-pedido"
                      type="text"
                      value={checklist.pedidoCerto}
                      onChange={(e) =>
                        onUpdateChecklist(selectedChamado.id, { pedidoCerto: e.target.value })
                      }
                      placeholder="Ex: #1042 ou N/A (Consumidor Final)"
                      className={`w-full px-3 py-2 text-sm font-mono border rounded-md focus:outline-none focus:border-[#1B365D] ${
                        checklist.pedidoCerto.trim() === ''
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="chk-nf"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      2. NF certa <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="chk-nf"
                      type="text"
                      value={checklist.nfCerta}
                      onChange={(e) =>
                        onUpdateChecklist(selectedChamado.id, { nfCerta: e.target.value })
                      }
                      placeholder="Ex: NF-8841 ou N/A (Sem faturamento)"
                      className={`w-full px-3 py-2 text-sm font-mono border rounded-md focus:outline-none focus:border-[#1B365D] ${
                        checklist.nfCerta.trim() === ''
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="chk-lote"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      3. Lote <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="chk-lote"
                      type="text"
                      value={checklist.lote}
                      onChange={(e) =>
                        onUpdateChecklist(selectedChamado.id, { lote: e.target.value })
                      }
                      placeholder="Ex: L-2026-10A ou Pendente confirmação"
                      className={`w-full px-3 py-2 text-sm font-mono border rounded-md focus:outline-none focus:border-[#1B365D] ${
                        checklist.lote.trim() === ''
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="chk-acao"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      4. Ação + Prazo <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="chk-acao"
                      type="text"
                      value={checklist.acaoPrazo}
                      onChange={(e) =>
                        onUpdateChecklist(selectedChamado.id, { acaoPrazo: e.target.value })
                      }
                      placeholder="Ex: Segregação + Laudo em até 4h úteis"
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:border-[#1B365D] ${
                        checklist.acaoPrazo.trim() === ''
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Atalho explícito quando dado não existe no ERP (ex: Consumidor Final) */}
                {(!correlacao.pedido.encontrado || !correlacao.lote.encontrado) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-md px-3.5 py-2.5 text-xs text-amber-900">
                    <span>
                      Há campo(s) sem correspondência automática no ERP. Confirme manualmente antes de prosseguir.
                    </span>
                    {correlacao.politicaB2B?.isConsumidorFinal && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateChecklist(selectedChamado.id, {
                            pedidoCerto: 'N/A — Consumidor Final (B2C)',
                            nfCerta: 'N/A — Sem faturamento direto',
                            lote: 'N/A — Indicação Distribuidor MG',
                            acaoPrazo: 'Indicar Distribuidora Minas Sabores · retorno imediato',
                          })
                        }
                        className="px-2.5 py-1 font-semibold bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-100 transition-colors"
                      >
                        Confirmar N/A (Política B2B)
                      </button>
                    )}
                  </div>
                )}

                {/* Texto do Rascunho */}
                <div>
                  <label
                    htmlFor="rascunho-texto"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Texto da 1ª Resposta (editável pelo atendente)
                  </label>
                  <textarea
                    id="rascunho-texto"
                    rows={6}
                    value={checklist.textoResposta}
                    onChange={(e) =>
                      onUpdateChecklist(selectedChamado.id, { textoResposta: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-[#1B365D] focus:bg-white leading-relaxed"
                  />
                </div>

                {/* Checkbox Humano + Botão Travado */}
                <div className="pt-2 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist.conferidoPorHumano}
                      onChange={(e) =>
                        onUpdateChecklist(selectedChamado.id, {
                          conferidoPorHumano: e.target.checked,
                        })
                      }
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      Conferido por humano{' '}
                      <span className="block text-xs font-normal text-slate-500">
                        Confirmo que Pedido, NF, Lote e Ação+Prazo foram verificados nas fontes oficiais.
                      </span>
                    </span>
                  </label>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={!isChecklistComplete}
                      onClick={handleCopyAndApprove}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        isChecklistComplete
                          ? 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isChecklistComplete ? (
                        <Copy className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>Marcar como Revisado e Copiar Resposta</span>
                    </button>

                    {!isChecklistComplete && (
                      <span className="text-[11px] text-[#D97706] font-medium">
                        Preencha os 4 itens obrigatórios e marque &ldquo;Conferido por humano&rdquo;.
                      </span>
                    )}

                    {copyFeedbackId === selectedChamado.id && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
                        <Check className="w-3.5 h-3.5" />
                        Resposta copiada e marcada como Revisada no log de auditoria.
                      </span>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
