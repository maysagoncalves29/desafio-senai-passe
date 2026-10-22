import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { CONDITION_LABELS, type Condition } from '@/lib/domain';

const CONDITION_VARIANTS: Record<Condition, BadgeVariant> = {
  APTO: 'success',
  MAL_CONDICIONADO: 'warning',
  DOENTE: 'destructive',
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  return <Badge variant={CONDITION_VARIANTS[condition]}>{CONDITION_LABELS[condition]}</Badge>;
}
