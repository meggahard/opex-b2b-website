'use client';

import React, { memo } from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'light' | 'dark';
}

const AppLogo = memo(function AppLogo({
  size = 64,
  className = '',
  onClick,
  variant = 'default',
}: AppLogoProps) {
  const scale = size / 64;
  const width = Math.round(160 * scale);
  const height = Math.round(40 * scale);

  return (
    <div
      className={`inline-flex items-center flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label="OpEx Strategy — Home"
    >
      {/* Rectangle container with dark navy border */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0',
          border: '2px solid #1a2744',
          borderRadius: '6px',
          overflow: 'hidden',
          height: `${height}px`,
        }}
      >
        {/* OpEx block — dark navy background */}
        <div
          style={{
            background: '#1a2744',
            padding: `0 ${Math.round(10 * scale)}px`,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontWeight: 900,
              fontSize: `${Math.round(16 * scale)}px`,
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-plus-jakarta-sans), system-ui, sans-serif',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            OpEx
          </span>
        </div>
        {/* Strategy block — white background */}
        <div
          style={{
            background: '#ffffff',
            padding: `0 ${Math.round(10 * scale)}px`,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: '#C9A227',
              fontWeight: 700,
              fontSize: `${Math.round(14 * scale)}px`,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              letterSpacing: '0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Strategy
          </span>
        </div>
      </div>
    </div>
  );
});

export default AppLogo;
