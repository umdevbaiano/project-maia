"""
Maia Platform — Multi-Agent Orchestrator
Coordinates the 'Brain' of Maia split into specialized legal agents.
"""
import logging
from typing import List, Optional, AsyncGenerator
from core.ai.base import AIProvider
from core.ai.agents.maia_agents import LegalResearcher, LegalDrafter, MaiaReviewer

logger = logging.getLogger(__name__)

class MaiaOrchestrator:
    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.researcher = LegalResearcher(provider)
        self.drafter = LegalDrafter(provider)
        self.reviewer = MaiaReviewer(provider)

    async def chat(
        self, 
        prompt: str, 
        context: Optional[List[dict]] = None, 
        rag_context: Optional[List[str]] = None
    ) -> str:
        """Sequential coordination of specialists."""
        logger.info("🤖 Orchestrating multi-agent legal reasoning...")
        
        # 1. Researching context
        research_notes = await self.researcher.run(prompt, context, rag_context)
        logger.info("✅ Phase 1: Research complete.")

        # 2. Drafting the response based on research
        draft_input = f"CONTEXTO DA PESQUISA: {research_notes}\n\nSOLICITAÇÃO: {prompt}"
        draft_content = await self.drafter.run(draft_input, context)
        logger.info("✅ Phase 2: Drafting complete.")

        # 3. Final review for accuracy and compliance
        review_input = f"RASCUNHO PARA REVISÃO: {draft_content}\n\nREQUISITOS ORIGINAIS: {prompt}"
        final_response = await self.reviewer.run(review_input)
        logger.info("✅ Phase 3: Review complete.")

        return final_response

    async def chat_stream(
        self,
        prompt: str,
        context: Optional[List[dict]] = None,
        rag_context: Optional[List[str]] = None,
        legal_context: Optional[List[str]] = None
    ) -> AsyncGenerator[str, None]:
        """
        For streaming, we typically bypass the heavy multi-agent chain 
        if the user wants immediate feedback, OR we stream the FINAL phase.
        Maia defaults to streaming the direct ResilientLLM result for speed,
        but we use the Orchestrator for complex/requested actions.
        """
        # For simplicity in this implementation, if it's a stream, 
        # we talk to the background provider directly but wrapped in resilience.
        async for chunk in self.provider.generate_stream(prompt, context, rag_context, legal_context):
            yield chunk
