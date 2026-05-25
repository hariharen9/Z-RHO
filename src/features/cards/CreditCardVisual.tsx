// ============================================================
// ZRHO — Cards: Credit Card Visual
// ============================================================

import type { CreditCard } from '@/types/database.types';
import { CARD_NETWORK_LABELS } from '@/lib/constants';

interface CreditCardVisualProps {
  card: CreditCard;
  compact?: boolean;
}

export function CreditCardVisual({ card, compact = false }: CreditCardVisualProps) {
  return (
    <div
      className={`rounded-xl p-4 text-white relative overflow-hidden ${compact ? 'h-32' : 'h-44'}`}
      style={{
        background: `linear-gradient(135deg, ${card.color}, ${card.color}88)`,
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{card.bank}</p>
          <p className={`opacity-80 ${compact ? 'text-xs' : 'text-sm'}`}>{card.name}</p>
        </div>
        <span className={`font-bold opacity-90 ${compact ? 'text-xs' : 'text-sm'}`}>
          {CARD_NETWORK_LABELS[card.card_network]}
        </span>
      </div>

      <div className={`absolute ${compact ? 'bottom-3' : 'bottom-4'} left-4`}>
        <p className={`font-mono tracking-widest ${compact ? 'text-sm' : 'text-lg'}`}>
          •••• •••• •••• {card.last_four}
        </p>
      </div>
    </div>
  );
}
