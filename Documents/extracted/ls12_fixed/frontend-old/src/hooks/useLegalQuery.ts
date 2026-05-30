import { useState } from 'react';
import { queryLegalSarathi } from '../lib/api';

export function useLegalQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [response, setResponse] = useState<any>(null);

  const ask = async (text: string, lang: string = 'en') => {
    setLoading(true);
    setError(null);
    try {
      const data = await queryLegalSarathi(text, lang);
      setResponse(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return { ask, loading, error, response };
}
