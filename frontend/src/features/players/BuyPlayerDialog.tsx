import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Player, PurchaseResult } from '@/api/types';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/form-controls';
import { useClubsQuery } from '@/hooks/useClubs';
import { useBuyPlayer } from '@/hooks/useMarket';
import { brasiliaInputAfterDays, toApiDateTime } from '@/lib/brasilia';
import { formatDateTime, formatMoney } from '@/lib/format';
import { buyPlayerSchema, type BuyPlayerForm } from './player-form.schemas';

const DEFAULT_LOYALTY_DAYS = 365;

function PurchaseSummary({ purchase, onClose }: { purchase: PurchaseResult; onClose: () => void }) {
  const rows = [
    ['Valor pago', formatMoney(purchase.value)],
    ['Taxa de compra', formatMoney(purchase.fee)],
    ['Custo total (valor + taxa)', formatMoney(purchase.value + purchase.fee)],
    ['Fim da fidelidade', formatDateTime(purchase.contract.loyalty_until)],
    ['Novo caixa do clube', formatMoney(purchase.club_cash)],
  ];

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Compra realizada</DialogTitle>
        <DialogDescription>{purchase.player_name} agora faz parte do elenco.</DialogDescription>
      </DialogHeader>
      <dl className="grid gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 border-b pb-2 last:border-0"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <DialogFooter>
        <Button onClick={onClose}>Fechar</Button>
      </DialogFooter>
    </div>
  );
}

function BuyFormContent({ player, onClose }: { player: Player; onClose: () => void }) {
  const clubs = useClubsQuery();
  const { run, isPending } = useBuyPlayer();
  const [purchase, setPurchase] = useState<PurchaseResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuyPlayerForm>({
    resolver: zodResolver(buyPlayerSchema),
    defaultValues: { clubId: '', loyaltyUntil: brasiliaInputAfterDays(DEFAULT_LOYALTY_DAYS) },
  });

  if (purchase) return <PurchaseSummary purchase={purchase} onClose={onClose} />;

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        const result = await run({
          playerId: player.id,
          clubId: Number(values.clubId),
          loyaltyUntil: toApiDateTime(values.loyaltyUntil),
        });
        if (result) setPurchase(result);
      })}
    >
      <DialogHeader>
        <DialogTitle>Comprar {player.name}</DialogTitle>
        <DialogDescription>
          Valor de mercado atual: {formatMoney(player.market_value)}. A taxa e o limite de 50% do
          caixa são conferidos pela API.
        </DialogDescription>
      </DialogHeader>
      <FormField label="Clube comprador" htmlFor="buy-club" error={errors.clubId?.message}>
        <Select id="buy-club" aria-invalid={Boolean(errors.clubId)} {...register('clubId')}>
          <option value="">{clubs.isPending ? 'Carregando clubes…' : 'Selecione o clube…'}</option>
          {clubs.data?.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name} ({club.acronym}) · caixa {formatMoney(club.cash)}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label="Fim da fidelidade (horário de Brasília)"
        htmlFor="buy-loyalty"
        error={errors.loyaltyUntil?.message}
        hint="Precisa ser depois de agora e em até 1.095 dias."
      >
        <Input
          id="buy-loyalty"
          type="datetime-local"
          aria-invalid={Boolean(errors.loyaltyUntil)}
          {...register('loyaltyUntil')}
        />
      </FormField>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Comprando…' : 'Confirmar compra'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface BuyPlayerDialogProps {
  player: Player | null;
  onOpenChange: (open: boolean) => void;
}

export function BuyPlayerDialog({ player, onOpenChange }: BuyPlayerDialogProps) {
  return (
    <Dialog open={player !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {player && <BuyFormContent player={player} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
