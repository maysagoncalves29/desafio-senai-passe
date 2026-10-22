import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClub } from '@/api/clubs';
import { createQueryClient } from '@/lib/query-client';
import { CreateClubDialog } from './CreateClubDialog';

vi.mock('@/api/clubs', () => ({ createClub: vi.fn() }));

function renderDialog() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <CreateClubDialog open onOpenChange={() => undefined} />
    </QueryClientProvider>,
  );
}

describe('CreateClubDialog', () => {
  beforeEach(() => {
    vi.mocked(createClub).mockReset();
  });

  it('valida os campos antes de enviar e mostra a mensagem junto ao campo', async () => {
    renderDialog();

    await userEvent.type(screen.getByLabelText('Nome do clube'), 'Ab');
    await userEvent.type(screen.getByLabelText('Sigla (3 letras)'), 'A1');
    await userEvent.click(screen.getByRole('button', { name: 'Criar clube' }));

    expect(await screen.findByText('O nome deve ter de 3 a 60 caracteres')).toBeInTheDocument();
    expect(screen.getByText('A sigla deve ter exatamente 3 letras, de A a Z')).toBeInTheDocument();
    expect(createClub).not.toHaveBeenCalled();
  });

  it('envia a sigla em maiúsculas quando os dados são válidos', async () => {
    vi.mocked(createClub).mockResolvedValue({
      id: 1,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 300,
      squad_value: 0,
      net_worth: 300,
    });
    renderDialog();

    await userEvent.type(screen.getByLabelText('Nome do clube'), 'Águias FC');
    await userEvent.type(screen.getByLabelText('Sigla (3 letras)'), 'agu');
    await userEvent.click(screen.getByRole('button', { name: 'Criar clube' }));

    await waitFor(() =>
      expect(createClub).toHaveBeenCalledWith({ name: 'Águias FC', acronym: 'AGU' }),
    );
  });
});
