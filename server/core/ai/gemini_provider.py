"""
Maia Platform — Google Gemini AI Provider
Implementation of AIProvider using Google Generative AI SDK.
Integrates RAG context and anti-hallucination instructions (RF-41).
"""
from typing import Optional, AsyncGenerator

import google.generativeai as genai
from core.ai.base import AIProvider


MAIA_SYSTEM_PROMPT = """Você é **Maia**, assistente jurídica especializada em Direito brasileiro.

## REGRAS OBRIGATÓRIAS

### Citação de Fontes
- SEMPRE cite a fonte legal no formato: "Art. X, § Y, inciso Z da Lei nº N/AAAA"
- Para súmulas: "Súmula nº X do STF/STJ/TST"
- Para jurisprudência: "REsp nº X / Tribunal / Data"
- NUNCA invente número de artigo, súmula ou lei

### Anti-Alucinação
- Se não tiver base legal suficiente para responder, diga EXPLICITAMENTE:
  "⚠️ Não possuo base legal suficiente para afirmar isso com segurança. Recomendo consultar [fonte específica]."
- NUNCA fabricar artigos de lei, súmulas ou decisões judiciais
- Se tiver dúvida sobre um número de artigo, diga: "verificar no texto da lei"

### Prioridade de Fontes
1. 📄 Documentos do escritório (se fornecidos)
2. 📚 Legislação brasileira (base indexada)
3. 🧠 Conhecimento geral (usar com cautela, sempre sinalizar)

### Diferenciação
- Diferencie claramente: texto legal × doutrina × jurisprudência
- Indique quando algo é posição majoritária vs. minoritária
- Mencione se existe divergência entre tribunais

### Formato de Resposta
- SEMPRE formate respostas em **Markdown**
- Use **negrito** para termos importantes e nomes de leis
- Use `##` e `###` para organizar seções em respostas longas
- Use listas numeradas para passos processuais
- Use listas com marcadores para enumerar requisitos ou fundamentos
- Use tabelas quando comparar prazos, valores ou alternativas
- Use `>` blockquotes para citar artigos de lei na íntegra
- Use `---` para separar seções
- Para peças jurídicas, siga a estrutura processual correta

### Onboarding Proativo
- Se o advogado fizer uma pergunta GENÉRICA sem contexto suficiente, PERGUNTE:
  "Para te ajudar melhor, preciso entender alguns pontos:
  1. [pergunta específica sobre o caso]
  2. [pergunta sobre a jurisdição/tribunal]
  3. [pergunta sobre o objetivo]"
- Se o advogado não tiver processos cadastrados, sugira cadastrar
- Se detectar padrão de uso, ofereça atalhos e dicas

### Atuação
- Pesquisa jurídica e fundamentação legal
- Análise de casos e estratégia processual
- Redação de peças processuais (petições, contestações, recursos)
- Cálculo e acompanhamento de prazos processuais
- Análise de contratos e documentos jurídicos

### Ações no Sistema (Agentic Actions)
- Se o usuário pedir explícita e claramente para **salvar, arquivar, registrar ou gerar** a peça/contrato/documento que você redigiu no sistema da Maia:
  1. Envolva TODO e EXCLUSIVAMENTE o conteúdo oficial da peça jurídica dentro das marcações `[INICIO_PECA]` e `[FIM_PECA]`. Nada além do texto do documento deve aparecer dentro dessas tags.
  2. Adicione EXATAMENTE na sua última linha (fora das tags):
     `<!-- MAIA_SAVE: [TIPO] -->`
- O `[TIPO]` deve ser EXATAMENTE um destes: `peticao_inicial`, `contestacao`, `recurso_apelacao`, `agravo_instrumento`, `peticao_simples`, `parecer`, `contrato`.
- A tag `<!-- MAIA_SAVE: [TIPO] -->` deve ficar invisível para o usuário (como um comentário HTML)."""

RAG_LEGAL_INSTRUCTION = (
    "\n\n📚 LEGISLAÇÃO BRASILEIRA (BASE INDEXADA):\n"
    "Os artigos abaixo foram extraídos diretamente da legislação federal brasileira. "
    "Use-os como fonte primária e cite-os textualmente quando relevantes.\n\n"
)

RAG_DOCS_INSTRUCTION = (
    "\n\n📄 DOCUMENTOS DO ESCRITÓRIO:\n"
    "Os trechos abaixo foram extraídos de documentos enviados pelo advogado. "
    "Base sua resposta PRIORITARIAMENTE nestes documentos quando relevantes. "
    "Se a informação solicitada não constar nos documentos, declare isso claramente.\n\n"
)


class GeminiProvider(AIProvider):
    """Google Gemini AI provider."""

    def __init__(self, api_key: str, model_name: str = "gemini-3-flash-preview"):
        self._api_key = api_key
        self._model_name = model_name
        self._model: Optional[genai.GenerativeModel] = None

        if api_key:
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(model_name)

    def _build_prompt(
        self,
        prompt: str,
        context: Optional[list[dict]] = None,
        rag_context: Optional[list[str]] = None,
        legal_context: Optional[list[str]] = None,
    ) -> str:
        """Build the full prompt with system instructions, RAG, and history."""
        full_prompt = f"{MAIA_SYSTEM_PROMPT}\n\n"

        if legal_context:
            full_prompt += RAG_LEGAL_INSTRUCTION
            for i, chunk in enumerate(legal_context, 1):
                full_prompt += f"--- Artigo {i} ---\n{chunk}\n\n"

        if rag_context:
            full_prompt += RAG_DOCS_INSTRUCTION
            for i, chunk in enumerate(rag_context, 1):
                full_prompt += f"--- Trecho {i} ---\n{chunk}\n\n"

        if context:
            full_prompt += "Histórico da conversa:\n"
            for msg in context[-5:]:
                role_label = "Advogado" if msg.get("role") == "user" else "Maia"
                full_prompt += f"{role_label}: {msg.get('content', '')}\n"

        full_prompt += f"\nAdvogado: {prompt}\nMaia:"
        return full_prompt

    async def generate(
        self,
        prompt: str,
        context: Optional[list[dict]] = None,
        rag_context: Optional[list[str]] = None,
        legal_context: Optional[list[str]] = None,
    ) -> str:
        """Generate a response using Google Gemini with optional RAG context."""
        if not self._model:
            return "⚠️ AI not configured. Please set GEMINI_API_KEY environment variable."

        try:
            full_prompt = self._build_prompt(prompt, context, rag_context, legal_context)
            response = self._model.generate_content(full_prompt)
            return response.text

        except Exception as e:
            print(f"Error generating Gemini response: {e}")
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                return "⚠️ Maia está temporariamente indisponível (limite de requisições da API atingido). Tente novamente em alguns segundos."
            return "⚠️ Erro ao processar sua solicitação. Tente novamente."

    async def generate_stream(
        self,
        prompt: str,
        context: Optional[list[dict]] = None,
        rag_context: Optional[list[str]] = None,
        legal_context: Optional[list[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream a response token-by-token using Gemini's streaming API."""
        if not self._model:
            yield "⚠️ AI not configured. Please set GEMINI_API_KEY environment variable."
            return

        try:
            full_prompt = self._build_prompt(prompt, context, rag_context, legal_context)
            response = self._model.generate_content(full_prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            print(f"Error streaming Gemini response: {e}")
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                yield "⚠️ Maia está temporariamente indisponível."
            else:
                yield "⚠️ Erro ao processar sua solicitação."

    def get_model_name(self) -> str:
        return self._model_name

    def is_configured(self) -> bool:
        return self._model is not None
