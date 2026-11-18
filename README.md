# MedRastreia — Copiloto de Atendimento & Qualidade

Protótipo funcional de aplicação web interna (SPA) desenvolvido para a disciplina de **IA Generativa**, simulando um copiloto operacional para a indústria fictícia **Mediterrânea Alimentos** (massas, molhos e conservas — atuação exclusiva **B2B** para distribuidores regionais e *food service*, sem venda direta ao consumidor final).

A proposta demonstra como aplicar **governança, rastreabilidade de dados e controle humano** em fluxos críticos de atendimento, qualidade e compliance, rodando localmente com dados mockados e simulação determinística/IA sem dependência obrigatória de APIs externas.

---

## Regras de Negócio e Governança

1. **Rastreabilidade Total (Anti-Alucinação de Dados):** Toda informação sugerida (**Pedido**, **Nota Fiscal**, **Lote**) exibe um badge com a fonte exata (ex.: `Fonte: ERP Pedido #1042`). O sistema nunca inventa números; quando um dado não consta na base mockada, exibe o alerta: *"Dado não localizado no ERP — conferência manual obrigatória"*.
2. **Human-in-the-Loop:** O sistema não envia mensagens automaticamente. A aprovação final exige revisão e confirmação humana antes de liberar/copiar a resposta.
3. **IA Não Assina Laudo:** Na fila da Qualidade, o copiloto auxilia na correlação de NF, carga e lote, mas a redação técnica e a assinatura do laudo são de responsabilidade exclusiva da analista.
4. **Sigilo Comercial e Política B2B:** Identifica tentativas de acesso a tabelas de preço de terceiros (alerta de sigilo/segurança) e solicitações de compra direta por consumidor final (direcionamento para rede de distribuição).

---

## Estrutura da Aplicação (3 Abas Principais)

### 1. Atendimento & Triagem
* **Lista lateral de chamados:** Exibe a origem (`Atendimento`, `Caixa Comercial`, `Instagram/Marketing`), filtros rápidos e **5 cenários mockados**:
  1. Distribuidor do Recife reclamando de lata amassada informando apenas a **NF-8841** (sem lote), via caixa do Comercial.
  2. Rede de *Food Service* reclamando de entrega atrasada (sem necessidade de laudo).
  3. Consumidor final via Instagram querendo comprar 1 caixa de molho direto da fábrica (direcionamento para distribuidor).
  4. Distribuidor solicitando status de pedido e tabela de preço de outro distribuidor (alerta vermelho de sigilo/segurança).
  5. Distribuidor com múltiplos pedidos solicitando troca de lote com quantidade divergente.
* **Correlação e encaminhamento:** Exibe a mensagem original do cliente e o botão **"Analisar e Correlacionar no ERP"** para preencher **Pedido**, **NF** e **Lote** (com badges de fonte), indicar exigência de laudo e enviar o dossiê à Qualidade quando aplicável.
* **Rascunho de 1ª resposta com checklist obrigatório:** Exige o preenchimento e a marcação de **"Conferido por humano"** nos 4 itens:
  1. Pedido certo
  2. NF certa
  3. Lote
  4. Ação + Prazo
  
  O botão de aprovação/cópia permanece bloqueado enquanto houver pendência.

### 2. Qualidade — Fila de Laudos (Louveira)
* **Priorização visual por tempo estimado:** Separa solicitações **"Com Lote Identificado pelo Copiloto"** (estimativa de **20 min**) vs. **"Sem Lote"** (estimativa de **40 min**).
* **Rastreamento de produção:** Exibe o cruzamento automático (ex.: `NF-8841 -> Carga #C-310 -> Lote L-2026-10A (Fonte: Registro Produção Louveira)`) e o histórico da análise do lote.
* **Parecer e assinatura:** Campo para redação/complemento técnico da analista e botão **"Assinar Laudo e Devolver ao Atendimento"**, gravando analista e data/hora no log.

### 3. Governança & Eficiência
* **4 KPIs principais:**
  1. Chamados na Fila
  2. Taxa de Resposta Aceita sem Retorno (%)
  3. Resultado Aceito por Hora-Pessoa (*AS-IS: 2,08* vs. *Atual da Demo*)
  4. Alertas de Sigilo/Auditoria Bloqueados
* **Log de Auditoria:** Tabela com `Data/Hora`, `Usuário Responsável`, `Ação` e `Fontes Validadas` para fins de auditoria e conformidade/LGPD.

---

## Identidade Visual e Stack Sugerida

* **Stack:** React + Tailwind CSS (Single-Page Application com dados mockados).
* **Paleta e estilo:** Interface corporativa limpa com azul-marinho (`#1B365D`), branco, cinza claro e badges semânticos (verde, âmbar e vermelho), priorizando legibilidade e velocidade operacional.

---
## Link do App
https://medrastreia-copiloto-de-atendimento-qualidade.ai.studio/


## Como Executar Localmente

> Ajuste os comandos abaixo conforme a estrutura do seu projeto (por exemplo, Vite ou Create React App).

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev
