"""
Maia Platform — Fallback Resilience
Implements a Resilient LLM wrapper that handles automatic model switching.
"""
import logging
from typing import AsyncGenerator, List, Optional
from core.ai.base import AIProvider

logger = logging.getLogger(__name__)

class ResilientLLM(AIProvider):
    """
    Wrapper for multiple AI providers that implements a fallback strategy.
    It tries the providers in order until one succeeds.
    """
    
    def __init__(self, providers: List[AIProvider]):
        self.providers = [p for p in providers if p.is_configured()]
        if not self.providers:
            logger.warning("⚠️ No AI providers were successfully configured for ResilientLLM.")
            
    def get_model_name(self) -> str:
        if not self.providers:
            return "None (Misconfigured)"
        return f"Resilient({', '.join([p.get_model_name() for p in self.providers])})"

    def is_configured(self) -> bool:
        return len(self.providers) > 0

    async def generate(
        self,
        prompt: str,
        context: Optional[List[dict]] = None,
        rag_context: Optional[List[str]] = None,
    ) -> str:
        last_error = None
        for provider in self.providers:
            try:
                logger.info(f"🔄 Attempting generation with provider: {provider.get_model_name()}")
                return await provider.generate(prompt, context, rag_context)
            except Exception as e:
                logger.error(f"❌ Provider {provider.get_model_name()} failed: {e}")
                last_error = e
                continue
        
        raise Exception(f"All AI providers failed. Last error: {last_error}")

    async def generate_stream(
        self,
        prompt: str,
        context: Optional[List[dict]] = None,
        rag_context: Optional[List[str]] = None,
        legal_context: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming fallback is more complex. If the first provider fails mid-stream,
        we can't easily 'restart' the stream for the user without them noticing.
        However, if it fails at the START, we can switch.
        """
        last_error = None
        
        # We try providers until one successfully STARTS yielding
        for provider in self.providers:
            try:
                # We attempt to initialize the stream
                stream = provider.generate_stream(prompt, context, rag_context, legal_context)
                
                # We check if the stream produces at least one chunk or a failure quickly
                # (Simplification: just yield from it and let it fail if it must)
                async for chunk in stream:
                    yield chunk
                
                # If we finished the stream without error, we return
                return
                
            except Exception as e:
                logger.error(f"❌ Provider {provider.get_model_name()} failed during stream: {e}")
                last_error = e
                # If it failed mid-stream, the user already saw some content.
                # In a real production apps, we might want to append a message 
                # saying "Connection lost, switching...", but for now we just try next if possible.
                continue
        
        if last_error:
            # If we are here, all providers failed
            yield f"\n\n[ERRO CRÍTICO]: A Maia perdeu conexão com todos os modelos de IA. Detalhes: {str(last_error)}"
