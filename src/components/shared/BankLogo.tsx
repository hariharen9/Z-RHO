// ============================================================
// ZRHO — Shared: Bank Brand Vector Logo Renderer
// ============================================================

import { Landmark } from 'lucide-react';

interface BankLogoProps {
  bankName: string;
  className?: string;
  size?: number;
}

export function BankLogo({ bankName, className = '', size = 18 }: BankLogoProps) {
  const normName = bankName.toLowerCase();

  // 1. Chase Octagon Logo
  if (normName.includes('chase')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <path d="M20 2L38 20L20 38L2 20L20 2Z" stroke="#005B9C" strokeWidth="3" />
        <path d="M20 9L31 20L20 31L9 20L20 9Z" fill="#005B9C" />
      </svg>
    );
  }

  // 2. SBI Keyhole Circle Logo
  if (normName.includes('sbi') || normName.includes('state bank')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <circle cx="20" cy="20" r="16" fill="#00B3E3" />
        <circle cx="20" cy="20" r="6" fill="#1C1C1E" />
        <rect x="18" y="20" width="4" height="16" fill="#1C1C1E" />
      </svg>
    );
  }

  // 3. HDFC Geometric Square Logo
  if (normName.includes('hdfc')) {
    return (
      <svg
        width={size * 2}
        height={size}
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        {/* Blue box with custom HDFC style */}
        <rect width="80" height="40" rx="4" fill="#003366" />
        <rect x="30" y="8" width="20" height="24" fill="#E31E24" />
        <rect x="36" y="14" width="8" height="12" fill="#003366" />
      </svg>
    );
  }

  // 4. ICICI Geometric Crest Logo
  if (normName.includes('icici')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        {/* Sleek copper/gold geometric shield representing ICICI */}
        <path d="M20 2L35 10V25C35 32 20 38 20 38C20 38 5 32 5 25V10L20 2Z" fill="#B9770E" />
        <path d="M20 8L30 14V23C30 28 20 33 20 33C20 33 10 28 10 23V14L20 8Z" fill="#F39C12" />
        <circle cx="20" cy="19" r="4" fill="white" />
      </svg>
    );
  }

  // 5. Citi Red Arch Logo
  if (normName.includes('citi')) {
    return (
      <svg
        width={size * 1.5}
        height={size}
        viewBox="0 0 60 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <circle cx="18" cy="24" r="10" stroke="#003B70" strokeWidth="4" />
        {/* Red arch over Citi */}
        <path d="M8 18C18 6 42 6 52 18" stroke="#FF0000" strokeWidth="4" strokeLinecap="round" />
        <rect x="32" y="14" width="16" height="20" fill="#003B70" rx="2" />
      </svg>
    );
  }

  // 6. HSBC Hexagons Logo
  if (normName.includes('hsbc')) {
    return (
      <svg
        width={size * 1.4}
        height={size}
        viewBox="0 0 56 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        {/* Double-triangle hexagonal crest */}
        <rect width="56" height="40" rx="4" fill="#DB1422" />
        <path d="M12 20L22 10H34L44 20L34 30H22L12 20Z" fill="white" />
        <path d="M22 10L28 20L22 30H34L28 20L34 10H22Z" fill="#DB1422" />
      </svg>
    );
  }

  // Default Bank Landmark Icon
  return (
    <Landmark
      size={size}
      className={`text-muted-foreground/80 shrink-0 ${className}`}
      strokeWidth={2}
    />
  );
}
