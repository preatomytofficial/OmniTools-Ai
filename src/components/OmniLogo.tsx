import React, { useState } from 'react';

interface OmniLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const OmniLogo: React.FC<OmniLogoProps> = ({
  size = 'md',
  className = '',
  showText = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // Dimension classes based on size prop
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }[size];

  return (
    <div className={`relative flex items-center gap-3 select-none ${className}`}>
      {/* Logo Graphic Container */}
      <div
        className={`${sizeClasses} rounded-2xl bg-white p-1 shadow-lg shadow-indigo-500/20 border border-white/80 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 group-hover:shadow-cyan-400/40 transition-all duration-200`}
      >
        {!imgError ? (
          <img
            src="/logo.png"
            alt="OmniTools AI Official Logo"
            className="w-full h-full object-contain pointer-events-none"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          /* High-Fidelity SVG Fallback matching the official emblem */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="omniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D2FF" />
                <stop offset="50%" stopColor="#0066FF" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            {/* Outer Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="url(#omniGrad)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Inner T Bar */}
            <path
              d="M32 38 H68 M50 38 V68"
              stroke="url(#omniGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Sparkle */}
            <path
              d="M78 16 L80 22 L86 24 L80 26 L78 32 L76 26 L70 24 L76 22 Z"
              fill="#00D2FF"
            />
          </svg>
        )}
      </div>

      {/* Typography if requested */}
      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
              OmniTools{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Offline
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            ALL TOOLS. ONE PLATFORM.
          </p>
        </div>
      )}
    </div>
  );
};
