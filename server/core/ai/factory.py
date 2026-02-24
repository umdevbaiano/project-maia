"""
Maia Platform — AI Provider Factory
Single point of configuration for swapping AI providers (RNF-09).
"""
from core.ai.base import AIProvider
from core.ai.gemini_provider import GeminiProvider
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
    provider_name = settings.AI_PROVIDER.lower()

    if provider_name not in _PROVIDERS:
        available = ", ".join(_PROVIDERS.keys())
        raise ValueError(
            f"Unknown AI provider '{provider_name}'. Available: {available}"
        )

    if provider_name == "gemini":
        _instance = GeminiProvider(api_key=settings.GEMINI_API_KEY)
    else:
        raise ValueError(f"Provider '{provider_name}' is registered but not configured in factory.")

    print(f"🤖 AI Provider initialized: {provider_name} ({_instance.get_model_name()})")
    return _instance


def reset_provider() -> None:
    """Reset the cached provider (useful for testing or config changes)."""
    global _instance
    _instance = None
