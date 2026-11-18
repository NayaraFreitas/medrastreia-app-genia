export type TicketOrigin = 'Atendimento' | 'Caixa Comercial' | 'Instagram/Marketing';

export type TicketStatus =
  | 'Pendente'
  | 'Analisado'
  | 'Em Qualidade'
  | 'Laudo Devolvido'
  | 'Revisado e Copiado';

export type ActiveTab = 'atendimento' | 'qualidade' | 'governanca';

export interface ErpPedido {
  pedidoId: string;
  clienteNome: string;
  clienteCnpj: string;
  cidadeUf: string;
  dataEmissao: string;
  statusErp: string;
  nfNumero: string;
  cargaId: string;
  itens: Array<{
    sku: string;
    descricao: string;
    quantidade: string;
    lote: string;
  }>;
  transportadora: string;
  previsaoEntrega: string;
}

export interface ErpLoteProducao {
  lote: string;
  produto: string;
  sku: string;
  planta: string;
  linha: string;
  dataFabricacao: string;
  validade: string;
  cargaId: string;
  nfAssociada: string;
  statusLiberacao: 'Liberado conforme especificação' | 'Em monitoramento preventivo';
  historicoAnalise: Array<{
    dataHora: string;
    parametro: string;
    resultado: string;
    especificacao: string;
    status: 'Conforme' | 'Atenção';
    analista: string;
  }>;
}

export interface ErpFieldResult {
  valor: string | null;
  fonte: string | null;
  encontrado: boolean;
  alertaManual?: string;
  candidatos?: string[];
}

export interface ErpCorrelationResult {
  analisadoEm: string;
  pedido: ErpFieldResult;
  notaFiscal: ErpFieldResult;
  lote: ErpFieldResult;
  carga?: ErpFieldResult;
  cruzamentoCadeia?: string;
  exigeLaudo: boolean;
  motivoClassificacao: string;
  politicaB2B?: {
    isConsumidorFinal: boolean;
    distribuidorIndicado: string;
    contatoDistribuidor: string;
  };
  alertaSigilo?: {
    ativo: boolean;
    titulo: string;
    descricao: string;
    termoDetectado: string;
  };
  rascunhoSugerido: string;
}

export interface ChecklistDraft {
  pedidoCerto: string;
  nfCerta: string;
  lote: string;
  acaoPrazo: string;
  conferidoPorHumano: boolean;
  textoResposta: string;
}

export interface SignedLaudoInfo {
  laudoId: string;
  parecerTecnico: string;
  analistaNome: string;
  analistaCrq: string;
  assinadoEm: string;
  loteConfirmado: string;
  fonteLote: string;
}

export interface Chamado {
  id: string;
  origem: TicketOrigin;
  remetenteNome: string;
  remetenteDocumento: string;
  remetenteLocal: string;
  recebidoEm: string;
  assunto: string;
  mensagemOriginal: string;
  status: TicketStatus;
  correlacao: ErpCorrelationResult | null;
  checklist: ChecklistDraft;
  laudoDevolvido: SignedLaudoInfo | null;
  enviadoParaQualidadeEm?: string;
  revisadoECopiadoEm?: string;
}

export interface LaudoQualidade {
  id: string;
  chamadoId?: string;
  clienteNome: string;
  clienteLocal: string;
  nfNumero: string;
  cargaId: string | null;
  loteIdentificado: string | null;
  fonteLote: string;
  comLoteIdentificado: boolean;
  tempoEstimadoMin: 20 | 40;
  cruzamentoTexto: string;
  produtoDescricao: string;
  motivoOcorrencia: string;
  recebidoEm: string;
  status: 'Aguardando Análise' | 'Assinado e Devolvido';
  parecerTecnico: string;
  analistaNome: string;
  analistaCrq: string;
  assinadoEm?: string;
}

export interface AuditLogEntry {
  id: string;
  dataHora: string;
  usuarioResponsavel: string;
  acao: string;
  fontesValidadas: string;
  categoria: 'ERP' | 'Sigilo/LGPD' | 'Qualidade' | 'Atendimento';
}
