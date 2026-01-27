import { useCallback, useRef, useState } from 'react';
import { ImageParseItem, SSEProgressEvent, SSECompleteEvent, BulkParseResult } from '@/types';

interface UseSSEParserOptions {
  onProgress: (imageId: string, status: 'parsing' | 'success' | 'error', data?: any) => void;
  onComplete: (results: BulkParseResult[]) => void;
  onError: (error: string) => void;
}

interface UseSSEParserReturn {
  startParsing: (images: ImageParseItem[], authToken: string) => Promise<void>;
  cancelParsing: () => void;
  isParsing: boolean;
  isConnected: boolean;
}

export function useSSEParser({
  onProgress,
  onComplete,
  onError
}: UseSSEParserOptions): UseSSEParserReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const parseSSEStream = useCallback(
    async (response: Response): Promise<BulkParseResult[]> => {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let results: BulkParseResult[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Process complete messages, keep incomplete message in buffer
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];

            if (line.startsWith('event: ')) {
              const eventType = line.substring(7);
              const dataLine = lines[++i];

              if (dataLine?.startsWith('data: ')) {
                const data = dataLine.substring(6);

                try {
                  const parsedData = JSON.parse(data);

                  if (eventType === 'start') {
                    setIsConnected(true);
                  } else if (eventType === 'progress') {
                    const progressEvent = parsedData as SSEProgressEvent;
                    onProgress(progressEvent.id, progressEvent.status, {
                      question: progressEvent.question,
                      error: progressEvent.error
                    });
                  } else if (eventType === 'complete') {
                    const completeEvent = parsedData as SSECompleteEvent;
                    results = completeEvent.results;
                  } else if (eventType === 'error') {
                    throw new Error(parsedData.message || 'Unknown error');
                  }
                } catch (e: any) {
                  if (!(e instanceof SyntaxError)) {
                    throw e;
                  }
                }
              }
            }
          }

          // Keep the last incomplete line in buffer
          buffer = lines[lines.length - 1];
        }

        return results;
      } finally {
        reader.releaseLock();
      }
    },
    [onProgress]
  );

  const startParsing = useCallback(
    async (images: ImageParseItem[], authToken: string): Promise<void> => {
      setIsParsing(true);
      setIsConnected(false);
      abortControllerRef.current = new AbortController();

      try {
        const request = {
          images: images.map(img => ({
            id: img.id,
            dataUrl: img.dataUrl
          }))
        };

        const response = await fetch('/api/admin/questions/parse-batch/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to start parsing');
        }

        const results = await parseSSEStream(response);
        onComplete(results);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Request was cancelled by user, not an error
          setIsParsing(false);
          return;
        }

        // For other errors, throw to trigger fallback
        const errorMessage = error.message || 'SSE connection failed';
        onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsParsing(false);
        setIsConnected(false);
      }
    },
    [parseSSEStream, onComplete, onError]
  );

  const cancelParsing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsParsing(false);
    setIsConnected(false);
  }, []);

  return {
    startParsing,
    cancelParsing,
    isParsing,
    isConnected
  };
}
