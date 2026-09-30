import React from 'react';

interface CappLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  animated?: boolean;
  glowing?: boolean;
}

export const CappLogo: React.FC<CappLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  animated = false,
  glowing = false,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', text: 'text-base', svg: 28 },
    md: { box: 'w-9 h-9', text: 'text-lg', svg: 36 },
    lg: { box: 'w-14 h-14', text: 'text-2xl', svg: 56 },
    xl: { box: 'w-20 h-20', text: 'text-3xl', svg: 80 },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${current.box} rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-950 p-[1px] shadow-lg shadow-black/40 ring-1 ring-white/10 flex items-center justify-center overflow-hidden group ${
          animated ? 'hover:scale-105 transition-transform duration-300' : ''
        }`}
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/20 via-transparent to-transparent opacity-70" />
        
        {/* Futuristic C Icon */}
        <svg
          width={current.svg * 0.75}
          height={current.svg * 0.75}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:rotate-3"
        >
          <defs>
            <linearGradient id="cappGradient" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.6" stopColor="#D4D4D8" />
              <stop offset="1" stopColor="#71717A" />
            </linearGradient>
            <linearGradient id="innerGlow" x1="20" y1="8" x2="20" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="1" stopColor="#A1A1AA" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Outer Stylized 'C' with high-tech cutouts */}
          <path
            d="M 28 8.5 C 25.5 6.8 22.5 6 19 6 C 11.268 6 5 12.268 5 20 C 5 27.732 11.268 34 19 34 C 22.5 34 25.5 33.2 28 31.5 C 28.8 30.9 29 29.8 28.4 29 C 27.8 28.2 26.7 28 25.9 28.5 C 24 29.8 21.6 30.5 19 30.5 C 13.201 30.5 8.5 25.799 8.5 20 C 8.5 14.201 13.201 9.5 19 9.5 C 21.6 9.5 24 10.2 25.9 11.5 C 26.7 12 27.8 11.8 28.4 11 C 29 10.2 28.8 9.1 28 8.5 Z"
            fill="url(#cappGradient)"
          />

          {/* Inner futuristic core diamond / node */}
          <circle cx="27" cy="20" r="3" fill="#FFFFFF" className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          <path
            d="M 21 20 H 25"
            stroke="url(#innerGlow)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Ambient subtle light sheen */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-extrabold tracking-tight text-white ${current.text}`}>
              CAPP
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/60">
              AI
            </span>
          </div>
          <span className="text-[10px] tracking-wide text-neutral-400 font-medium hidden sm:inline-block mt-0.5">
            Think smarter. Create more.
          </span>
        </div>
      )}
    </div>
  );
};
