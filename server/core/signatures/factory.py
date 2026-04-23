import os
import logging
from .base import SignatureProviderBase
from .mock_provider import MockSignatureProvider
from .clicksign import ClicksignProvider

logger = logging.getLogger(__name__)

# Cache the provider instance
_provider_instance: SignatureProviderBase | None = None

def get_signature_provider() -> SignatureProviderBase:
    """
    Factory to retrieve the appropriate digital signature provider.
    Currently returns MockSignatureProvider unless a different one is specified in .env
    """
    global _provider_instance
    if _provider_instance is None:
        provider_name = os.getenv("SIGNATURE_PROVIDER", "mock").lower()
        if provider_name == "mock":
            logger.info("Using MockSignatureProvider.")
            _provider_instance = MockSignatureProvider()
        elif provider_name == "clicksign":
            logger.info("Using ClicksignProvider.")
            _provider_instance = ClicksignProvider()
        else:
            logger.warning(f"Unknown provider '{provider_name}', falling back to MockSignatureProvider.")
            _provider_instance = MockSignatureProvider()
            
    return _provider_instance
