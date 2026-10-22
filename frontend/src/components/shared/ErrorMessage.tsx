import { AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" {...(className ? { className } : {})}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    </Alert>
  );
}
