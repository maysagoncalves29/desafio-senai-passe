import { useState } from 'react';
import type { SaleResult, SquadPlayer } from '@/api/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSellPlayer } from '@/hooks/useMarket';
import { formatMoney } from '@/lib/format';

function SaleSummary({ sale, onClose }: { sale: SaleResult; onClose: () => void }) {
  const rows = [
    ['Valor de compra', formatMoney(sale.purchase_value)],
    ['Valor de venda', formatMoney(sale.value)],
    ['Dias restantes de fidelidade', String(sale.remaining_days)],
    ['Multa', `${formatMoney(sale.penalty)} (${sale.penalty_rate}%)`],
    ['Lucro', formatMoney(sale.profit ?? 0)],
    ['Comissão', formatMoney(sale.fee)],
    ['Crédito no caixa', formatMoney(sale.cash_change)],
    ['Novo caixa do clube', formatMoney(sale.club_cash)],
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Venda concluída</DialogTitle>
          <DialogDescription>
            {sale.player_name} voltou a ficar livre. Contrato{' '}
            {sale.contract_status === 'RESCINDIDO' ? 'rescindido' : 'encerrado'}.
          </DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}

interface SellPlayerDialogsProps {
  player: SquadPlayer | null;
  onClose: () => void;
}

export function SellPlayerDialogs({ player, onClose }: SellPlayerDialogsProps) {
  const { run, isPending } = useSellPlayer();
  const [sale, setSale] = useState<SaleResult | null>(null);

  async function confirm() {
    if (!player) return;
    const result = await run(player.id);
    if (result) setSale(result);
    onClose();
  }

  return (
    <>
      <ConfirmDialog
        open={player !== null}
        onOpenChange={(open) => !open && onClose()}
        title={`Vender ${player?.name ?? 'jogador'}?`}
        description={
          player &&
          `O jogador será vendido pelo valor de mercado atual (${formatMoney(player.market_value)}). Vender antes do fim da fidelidade gera multa, e vender com lucro gera comissão.`
        }
        confirmLabel="Confirmar venda"
        destructive
        isPending={isPending}
        onConfirm={() => void confirm()}
      />
      {sale && <SaleSummary sale={sale} onClose={() => setSale(null)} />}
    </>
  );
}
