// ============================================================
// ZRHO — Shared: Card Network Vector Logo Renderer
// ============================================================

interface CardNetworkLogoProps {
  network: 'visa' | 'mastercard' | 'amex' | 'rupay' | 'other' | string;
  className?: string;
  size?: number;
}

export function CardNetworkLogo({ network, className = '', size = 32 }: CardNetworkLogoProps) {
  const normNetwork = network.toLowerCase();

  switch (normNetwork) {
    case 'visa':
      return (
        <svg
          width={size * 1.5}
          height={size}
          viewBox="0 0 120 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
        >
          {/* Classic premium italic VISA logo */}
          <path
            d="M34.7 6.1L24.8 33.9H16.8L10.3 12.1C9.8 10.3 8.3 8.3 6.3 7.2C4.1 6 1.1 4.9 0 4.7l0.1-.4h12.5c2.8 0 5.3 1.9 5.9 4.8l2.9 15.6 9.8-23.8H34.7zm17 0.1l-6.1 27.7h-7.7L44 6.2h7.7zm28.8 8.1c0-4.8-6.6-5.1-6.5-7.3 0-.7.7-1.4 2.2-1.6 1.8-.2 6.9.2 9.2 1.3l1.3-6c-2.5-.9-5.7-1.4-8.8-1.4-7.7 0-13.1 4.1-13.2 9.9 0 8.3 11.5 8.7 11.3 13.2 0 1.4-1.6 2.1-3.2 2.3-2.7.3-7.5-.4-10.3-1.7l-1.3 6.2c3 1.4 6.8 1.9 10.5 1.9 8.2-.1 13.5-4.1 13.6-10.3zM116.1 6.2H110c-2.3 0-4.1 1.3-5 3.3L93.7 33.9H86l1.8-4.2h9.6l-8-19.1c-.2-.7-.8-1.5-1.5-2C86.7 7.5 83.1 6.3 80.3 6l.1-.4h15.2c1.7 0 3.2 1.1 3.6 2.7l3.6 17.2 13.3-19.3z"
            fill="currentColor"
          />
        </svg>
      );

    case 'mastercard':
      return (
        <svg
          width={size * 1.3}
          height={size}
          viewBox="0 0 80 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
        >
          {/* Overlapping premium circles */}
          <circle cx="28" cy="25" r="22" fill="#EB001B" opacity="0.9" />
          <circle cx="52" cy="25" r="22" fill="#F79E1B" opacity="0.9" />
          {/* Intersection blending shape */}
          <path
            d="M40 10.3c3.2 4.1 5.1 9.2 5.1 14.7s-1.9 10.6-5.1 14.7c-3.2-4.1-5.1-9.2-5.1-14.7s1.9-10.6 5.1-14.7z"
            fill="#FF5F00"
          />
        </svg>
      );

    case 'amex':
      return (
        <svg
          width={size * 1.5}
          height={size}
          viewBox="0 0 120 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
        >
          {/* Premium American Express Box Logo */}
          <rect width="120" height="40" rx="6" fill="#016FD0" />
          <text
            x="50%"
            y="56%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="white"
            fontSize="15"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2.2"
          >
            AMEX
          </text>
        </svg>
      );

    case 'rupay':
      return (
        <svg
          width={size * 1.6}
          height={size}
          viewBox="0 0 100 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
        >
          {/* Custom vector representation of RuPay */}
          <path
            d="M5 2l12 11.5L5 25h11l12-11.5L16 2H5z"
            fill="#27AE60"
            opacity="0.85"
          />
          <path
            d="M17 2l12 11.5L17 25h11l12-11.5L28 2H17z"
            fill="#E67E22"
            opacity="0.85"
          />
          <text
            x="64"
            y="21"
            fill="currentColor"
            fontSize="16"
            fontWeight="800"
            fontStyle="italic"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            RuPay
          </text>
        </svg>
      );

    default:
      return (
        <svg
          width={size * 1.2}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 text-muted-foreground/60 ${className}`}
        >
          {/* Minimalist modern processor generic chip vector */}
          <rect x="2" y="2" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}
