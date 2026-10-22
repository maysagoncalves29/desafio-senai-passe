import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '@/lib/query-client';
import { useAction } from './useAction';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe('useAction', () => {
  it('envia a ação uma só vez mesmo com cliques seguidos', async () => {
    let finish: (value: string) => void = () => undefined;
    const action = vi.fn(() => new Promise<string>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useAction(action), { wrapper });

    let first: Promise<string | undefined> = Promise.resolve(undefined);
    let second: Promise<string | undefined> = Promise.resolve(undefined);
    await act(async () => {
      first = result.current.run(undefined);
      second = result.current.run(undefined);
    });

    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => finish('ok'));
    expect(await first).toBe('ok');
    expect(await second).toBeUndefined();
  });

  it('libera um novo envio depois que o anterior termina com erro', async () => {
    const action = vi.fn().mockRejectedValueOnce(new Error('409')).mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useAction(action), { wrapper });

    await act(async () => {
      expect(await result.current.run(undefined)).toBeUndefined();
    });
    await act(async () => {
      expect(await result.current.run(undefined)).toBe('ok');
    });
    expect(action).toHaveBeenCalledTimes(2);
  });
});
