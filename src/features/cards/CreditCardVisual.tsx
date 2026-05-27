import { useState, useRef } from 'react';
import type { CreditCard } from '@/types/database.types';
import { CardNetworkLogo } from '@/components/shared/CardNetworkLogo';
import { BankLogo } from '@/components/shared/BankLogo';

interface CreditCardVisualProps {
  card: CreditCard;
  compact?: boolean;
}

export function CreditCardVisual({ card, compact = false }: CreditCardVisualProps) {
  const gradientBg = `linear-gradient(135deg, ${card.color} 0%, color-mix(in oklab, ${card.color} 45%, black) 100%)`;
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardElement = cardRef.current;
    if (!cardElement) return;
    const rect = cardElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Relative coordinates of pointer to card
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Normalized coordinates (-0.5 to 0.5)
    const px = mouseX / width - 0.5;
    const py = mouseY / height - 0.5;
    
    // Rotate scale factors (max 15 degrees tilt)
    const rotateX = -py * 20;
    const rotateY = px * 20;
    
    // Glare position inside card (percentage coordinates)
    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;
    
    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.28 });
  };

  const handleMouseLeave = () => {
    // Reset to flat
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between overflow-hidden border border-white/10 cursor-pointer ${
        compact ? 'h-36' : 'h-48'
      }`}
      style={{
        background: gradientBg,
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${rotate.x !== 0 ? '1.02' : '1'}, ${rotate.y !== 0 ? '1.02' : '1'}, 1)`,
        transition: rotate.x === 0 ? 'transform 0.5s ease, box-shadow 0.5s ease' : 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
        transformStyle: 'preserve-3d',
        boxShadow: rotate.x !== 0 
          ? `0 25px 50px -12px color-mix(in oklab, ${card.color} 30%, rgba(0,0,0,0.5))` 
          : '0 10px 25px -5px rgba(0,0,0,0.3)',
      }}
    >
      {/* Light sheen layer reflection (Dynamic Glare follow) */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out" 
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 45%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

      <div className="flex justify-between items-start z-10" style={{ transform: 'translateZ(25px)' }}>
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

      <div className="z-10 flex items-center gap-3" style={{ transform: 'translateZ(20px)' }}>
        {/* Metal smart chip */}
        <div className="relative w-8 h-6 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-300 border border-amber-400/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] flex flex-wrap justify-between p-1 opacity-95 shrink-0 overflow-hidden">
          {/* Micro lines representing chip contact plates */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[1px] opacity-30 p-[1.5px] pointer-events-none">
            <div className="border-r border-b border-black/80 rounded-[1px]" />
            <div className="border-r border-b border-black/80" />
            <div className="border-b border-black/80 rounded-[1px]" />
            <div className="border-r border-black/80 rounded-[1px]" />
            <div className="border-r border-black/80" />
            <div className="border-black/80 rounded-[1px]" />
          </div>
          {/* Subtle center gold connection pad */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-1.5 rounded-[2px] bg-amber-400/90 border border-amber-500/20 shadow-sm" />
        </div>
        <div className="text-sm tracking-[0.25em] font-mono select-none opacity-90">
          •••• •••• •••• {card.last_four}
        </div>
      </div>
    </div>
  );
}

