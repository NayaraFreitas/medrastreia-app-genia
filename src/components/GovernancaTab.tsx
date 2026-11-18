import { Download, ShieldAlert, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { AuditLogEntry, Chamado, LaudoQualidade } from '../types/medrastreia';

interface GovernancaTabProps {
  chamados: Chamado[];
  laudosFila: LaudoQualidade[];
  auditLogs: AuditLogEntry[];
  sigiloBloqueiosCount: number;
}

export function GovernancaTab({
  chamados,
  laudosFila,
  auditLogs,
  sigiloBloqueiosCount,
}: GovernancaTabProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todos');

  const chamadosAbertos = chamados.filter((c) => c.status !== 'Revisado e Copiado').length;
  const laudosAbertos = laudosFila.filter((l) => l.status === 'Aguardando Análise').length;
  const totalNaFila = chamadosAbertos + laudosAbertos;

  const chamadosRevisados = chamados.filter((c) => c.status === 'Revisado e Copiado').length;
  const laudosAssinados = laudosFila.filter((l) => l.status === 'Assinado e Devolvido').length;

  // Cálculo dinâmico realista da demo com base nas ações concluídas na sessão
  const taxaAceitaSemRetorno = Math.min(99.2, 93.4 + chamadosRevisados * 1.1 + laudosAssinados * 0.8);
  const asIsHoraPessoa = 2.08;
  const atualHoraPessoa = Number(
    (4.62 + chamadosRevisados * 0.24 + laudosAssinados * 0.19).toFixed(2)
  );
  const ganhoPercentual = Math.round(((atualHoraPessoa - asIsHoraPessoa) / asIsHoraPessoa) * 100);

  const logsFiltrados =
    categoriaFiltro === 'Todos'
      ? auditLogs
      : auditLogs.filter((l) => l.categoria === categoriaFiltro);

  const handleExportCsv = () => {
    const header = ['ID', 'Data/Hora', 'Usuario Responsavel', 'Categoria', 'Acao', 'Fontes Validadas'];
    const rows = logsFiltrados.map((log) => [
      log.id,
      log.dataHora,
      `"${log.usuarioResponsavel.replace(/"/g, '""')}"`,
      log.categoria,
      `"${log.acao.replace(/"/g, '""')}"`,
      `"${log.fontesValidadas.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medrastreia-auditoria-lgpd.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const categorias = ['Todos', 'ERP', 'Sigilo/LGPD', 'Qualidade', 'Atendimento'];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
      {/* Cabeçalho contextual da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B365D] tracking-tight">
            Governança, Rastreabilidade &amp; Eficiência Operacional
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Mediterrânea Alimentos · Painel de auditoria LGPD, integridade de fontes ERP e ganho operacional do fluxo assistido.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1B365D] bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Log CSV</span>
        </button>
      </div>

      {/* Apenas 4 KPIs no topo */}
      <section aria-label="Indicadores principais" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Chamados na Fila
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-[#1B365D] font-mono tabular-nums">
              {totalNaFila}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {chamadosAbertos} triagem · {laudosAbertos} laudos
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            {chamadosRevisados} revisado(s) e copiado(s) nesta sessão
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Taxa de Resposta Aceita sem Retorno
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-[#16A34A] font-mono tabular-nums">
              {taxaAceitaSemRetorno.toFixed(1).replace('.', ',')}%
            </span>
            <span className="text-xs font-medium text-[#16A34A]">
              Meta ≥ 90,0%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            Checklist de 4 itens trava erros de NF e lote
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Resultado Aceito por Hora-Pessoa
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#1B365D] font-mono tabular-nums">
              {atualHoraPessoa.toFixed(2).replace('.', ',')}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] tabular-nums">
              <TrendingUp className="w-3.5 h-3.5" />
              +{ganhoPercentual}% vs AS-IS
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 tabular-nums">
            <span>AS-IS manual: <strong className="font-mono text-slate-800">2,08</strong></span>
            <span>Atual demo: <strong className="font-mono text-[#1B365D]">{atualHoraPessoa.toFixed(2).replace('.', ',')}</strong></span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Alertas de Sigilo/Auditoria Bloqueados
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-[#DC2626] font-mono tabular-nums">
              {sigiloBloqueiosCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626]">
              <ShieldAlert className="w-3.5 h-3.5" />
              LGPD Ativo
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            Bloqueio automático de dados de terceiros B2B
          </div>
        </div>
      </section>

      {/* Tabela simples de Log de Auditoria */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#1B365D]">
              Log de Auditoria &amp; Conformidade LGPD
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro imutável de correlações ERP, bloqueios de sigilo, assinaturas de laudos e aprovações humanas.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start md:self-auto overflow-x-auto">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  categoriaFiltro === cat
                    ? 'bg-white text-[#1B365D] font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-5 whitespace-nowrap">Data/Hora</th>
                <th className="py-3 px-5 whitespace-nowrap">Usuário Responsável</th>
                <th className="py-3 px-5">Ação</th>
                <th className="py-3 px-5">Fontes Validadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                    Nenhum registro encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {log.dataHora}
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-900 whitespace-nowrap">
                      {log.usuarioResponsavel}
                    </td>
                    <td className="py-3 px-5 text-slate-800">
                      <span
                        className={`inline-block mr-2 px-1.5 py-0.5 text-[11px] font-semibold rounded border ${
                          log.categoria === 'Sigilo/LGPD'
                            ? 'bg-red-50 text-[#DC2626] border-red-200'
                            : log.categoria === 'Qualidade'
                              ? 'bg-amber-50 text-[#D97706] border-amber-200'
                              : log.categoria === 'Atendimento'
                                ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                                : 'bg-slate-100 text-[#1B365D] border-slate-200'
                        }`}
                      >
                        {log.categoria}
                      </span>
                      <span>{log.acao}</span>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-slate-600">
                      {log.fontesValidadas}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
