import { useState, useCallback, useRef } from 'react';

/**
 * Hook Themis de Streaming via Server-Sent Events (SSE).
 * Permite que a UI processe blocos de texto injetando a sensação de "digitação" (Typewriter effect)
 * consumindo diretamente a API FastAPI na rota `/pecas/stream`.
 */
export const useAiStream = () => {
  const [content, setContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // AbortController para permitir cancelamento no meio da geração
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (
    url: string, 
    payload: Record<string, any>, 
    token: string, 
    onComplete?: (finalId?: string) => void
  ) => {
    setIsGenerating(true);
    setContent('');
    setError(null);
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Erro na API SSE: ${response.statusText}`);
      }

      // ReadableStream Reader para processar cada pedaço do chunk assim que cai na rede L7
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      let finalContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunkString = decoder.decode(value, { stream: true });
          // O backend retorna 'data: {"chunk": "conteudo..."}\n\n'
          const lines = chunkString.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''));
                if (data.error) {
                    throw new Error(data.error);
                }
                if (data.chunk) {
                    // Check if it's the done signal
                    if (data.chunk.includes('[MAIA_DONE_ID:')) {
                        const idMatch = data.chunk.match(/\[MAIA_DONE_ID:(.*?)\]/);
                        if (idMatch && onComplete) onComplete(idMatch[1]);
                    } else {
                        finalContent += data.chunk;
                        setContent(finalContent); // Atualiza o estado forçando re-render na tela
                    }
                }
              } catch (e) {
                // Pular parse de dados fragmentados (embora o gerador garanta valid JSON nos SSE chunks)
              }
            }
          }
        }
      }
      setIsGenerating(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream abortada pelo usuário');
      } else {
        setError(err.message || 'Falha ao processar o streaming');
      }
      setIsGenerating(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { content, isGenerating, error, startStream, stopStream };
};
