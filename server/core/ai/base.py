"""
Maia Platform — AI Provider Base Class
Abstract base that all AI providers must implement.
Enables Provider Pattern for swapping AI backends (RF-42, RNF-09).
"""
from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        context: list[dict] | None = None,
        rag_context: list[str] | None = None,
    ) -> str:
        """
        Generate a response from the AI model.

        Args:
            prompt: The user's message/question.
            context: Optional list of conversation history dicts
                     with 'role' and 'content' keys.
            rag_context: Optional list of relevant document chunks
                         retrieved from the RAG pipeline.

        Returns:
            The AI-generated response text.
        """
        ...

    @abstractmethod
    def get_model_name(self) -> str:
        """Return the display name of the model being used."""
        ...

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the provider is properly configured (API keys, etc)."""
        ...
