from abc import ABC, abstractmethod

class SignatureProviderBase(ABC):
    """
    Interface definition for all Digital Signature providers.
    Following the Provider pattern allows swapping Mock, DocuSign, ZapSign, Gov.br, etc.
    """

    @abstractmethod
    async def create_envelope(self, document_base64: str, document_name: str, signers: list[dict]) -> dict:
        """
        Creates a signature envelope.
        
        :param document_base64: Base64 encoded PDF string
        :param document_name: Title of the document
        :param signers: List of dicts, e.g., [{"name": "Auth", "email": "a@o.com"}]
        :return: Dictionary containing `envelope_id` and `signature_url` or mapped URLs.
        """
        pass

    @abstractmethod
    async def check_status(self, envelope_id: str) -> str:
        """
        Check the status of an envelope.
        :return: Status string ('pending', 'signed', 'rejected', etc.)
        """
        pass
