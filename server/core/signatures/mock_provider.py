import uuid
from .base import SignatureProviderBase

class MockSignatureProvider(SignatureProviderBase):
    """
    Mock implementation of a Signature Provider.
    Simulates creating an envelope and generating a fake URL for local testing.
    """

    async def create_envelope(self, document_base64: str, document_name: str, signers: list[dict]) -> dict:
        envelope_id = str(uuid.uuid4())
        # In a real provider, this URL points to the 3rd party signing screen
        # Here we mock it to a local or imaginary URL, or just a placeholder string
        mock_sign_url = f"https://maia-mock-signature.com/sign/{envelope_id}"
        
        return {
            "envelope_id": envelope_id,
            "signature_url": mock_sign_url,
            "status": "pending"
        }

    async def check_status(self, envelope_id: str) -> str:
        # For the mock, we can just say "signed" or "pending"
        return "signed"
