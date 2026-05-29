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
          width={size * 2.2}
          height={size}
          viewBox="0 0 1000 324"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
        >
          {/* Wikipedia premium classic Visa logo (2005-2014) */}
          <g transform="matrix(4.4299631,0,0,4.4299631,-81.165783,-105.04783)">
            <polygon
              points="116.145,95.719 97.858,95.719 109.296,24.995 127.582,24.995"
              fill="#00579f"
            />
            <path
              d="m 182.437,26.724 c -3.607,-1.431 -9.328,-3.011 -16.402,-3.011 -18.059,0 -30.776,9.63 -30.854,23.398 -0.15,10.158 9.105,15.8 16.027,19.187 7.075,3.461 9.48,5.72 9.48,8.805 -0.072,4.738 -5.717,6.922 -10.982,6.922 -7.301,0 -11.213,-1.126 -17.158,-3.762 l -2.408,-1.13 -2.559,15.876 c 4.289,1.954 12.191,3.688 20.395,3.764 19.188,0 31.68,-9.481 31.828,-24.153 0.073,-8.051 -4.814,-14.22 -15.35,-19.261 -6.396,-3.236 -10.313,-5.418 -10.313,-8.729 0.075,-3.01 3.313,-6.093 10.533,-6.093 5.945,-0.151 10.313,1.278 13.622,2.708 l 1.654,0.751 2.487,-15.272 0,0 z"
              fill="#00579f"
            />
            <path
              d="m 206.742,70.664 c 1.506,-4.063 7.301,-19.788 7.301,-19.788 -0.076,0.151 1.503,-4.138 2.406,-6.771 l 1.278,6.094 c 0,0 3.463,16.929 4.215,20.465 -2.858,0 -11.588,0 -15.2,0 l 0,0 z m 22.573,-45.669 -14.145,0 c -4.362,0 -7.676,1.278 -9.558,5.868 l -27.163,64.855 19.188,0 c 0,0 3.159,-8.729 3.838,-10.609 2.105,0 20.771,0 23.479,0 0.525,2.483 2.182,10.609 2.182,10.609 l 16.932,0 -14.753,-70.723 0,0 z"
              fill="#00579f"
            />
            <path
              d="M 82.584,24.995 64.675,73.222 62.718,63.441 C 59.407,52.155 49.023,39.893 37.435,33.796 l 16.404,61.848 19.338,0 28.744,-70.649 -19.337,0 0,0 z"
              fill="#00579f"
            />
            <path
              d="m 48.045,24.995 -29.422,0 -0.301,1.429 c 22.951,5.869 38.151,20.016 44.396,37.02 L 56.322,30.94 c -1.053,-4.517 -4.289,-5.796 -8.277,-5.945 l 0,0 z"
              fill="#faa61a"
            />
          </g>
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
