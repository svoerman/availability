import { useState } from 'react';
import { useRouter } from 'next/navigation';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiError {
  error: string;
  [key: string]: unknown;
}

interface SubmitOptions<TData> {
  method?: HttpMethod;
  data: TData;
}

interface UseFormSubmitOptions<TResponse> {
  onSuccess?: (data: TResponse) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
}

export function useFormSubmit<TData, TResponse = TData>({ 
  onSuccess, 
  onError, 
  successMessage 
}: UseFormSubmitOptions<TResponse> = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (url: string, { method = 'POST', data }: SubmitOptions<TData>): Promise<TResponse> => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorData = responseData as ApiError;
        throw new Error(errorData.error || 'An error occurred');
      }

      if (onSuccess) {
        onSuccess(responseData);
      }
      
      // Set success message if provided
      if (successMessage) {
        setSuccess(successMessage);
      }
      
      router.refresh();
      return responseData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
    error,
    success,
    setError,
  } as const;
}
