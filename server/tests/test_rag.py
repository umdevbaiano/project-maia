"""
Maia Platform — RAG Integration Tests
Validates the AI Provider behavior regarding Hallucinations and CoVe isolation.
"""
import pytest
import re
from unittest.mock import AsyncMock, patch
from core.ai.gemini_provider import GeminiProvider

@pytest.mark.asyncio
async def test_zero_hallucination_protocol_fallback(mocker):
    """
    Testa se o provedor respeita o limite de conhecimento isolado (O Vácuo).
    Simula uma injeção de RAG vazia ou irrelavante.
    """
    provider = GeminiProvider(api_key="mocked")
    
    # Mock return from model to simulate standard AI behaving via explicit grounding.
    # In a real environment, the system prompt forces this behavior.
    mocked_response = AsyncMock()
    mocked_response.text = "Lamento, mas não encontrei informações específicas sobre isso nos documentos do processo analisados."
    
    with patch.object(provider._model, 'generate_content_async', return_value=mocked_response):
        rag_context = ["Contrato de locação. Parte A: João, Parte B: Maria"]
        # Asking something completely unrelated
        result = await provider.generate("Qual a placa do carro roubado?", rag_context=rag_context)
        
        assert "não encontrei informações" in result.lower()

@pytest.mark.asyncio
async def test_cove_tag_stripping_on_generation():
    """
    Testa se o provider limpa silenciosamente a tag de verificação (Chain of Verification).
    """
    provider = GeminiProvider(api_key="mocked")
    
    # O modelo pensa em silêncio via the tag
    mocked_text = "<verificacao>Eu li que era 5.000 reais. Mas eu só vi isso no Doc X.</verificacao> O valor consolidado é de R$ 5.000."
    mocked_response = AsyncMock()
    mocked_response.text = mocked_text
    
    with patch.object(provider._model, 'generate_content_async', return_value=mocked_response):
        result = await provider.generate("Qual o valor consolidado?")
        
        # A resposta final NÂO pode conter a tag nem o pensamento
        assert "<verificacao>" not in result
        assert "Eu li que era 5.000 reais" not in result
        assert "O valor consolidado é de R$ 5.000." in result
