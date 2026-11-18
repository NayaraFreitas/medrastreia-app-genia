import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileSignature,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { ERP_LOTES_PRODUCAO } from '../data/mockDatabase';
import { LaudoQualidade } from '../types/medrastreia';

interface QualidadeTabProps {
  laudosFila: LaudoQualidade[];
  selectedLaudoId: string;
  onSelectLaudo: (id: string) => void;
  onAssignManualLote: (laudoId: string, loteCode: string) => void;
  onAssinarEDevolver: (
    laudoId: string,
    parecerTecnico: string,
    analistaNome: string,
    analistaCrq: string
  ) => void;
  recifeAguardandoTriagem: boolean;
  onPuxarCasoRecife: () => void;
}

export function QualidadeTab({
  laudosFila,
  selectedLaudoId,
  onSelectLaudo,
  onAssignManualLote,
  onAssinarEDevolver,
  recifeAguardandoTriagem,
  onPuxarCasoRecife,
}: QualidadeTabProps) {
  const selectedLaudo =
    laudosFila.find((l) => l.id === selectedLaudoId) ?? laudosFila[0];

  const [parecerInput, setParecerInput] = useState<Record<string, string>>({});
  const [analistaNome, setAnalistaNome] = useState('Dra. Marina Vasconcelos');
  const [analistaCrq, setAnalistaCrq] = useState('CRQ 04419283');

  const comLote = laudosFila.filter((l) => l.comLoteIdentificado);
  const semLote = laudosFila.filter((l) => !l.comLoteIdentificado);

  const loteProducao = selectedLaudo?.loteIdentificado
    ? ERP_LOTES_PRODUCAO.find((lp) => lp.lote === selectedLaudo.loteIdentificado)
    : undefined;

  const currentParecer =
    selectedLaudo?.status === 'Assinado e Devolvido'
      ? selectedLaudo.parecerTecnico
      : parecerInput[selectedLaudo?.id ?? ''] ?? selectedLaudo?.parecerTecnico ?? '';

  const podeAssinar =
    Boolean(selectedLaudo) &&
    selectedLaudo.status === 'Aguardando Análise' &&
    Boolean(selectedLaudo.loteIdentificado) &&
    currentParecer.trim().length >= 12 &&
    analistaNome.trim().length > 2;

  const renderQueueCard = (item: LaudoQualidade) => {
    const isSelected = item.id === selectedLaudo?.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectLaudo(item.id)}
        className={`w-full text-left p-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B365D] ${
          isSelected ? 'bg-[#EEF3F9]' : 'bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            <strong className="font-mono text-[#1B365D] tabular-nums">{item.id}</strong>{' '}
            <span aria-hidden="true">·</span>{' '}
            <span className="font-mono">{item.nfNumero}</span>
          </span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-slate-700">
            <Clock className="w-3 h-3" />
            {item.tempoEstimadoMin} min
          </span>
        </div>
        <div className="mt-1.5 text-sm font-semibold text-slate-900">
          {item.clienteNome}
        </div>
        <div className="mt-0.5 text-xs text-slate-600 line-clamp-1">
          {item.produtoDescricao}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          {item.loteIdentificado ? (
            <span className="font-mono font-medium text-[#1B365D]">
              Lote: {item.loteIdentificado}
            </span>
          ) : (
            <span className="font-medium text-[#D97706]">Lote não identificado</span>
          )}

          {item.status === 'Assinado e Devolvido' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Assinado
            </span>
          ) : (
            <span className="text-slate-500">Aguardando</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">
      {/* Cabeçalho + Regra 3 explícita */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B365D] tracking-tight">
            Qualidade — Fila de Laudos (Planta Louveira/SP)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Triagem técnica separada por disponibilidade de lote · Redação e assinatura de laudo exclusivas da analista humana.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#EEF3F9] border border-[#1B365D]/20 rounded-md text-xs font-semibold text-[#1B365D] self-start lg:self-auto">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Governança: IA rastreia o lote, mas nunca assina laudo técnico.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Fila separada visualmente: Com Lote (20 min) vs Sem Lote (40 min) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Grupo 1: Com Lote Identificado */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold text-emerald-950">
                  Com Lote Identificado pelo Copiloto
                </h2>
                <p className="text-[11px] text-emerald-800">
                  Rastreio automático concluído na triagem
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-white text-[#16A34A] border border-emerald-300 rounded tabular-nums shrink-0">
                ~20 min
              </span>
            </div>

            {recifeAguardandoTriagem && (
              <div className="p-3.5 bg-[#EEF3F9] border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="text-xs text-[#1B365D]">
                  <strong>CH-2026-041 (Recife · NF-8841)</strong> ainda na fila da Aba 1.
                </div>
                <button
                  type="button"
                  onClick={onPuxarCasoRecife}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#1B365D] text-white rounded hover:bg-[#234575] transition-colors whitespace-nowrap shrink-0"
                >
                  Carregar NF-8841
                </button>
              </div>
            )}

            <div className="divide-y divide-slate-200">
              {comLote.map(renderQueueCard)}
            </div>
          </div>

          {/* Grupo 2: Sem Lote */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold text-amber-950">
                  Sem Lote Identificado
                </h2>
                <p className="text-[11px] text-amber-800">
                  Requer pesquisa manual de romaneio/etiqueta
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-white text-[#D97706] border border-amber-300 rounded tabular-nums shrink-0">
                ~40 min
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {semLote.map(renderQueueCard)}
            </div>
          </div>
        </aside>

        {/* Área de Detalhe do Laudo e Assinatura */}
        {selectedLaudo && (
          <main className="lg:col-span-8 space-y-5">
            {/* Resumo e Cruzamento Automático */}
            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-[#1B365D] tabular-nums">
                      {selectedLaudo.id}
                    </span>
                    {selectedLaudo.chamadoId && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">Origem: {selectedLaudo.chamadoId}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Recebido em {selectedLaudo.recebidoEm}
                    </span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {selectedLaudo.clienteNome} · {selectedLaudo.clienteLocal}
                  </h2>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {selectedLaudo.produtoDescricao} — {selectedLaudo.motivoOcorrencia}
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded border whitespace-nowrap shrink-0 ${
                    selectedLaudo.status === 'Assinado e Devolvido'
                      ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                      : 'bg-amber-50 text-[#D97706] border-amber-200'
                  }`}
                >
                  {selectedLaudo.status}
                </span>
              </div>

              {/* Box de Cruzamento Automático */}
              <div
                className={`rounded-md border p-4 ${
                  selectedLaudo.loteIdentificado
                    ? 'bg-[#EEF3F9] border-[#1B365D]/20'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B365D] mb-1.5">
                  <Database className="w-4 h-4" />
                  <span>
                    {selectedLaudo.loteIdentificado
                      ? 'Cruzamento Automático ERP -> Produção Louveira'
                      : 'Lote Não Localizado Automaticamente — Conferência Manual Obrigatória'}
                  </span>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-900">
                  {selectedLaudo.cruzamentoTexto}
                </p>

                {!selectedLaudo.loteIdentificado && (
                  <div className="mt-3 pt-3 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center gap-3">
                    <label
                      htmlFor="manual-lote-select"
                      className="text-xs font-semibold text-amber-950"
                    >
                      Vincular Lote Manualmente (Registro Louveira):
                    </label>
                    <select
                      id="manual-lote-select"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignManualLote(selectedLaudo.id, e.target.value);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-mono bg-white border border-amber-300 rounded-md focus:outline-none focus:border-[#1B365D]"
                    >
                      <option value="">Selecione o lote após conferência...</option>
                      {ERP_LOTES_PRODUCAO.map((lp) => (
                        <option key={lp.lote} value={lp.lote}>
                          {lp.lote} — {lp.produto} ({lp.nfAssociada})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* Histórico da Análise do Lote */}
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#1B365D]" />
                  <h3 className="text-sm font-bold text-[#1B365D]">
                    Histórico da Análise Laboratorial do Lote
                  </h3>
                </div>
                {loteProducao && (
                  <span className="font-mono text-xs text-slate-600">
                    {loteProducao.linha} · Fab: {loteProducao.dataFabricacao} · Val: {loteProducao.validade}
                  </span>
                )}
              </div>

              {!loteProducao ? (
                <div className="p-6 text-center text-sm text-amber-800 bg-amber-50/40 flex flex-col items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                  <span>
                    Vincule o lote manualmente acima para visualizar os laudos físico-químicos e de costura da planta de Louveira.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-4 whitespace-nowrap">Data/Hora</th>
                        <th className="py-2.5 px-4">Parâmetro Analisado</th>
                        <th className="py-2.5 px-4">Resultado</th>
                        <th className="py-2.5 px-4">Especificação</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {loteProducao.historicoAnalise.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                            {row.dataHora}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {row.parametro}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800">{row.resultado}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">
                            {row.especificacao}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#16A34A] whitespace-nowrap">
                            {row.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Parecer Técnico e Assinatura da Analista */}
            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#1B365D]">
                    Parecer Técnico &amp; Assinatura da Qualidade
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Preenchimento e responsabilidade técnica exclusivos da analista da planta Louveira/SP.
                  </p>
                </div>

                {selectedLaudo.status === 'Aguardando Análise' && selectedLaudo.loteIdentificado && (
                  <button
                    type="button"
                    onClick={() =>
                      setParecerInput((prev) => ({
                        ...prev,
                        [selectedLaudo.id]: `Lote ${selectedLaudo.loteIdentificado} liberado na planta de Louveira com 100% de conformidade em recravação/costura e teste de incubação acelerada (0 estufamentos biológicos). Ocorrência relatada no CD de destino compatível com avaria mecânica de transporte/manuseio após expedição. Recomendamos segregação e descarte das unidades com estufamento/amassamento severo por precaução sanitária, além de bonificação/crédito das unidades avariadas.`,
                      }))
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-[#1B365D] bg-[#EEF3F9] border border-[#1B365D]/20 rounded hover:bg-[#dfe8f4] transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    Preencher Estrutura Base do Parecer
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="analista-nome"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Analista Responsável
                  </label>
                  <input
                    id="analista-nome"
                    type="text"
                    disabled={selectedLaudo.status === 'Assinado e Devolvido'}
                    value={
                      selectedLaudo.status === 'Assinado e Devolvido'
                        ? selectedLaudo.analistaNome
                        : analistaNome
                    }
                    onChange={(e) => setAnalistaNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#1B365D] disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="analista-crq"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Registro Profissional (CRQ)
                  </label>
                  <input
                    id="analista-crq"
                    type="text"
                    disabled={selectedLaudo.status === 'Assinado e Devolvido'}
                    value={
                      selectedLaudo.status === 'Assinado e Devolvido'
                        ? selectedLaudo.analistaCrq
                        : analistaCrq
                    }
                    onChange={(e) => setAnalistaCrq(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:border-[#1B365D] disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="parecer-tecnico"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Parecer Técnico da Analista <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="parecer-tecnico"
                  rows={4}
                  disabled={selectedLaudo.status === 'Assinado e Devolvido'}
                  value={currentParecer}
                  onChange={(e) =>
                    setParecerInput((prev) => ({
                      ...prev,
                      [selectedLaudo.id]: e.target.value,
                    }))
                  }
                  placeholder="Redija aqui a conclusão técnica sobre o lote, causa provável da não conformidade e orientação de segregação/disposição..."
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#1B365D] disabled:bg-slate-50 leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                {selectedLaudo.status === 'Assinado e Devolvido' ? (
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Laudo assinado por {selectedLaudo.analistaNome} em {selectedLaudo.assinadoEm} e devolvido ao Atendimento.
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-slate-500">
                      Ao assinar, seu nome, CRQ e data/hora serão gravados no Log de Auditoria.
                    </span>
                    <button
                      type="button"
                      disabled={!podeAssinar}
                      onClick={() =>
                        onAssinarEDevolver(
                          selectedLaudo.id,
                          currentParecer.trim(),
                          analistaNome.trim(),
                          analistaCrq.trim()
                        )
                      }
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        podeAssinar
                          ? 'bg-[#1B365D] text-white hover:bg-[#234575]'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>Assinar Laudo e Devolver ao Atendimento</span>
                    </button>
                  </>
                )}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
