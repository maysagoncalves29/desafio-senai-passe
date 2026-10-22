import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  limit,
  totalItems,
  totalPages,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  const first = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, totalItems);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm"
    >
      <p className="text-muted-foreground">
        {totalItems === 0
          ? `Nenhum ${itemLabel} encontrado`
          : `Mostrando ${first}–${last} de ${totalItems} ${itemLabel}${totalItems === 1 ? '' : 's'} encontrados`}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          Página {totalPages === 0 ? 0 : page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
