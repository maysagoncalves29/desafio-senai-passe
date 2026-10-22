import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const alertVariants = cva('flex items-start gap-3 rounded-lg border p-3 text-sm', {
  variants: {
    variant: {
      info: 'border-border bg-muted-subtle text-foreground',
      warning: 'border-warning-soft-border bg-warning-soft text-warning-soft-foreground',
      destructive:
        'border-destructive-soft-border bg-destructive-soft text-destructive-soft-foreground',
      success: 'border-success-soft-border bg-success-soft text-success-soft-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
});

export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
