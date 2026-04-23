"""
Maia Platform — Google Gemini AI Provider
Implementation of AIProvider using Google Generative AI SDK.
Integrates RAG context and anti-hallucination instructions (RF-41).
"""
import asyncio
import logging
from typing import Optional, AsyncGenerator

import google.generativeai as genai
from core.ai.base import AIProvider

logger = logging.getLogger(__name__)


from core.ai.prompts import MAIA_SYSTEM_PROMPT
from core.ai.search import search_legal_web, format_search_results

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

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        self._api_key = api_key
        self._model_name = model_name
        self._model: Optional[genai.GenerativeModel] = None

        if api_key:
            genai.configure(api_key=api_key)
            # Relax safety settings for professional legal drafting context
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            self._model = genai.GenerativeModel(
                model_name=model_name,
                safety_settings=safety_settings
            )

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
        """Generate a response using Google Gemini with optional RAG and Web Search."""
        if not self._model:
            return "⚠️ AI not configured. Please set GEMINI_API_KEY environment variable."

        try:
            # Fallback to web search if RAG returns nothing and it's not a simple greeting
            web_context = ""
            if not legal_context and not rag_context and len(prompt.split()) > 3:
                logger.info(f"RAG search yielded no results. Triggering fallback web search for: {prompt}")
                search_results = await search_legal_web(prompt)
                web_context = format_search_results(search_results)

            full_prompt = self._build_prompt(prompt, context, rag_context, legal_context)
            
            # Inject web context if found before the final prompt
            if web_context:
                full_prompt = full_prompt.replace(f"\nAdvogado: {prompt}", f"{web_context}\n\nAdvogado: {prompt}")

            # Use the async version of the SDK directly
            response = await self._model.generate_content_async(full_prompt)
            
            # 💰 Telemetry Intercept (Billing)
            usage_cb = kwargs.get("usage_callback")
            if usage_cb and hasattr(response, "usage_metadata"):
                try:
                    usage = response.usage_metadata
                    i_tok = usage.prompt_token_count
                    o_tok = usage.candidates_token_count
                    if asyncio.iscoroutinefunction(usage_cb):
                        await usage_cb(i_tok, o_tok)
                    else:
                        usage_cb(i_tok, o_tok)
                except Exception as meta_err:
                    logger.warning(f"Falha ao apurar telemetria Gemini: {meta_err}")

            import re
            cleaned_text = re.sub(r'<verificacao>.*?</verificacao>', '', response.text, flags=re.DOTALL).strip()
            return cleaned_text

        except Exception as e:
            logger.error("Error generating Gemini response: %s", e)
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
        """Stream a response token-by-token using Gemini's streaming API with Web Search."""
        if not self._model:
            yield "⚠️ AI not configured. Please set GEMINI_API_KEY environment variable."
            return

        try:
            # Fallback to web search if RAG returns nothing
            web_context = ""
            if not legal_context and not rag_context and len(prompt.split()) > 3:
                search_results = await search_legal_web(prompt)
                web_context = format_search_results(search_results)

            full_prompt = self._build_prompt(prompt, context, rag_context, legal_context)
            if web_context:
                full_prompt = full_prompt.replace(f"\nAdvogado: {prompt}", f"{web_context}\n\nAdvogado: {prompt}")

            # Use generate_content_async with stream=True for true async streaming
            response = await self._model.generate_content_async(full_prompt, stream=True)
            
            yield_allowed = False
            buffer = ""
            
            async for chunk in response:
                if chunk.text:
                    if yield_allowed:
                        yield chunk.text
                    else:
                        buffer += chunk.text
                        if "</verificacao>" in buffer:
                            yield_allowed = True
                            # Limpa a tag final e inicia o yield real
                            after_tag = buffer.split("</verificacao>")[-1]
                            # Remove white spaces extras pos pensamento
                            after_tag = after_tag.lstrip()
                            if after_tag:
                                yield after_tag
                        # Fallback de segurança: Se a IA decidiu ignorar a ordem e não usou a tag
                        elif len(buffer) > 1000 and "<verificacao>" not in buffer:
                            yield_allowed = True
                            yield buffer

            # 💰 Telemetry Intercept for Stream (Final check if usage is appended)
            usage_cb = kwargs.get("usage_callback")
            if usage_cb and hasattr(response, "usage_metadata"):
                try:
                    usage = response.usage_metadata
                    i_tok = usage.prompt_token_count
                    if hasattr(response, "_result") and response._result:
                        o_tok = usage.candidates_token_count
                    else:
                        o_tok = len(buffer) // 4 # Aproximação fallback
                    if asyncio.iscoroutinefunction(usage_cb):
                        await usage_cb(i_tok, o_tok)
                    else:
                        usage_cb(i_tok, o_tok)
                except Exception as meta_err:
                    logger.warning(f"Falha ao apurar telemetria stream Gemini: {meta_err}")

        except Exception as e:
            logger.error("Error streaming Gemini response: %s", e)
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                yield "⚠️ Maia está temporariamente indisponível."
            else:
                yield "⚠️ Erro ao processar sua solicitação."

    def get_model_name(self) -> str:
        return self._model_name

    def is_configured(self) -> bool:
        return self._model is not None
