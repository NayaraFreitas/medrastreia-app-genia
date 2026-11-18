import {
  DISTRIBUIDORES_REGIONAIS,
  ERP_LOTES_PRODUCAO,
  ERP_PEDIDOS,
} from '../data/mockDatabase';
import {
  Chamado,
  ErpCorrelationResult,
  ErpPedido,
} from '../types/medrastreia';

export function formatCurrentTimestamp(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function runDeterministicErpCorrelation(chamado: Chamado): ErpCorrelationResult {
  const texto = `${chamado.assunto} ${chamado.mensagemOriginal}`;
  const lower = texto.toLowerCase();
  const nowStr = formatCurrentTimestamp();

  // 1. Detecção de Violação de Sigilo / Compliance Comercial (tabela de outro distribuidor)
  const pedeTabelaTerceiro =
    lower.includes('tabela de preços') &&
    (lower.includes('paulista oeste') || lower.includes('outro distribuidor') || lower.includes('concorrente'));

  // 2. Detecção de Consumidor Final (Política B2B exclusiva Mediterrânea Alimentos)
  const isConsumidorFinal =
    chamado.origem === 'Instagram/Marketing' ||
    lower.includes('pra minha casa') ||
    lower.includes('consumidor final') ||
    lower.includes('fazer o pix');

  if (isConsumidorFinal) {
    const dist = DISTRIBUIDORES_REGIONAIS.MG;
    return {
      analisadoEm: nowStr,
      pedido: {
        valor: null,
        fonte: null,
        encontrado: false,
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória (remetente sem cadastro B2B)',
      },
      notaFiscal: {
        valor: null,
        fonte: null,
        encontrado: false,
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória',
      },
      lote: {
        valor: null,
        fonte: null,
        encontrado: false,
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória',
      },
      exigeLaudo: false,
      motivoClassificacao:
        'Solicitação de consumidor final (B2C). A Mediterrânea Alimentos comercializa exclusivamente para distribuidores regionais e food service — não requer laudo técnico.',
      politicaB2B: {
        isConsumidorFinal: true,
        distribuidorIndicado: dist.nome,
        contatoDistribuidor: dist.contato,
      },
      rascunhoSugerido: `Olá! Ficamos muito felizes em saber que você gostou do nosso Molho Pesto.\n\nA Mediterrânea Alimentos atua exclusivamente com vendas industriais (B2B) para distribuidores regionais e redes de food service, não realizando faturamento direto da fábrica para consumidor final.\n\nPara adquirir nossos produtos em Belo Horizonte/MG, recomendamos entrar em contato com nosso distribuidor autorizado na região:\n• ${dist.nome}\n• Contato: ${dist.contato}\n\nQualquer dúvida, seguimos à disposição!`,
    };
  }

  // 3. Extrair menções de NF e Pedidos
  const nfMatches = texto.match(/NF-\d{4}/gi) ?? [];
  const pedidoMatches = texto.match(/#\d{4}/g) ?? [];

  // Caso de múltiplos pedidos com ambiguidade (Caso 5)
  if (pedidoMatches.length > 1) {
    const pedidosEncontrados = pedidoMatches
      .map((pid) => ERP_PEDIDOS.find((p) => p.pedidoId === pid))
      .filter((p): p is ErpPedido => Boolean(p));

    const pedidosComAzeitona = pedidosEncontrados.filter((p) =>
      p.itens.some((it) => it.descricao.toLowerCase().includes('azeitona'))
    );

    const candidatosTexto = pedidosComAzeitona.map(
      (p) => `${p.pedidoId} (${p.nfNumero} · Lote ${p.itens[0].lote} · emitido em ${p.dataEmissao})`
    );

    return {
      analisadoEm: nowStr,
      pedido: {
        valor: `${pedidosComAzeitona.map((p) => p.pedidoId).join(' ou ')} (ambiguidade)`,
        fonte: `ERP Carteira MegaFood (${pedidosEncontrados.length} pedidos localizados)`,
        encontrado: false,
        candidatos: candidatosTexto,
        alertaManual:
          'Dado não localizado com precisão única no ERP — conferência manual obrigatória (2 pedidos candidatos com Azeitona Preta Fatiada 2kg)',
      },
      notaFiscal: {
        valor: null,
        fonte: null,
        encontrado: false,
        candidatos: pedidosComAzeitona.map((p) => `${p.nfNumero} (${p.pedidoId})`),
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória (cliente não informou a NF)',
      },
      lote: {
        valor: null,
        fonte: null,
        encontrado: false,
        candidatos: pedidosComAzeitona.map((p) => `${p.itens[0].lote} (${p.nfNumero})`),
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória (solicitar foto da etiqueta ou confirmar NF)',
      },
      exigeLaudo: true,
      motivoClassificacao:
        'Divergência de quantidade por caixa fechada (10 vs 12 baldes) com pedido de troca de lote. Requer conferência de expedição/qualidade em Louveira (fila Sem Lote: ~40 min se enviado antes da confirmação).',
      rascunhoSugerido: `Olá, equipe MegaFood Distribuição.\n\nLocalizamos os pedidos ${pedidosComAzeitona.map((p) => p.pedidoId).join(' e ')} em nossa base com o item Azeitona Preta Fatiada Balde 2kg, referentes respectivamente às notas ${pedidosComAzeitona.map((p) => p.nfNumero).join(' e ')}.\n\nPara garantirmos a rastreabilidade exata do lote com divergência de quantidade (10 baldes em vez de 12) e liberarmos a reposição/troca, por gentileza nos informe o número da NF ou envie uma foto da etiqueta do lote impressa na caixa.\n\nAssim que confirmado (ou após análise de peso/expedição pela planta de Louveira em até 40 min / retorno em até 24h úteis), daremos sequência imediata à reposição das unidades faltantes.`,
    };
  }

  // Busca por NF ou Pedido único
  let pedidoEncontrado: ErpPedido | undefined;
  const firstNf = nfMatches[0];
  if (firstNf) {
    const nfNorm = firstNf.toUpperCase();
    pedidoEncontrado = ERP_PEDIDOS.find((p) => p.nfNumero.toUpperCase() === nfNorm);
  }
  if (!pedidoEncontrado && pedidoMatches.length === 1) {
    pedidoEncontrado = ERP_PEDIDOS.find((p) => p.pedidoId === pedidoMatches[0]);
  }

  if (!pedidoEncontrado) {
    return {
      analisadoEm: nowStr,
      pedido: {
        valor: null,
        fonte: null,
        encontrado: false,
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória',
      },
      notaFiscal: {
        valor: null,
        fonte: null,
        encontrado: false,
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória',
      },
      lote: {
        valor: null,
        fonte: null,
        encontrado: false,
        alertaManual: 'Dado não localizado no ERP — conferência manual obrigatória',
      },
      exigeLaudo: false,
      motivoClassificacao: 'Registro não localizado automaticamente. Conferência manual obrigatória.',
      rascunhoSugerido: 'Prezado cliente, estamos realizando a conferência manual do seu registro em nosso ERP.',
    };
  }

  const lotesUnicos = Array.from(new Set(pedidoEncontrado.itens.map((i) => i.lote)));
  const lotePrincipal = lotesUnicos.join(' / ');
  const loteProducao = ERP_LOTES_PRODUCAO.find((l) => l.lote === pedidoEncontrado!.itens[0].lote);

  // Caso 1: Avaria física / lata amassada / estufamento -> Exige Laudo
  const temAvariaQualidade =
    lower.includes('amassada') ||
    lower.includes('amassamento') ||
    lower.includes('estufamento') ||
    lower.includes('vazamento');

  if (temAvariaQualidade) {
    return {
      analisadoEm: nowStr,
      pedido: {
        valor: pedidoEncontrado.pedidoId,
        fonte: `Fonte: ERP Pedido ${pedidoEncontrado.pedidoId}`,
        encontrado: true,
      },
      notaFiscal: {
        valor: pedidoEncontrado.nfNumero,
        fonte: `Fonte: ERP/SEFAZ ${pedidoEncontrado.nfNumero}`,
        encontrado: true,
      },
      lote: {
        valor: lotePrincipal,
        fonte: `Fonte: Registro Produção Louveira (${pedidoEncontrado.cargaId})`,
        encontrado: true,
      },
      carga: {
        valor: pedidoEncontrado.cargaId,
        fonte: `Fonte: ERP Expedição ${pedidoEncontrado.cargaId}`,
        encontrado: true,
      },
      cruzamentoCadeia: `${pedidoEncontrado.nfNumero} -> ${pedidoEncontrado.cargaId} -> Lote ${lotePrincipal} (Fonte: Registro Produção Louveira)`,
      exigeLaudo: true,
      motivoClassificacao:
        'Avaria em lata metálica com relato de estufamento leve. Obrigatória emissão de Laudo Técnico pela Qualidade (Louveira) com segregação preventiva das unidades.',
      rascunhoSugerido: `Olá, equipe ${pedidoEncontrado.clienteNome}.\n\nConfirmamos o recebimento da sua notificação referente ao Pedido ${pedidoEncontrado.pedidoId} (${pedidoEncontrado.nfNumero}). Por meio do rastreamento da ${pedidoEncontrado.cargaId}, identificamos o lote vinculado: ${lotePrincipal} (${pedidoEncontrado.itens[0].descricao}).\n\nPor precaução sanitária, orientamos manter as 18 latas avariadas e as 2 unidades com estufamento segregadas e identificadas no CD de Recife, sem destinação ao consumo.\n\nJá encaminhamos o dossiê com o lote identificado para a nossa equipe da Qualidade em Louveira/SP emitir o parecer técnico (SLA prioritário de atendimento em até 4h úteis após conclusão do laudo) e confirmar o procedimento de crédito/substituição.`,
    };
  }

  // Caso 4: Alerta de Sigilo (Tabela de terceiro) + Status de Pedido
  if (pedeTabelaTerceiro) {
    return {
      analisadoEm: nowStr,
      pedido: {
        valor: pedidoEncontrado.pedidoId,
        fonte: `Fonte: ERP Pedido ${pedidoEncontrado.pedidoId}`,
        encontrado: true,
      },
      notaFiscal: {
        valor: pedidoEncontrado.nfNumero,
        fonte: `Fonte: ERP/SEFAZ ${pedidoEncontrado.nfNumero}`,
        encontrado: true,
      },
      lote: {
        valor: lotePrincipal,
        fonte: `Fonte: ERP Expedição ${pedidoEncontrado.cargaId}`,
        encontrado: true,
      },
      carga: {
        valor: pedidoEncontrado.cargaId,
        fonte: `Fonte: ERP Expedição ${pedidoEncontrado.cargaId}`,
        encontrado: true,
      },
      exigeLaudo: false,
      motivoClassificacao:
        'Consulta de status de faturamento (sem desvio de qualidade) combinada com solicitação indevida de dados comerciais de terceiro.',
      alertaSigilo: {
        ativo: true,
        titulo: 'ALERTA DE SIGILO & COMPLIANCE COMERCIAL (LGPD)',
        descricao:
          'Solicitação de tabela de preços de outro distribuidor ("Distribuidora Paulista Oeste") detectada e bloqueada. É proibido divulgar políticas comerciais, preços ou contratos de terceiros. O rascunho abaixo responde apenas ao status do Pedido #1104.',
        termoDetectado: 'tabela de preços praticada para a Distribuidora Paulista Oeste',
      },
      rascunhoSugerido: `Prezada equipe ${pedidoEncontrado.clienteNome},\n\nConfirmamos que o Pedido ${pedidoEncontrado.pedidoId} (${pedidoEncontrado.nfNumero}, lote ${lotePrincipal}) já se encontra faturado e liberado para coleta FOB na Doca 03 da unidade Louveira/SP nesta sexta-feira (20/11/2026), a partir das 07h00.\n\nEm relação à solicitação de tabela de preços praticada com outros distribuidores, informamos que, por política de confidencialidade comercial e conformidade LGPD da Mediterrânea Alimentos, não compartilhamos condições comerciais de terceiros. Caso desejem revisar a tabela vigente exclusiva da Vale Verde, nossa gerência comercial regional pode agendar uma reunião específica.\n\nSeguimos à disposição.`,
    };
  }

  // Caso 2: Atraso logístico (sem necessidade de laudo)
  return {
    analisadoEm: nowStr,
    pedido: {
      valor: pedidoEncontrado.pedidoId,
      fonte: `Fonte: ERP Pedido ${pedidoEncontrado.pedidoId}`,
      encontrado: true,
    },
    notaFiscal: {
      valor: pedidoEncontrado.nfNumero,
      fonte: `Fonte: ERP/SEFAZ ${pedidoEncontrado.nfNumero}`,
      encontrado: true,
    },
    lote: {
      valor: lotePrincipal,
      fonte: loteProducao
        ? `Fonte: Registro Produção Louveira (${pedidoEncontrado.cargaId})`
        : `Fonte: ERP Expedição (${pedidoEncontrado.cargaId})`,
      encontrado: true,
    },
    carga: {
      valor: pedidoEncontrado.cargaId,
      fonte: `Fonte: ERP Expedição ${pedidoEncontrado.cargaId}`,
      encontrado: true,
    },
    exigeLaudo: false,
    motivoClassificacao:
      'Ocorrência exclusivamente logística (atraso na malha de entrega). Não envolve desvio físico ou sanitário — dispensado Laudo da Qualidade.',
    rascunhoSugerido: `Olá, equipe ${pedidoEncontrado.clienteNome}.\n\nVerificamos em nosso sistema o rastreamento do Pedido ${pedidoEncontrado.pedidoId} (${pedidoEncontrado.nfNumero}, lotes ${lotePrincipal}), despachado com a transportadora ${pedidoEncontrado.transportadora}.\n\nIdentificamos um atraso operacional na rota para Campinas e já acionamos a torre logística com prioridade de descarga: a entrega foi reprogramada em janela de contingência para hoje, 18/11/2026, até às 17h30.\n\nNosso time de Logística seguirá monitorando até a confirmação da descarga no restaurante central.`,
  };
}
