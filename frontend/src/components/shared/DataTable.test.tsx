import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from './DataTable';

interface Row {
  id: number;
  name: string;
}

const columns: Column<Row>[] = [{ header: 'Nome', cell: (row) => row.name }];

function renderTable(overrides: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  return render(
    <DataTable
      label="Teste"
      columns={columns}
      rows={[{ id: 1, name: 'Meia Lua' }]}
      getRowKey={(row) => row.id}
      isLoading={false}
      error={null}
      onRetry={() => undefined}
      emptyMessage="Nada por aqui"
      {...overrides}
    />,
  );
}

describe('DataTable', () => {
  it('mostra as linhas', () => {
    renderTable();
    expect(screen.getByText('Meia Lua')).toBeInTheDocument();
  });

  it('indica o carregamento sem mostrar a mensagem de lista vazia', () => {
    renderTable({ rows: undefined, isLoading: true });
    expect(screen.getByRole('table', { busy: true })).toBeInTheDocument();
    expect(screen.queryByText('Nada por aqui')).not.toBeInTheDocument();
  });

  it('mostra a mensagem de lista vazia', () => {
    renderTable({ rows: [] });
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument();
  });

  it('mostra o erro da API e permite tentar de novo', async () => {
    const onRetry = vi.fn();
    renderTable({ rows: undefined, error: new Error('Jogador não encontrado.'), onRetry });
    expect(screen.getByText('Jogador não encontrado.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
