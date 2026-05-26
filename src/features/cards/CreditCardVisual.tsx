// ============================================================
// ZRHO — Cards: Credit Card Visual
// ============================================================

import type { CreditCard } from '@/types/database.types';
import { CardNetworkLogo } from '@/components/shared/CardNetworkLogo';
import { BankLogo } from '@/components/shared/BankLogo';

interface CreditCardVisualProps {
  card: CreditCard;
  compact?: boolean;
}

export function CreditCardVisual({ card, compact = false }: CreditCardVisualProps) {
  const gradientBg = `linear-gradient(135deg, ${card.color} 0%, color-mix(in oklab, ${card.color} 45%, black) 100%)`;

  return (
    <div
      className={`relative rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between overflow-hidden border border-white/10 ${
        compact ? 'h-36' : 'h-48'
      }`}
      style={{ background: gradientBg }}
    >
      {/* Light sheen layer reflection */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />

      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-8.5 w-8.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center shrink-0">
            <BankLogo bankName={card.bank} size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-75 font-semibold font-sans leading-none">{card.bank}</p>
            <p className="text-xs font-bold mt-1 tracking-wide leading-tight">{card.name}</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur border border-white/15 px-2.5 py-1 rounded-xl flex items-center justify-center shrink-0">
          <CardNetworkLogo network={card.card_network} size={15} className="text-white" />
        </div>
      </div>

      <div className="z-10 flex items-center gap-3">
        {/* Metal smart chip */}
        <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-amber-200/40 to-amber-400/25 border border-amber-300/10 backdrop-blur flex flex-col justify-center px-1 space-y-0.5 opacity-90 shrink-0">
          <span className="h-0.5 bg-black/10 w-full rounded" />
          <span className="h-0.5 bg-black/10 w-full rounded" />
          <span className="h-0.5 bg-black/10 w-full rounded" />
        </div>
        <div className="text-sm tracking-[0.25em] font-mono select-none opacity-90">
          •••• •••• •••• {card.last_four}
        </div>
      </div>
    </div>
  );
}
