import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface ActionOptions<Input, Result> {
  successMessage?: (result: Result, input: Input) => string;
}

// Executa uma ação de escrita sem permitir um segundo envio enquanto o primeiro não termina.
// Os erros da API viram toast no QueryClient; aqui só garantimos o envio único.
export function useAction<Input, Result>(
  action: (input: Input) => Promise<Result>,
  options: ActionOptions<Input, Result> = {},
) {
  const inFlight = useRef(false);
  const { successMessage } = options;
  const mutation = useMutation({
    mutationFn: (input: Input) => action(input),
    onSuccess: (result, input) => {
      if (successMessage) toast.success(successMessage(result, input));
    },
  });
  const { mutateAsync } = mutation;

  const run = useCallback(
    async (input: Input): Promise<Result | undefined> => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      try {
        return await mutateAsync(input);
      } catch {
        return undefined;
      } finally {
        inFlight.current = false;
      }
    },
    [mutateAsync],
  );

  return { run, isPending: mutation.isPending };
}
