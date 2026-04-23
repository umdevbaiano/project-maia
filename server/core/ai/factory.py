"""
Maia Platform — AI Provider Factory
Single point of configuration for swapping AI providers (RNF-09).
"""
from core.ai.base import AIProvider
from core.ai.gemini_provider import GeminiProvider
from core.ai.fallback import ResilientLLM
from config import get_settings


# Registry of available providers
_PROVIDERS: dict[str, type] = {
    "gemini": GeminiProvider,
}

# Singleton instance cache
_instance: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    """
    Get the configured AI provider instance (singleton).
    The provider is determined by the AI_PROVIDER setting.

    To add a new provider:
    1. Create a new class implementing AIProvider
    2. Register it in _PROVIDERS dict
    3. Set AI_PROVIDER env var to the new key
    """
    global _instance

    if _instance is not None:
        return _instance

    settings = get_settings()
    
    # 1. Initialize Primary Provider (Gemini)
    primary = GeminiProvider(api_key=settings.GEMINI_API_KEY)
    
    # 2. Wrap in ResilientLLM (for future fallbacks)
    _instance = ResilientLLM(providers=[primary])

    print(f"🤖 AI Core initialized: {primary.get_model_name()} (Resilient Mode Active)")
    return _instance


def reset_provider() -> None:
    """Reset the cached provider (useful for testing or config changes)."""
    global _instance
    _instance = None
