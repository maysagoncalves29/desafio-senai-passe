import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, Skeleton } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<Row> {
  header: string;
  cell: (row: Row) => ReactNode;
  className?: string;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[] | undefined;
  getRowKey: (row: Row) => string | number;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  emptyMessage: string;
  label: string;
}

const SKELETON_ROWS = 5;

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  isLoading,
  error,
  onRetry,
  emptyMessage,
  label,
}: DataTableProps<Row>) {
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
          <span>{error.message}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Table aria-label={label} aria-busy={isLoading}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead key={column.header} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading &&
          Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <TableRow key={index} className="hover:bg-transparent">
              {columns.map((column) => (
                <TableCell key={column.header}>
                  <Skeleton className="h-4 w-full min-w-10" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        {!isLoading && rows?.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {!isLoading &&
          rows?.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.header} className={cn(column.className)}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
