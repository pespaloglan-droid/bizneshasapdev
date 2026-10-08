import React from 'react';
import { LanguageCode } from '../../types';

interface FlagIconProps {
  language: LanguageCode;
  className?: string;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ language, className = 'w-5 h-3.5' }) => {
  switch (language) {
    case 'en':
      // USA Flag (Official colors, stripes and canton)
      return (
        <svg className={`${className} rounded-[2px] shadow-sm border border-black/10`} viewBox="0 0 741 390">
          <rect width="741" height="390" fill="#b22234" />
          <path d="M0,30h741M0,90h741M0,150h741M0,210h741M0,270h741M0,330h741" stroke="#fff" strokeWidth="30" />
          <rect width="296.4" height="210" fill="#3c3b6e" />
          <g fill="#fff">
            {[20, 60, 100, 140, 180, 220, 260].map((x) =>
              [25, 75, 125, 175].map((y) => (
                <circle key={`s1-${x}-${y}`} cx={x} cy={y} r="8" />
              ))
            )}
            {[40, 80, 120, 160, 200, 240].map((x) =>
              [50, 100, 150].map((y) => (
                <circle key={`s2-${x}-${y}`} cx={x} cy={y} r="8" />
              ))
            )}
          </g>
        </svg>
      );

    case 'tr':
      // Turkish Flag (Albayrak)
      return (
        <svg className={`${className} rounded-[2px] shadow-sm border border-black/10`} viewBox="0 0 1200 800">
          <rect width="1200" height="800" fill="#E30A17" />
          <circle cx="430" cy="400" r="200" fill="#ffffff" />
          <circle cx="480" cy="400" r="160" fill="#E30A17" />
          <polygon points="585,400 705,440 660,320 660,480 705,360" fill="#ffffff" />
        </svg>
      );

    case 'tm':
      // Turkmenistan Flag (Green background, vertical carpet stripe, crescent & 5 stars)
      return (
        <svg className={`${className} rounded-[2px] shadow-sm border border-black/10`} viewBox="0 0 1500 1000">
          <rect width="1500" height="1000" fill="#1b7a3a" />
          <rect x="160" width="220" height="1000" fill="#a61c1c" />
          <g fill="#f2c94c">
            <rect x="190" y="80" width="160" height="120" rx="12" fill="#7b1fa2" stroke="#f2c94c" strokeWidth="6" />
            <rect x="190" y="260" width="160" height="120" rx="12" fill="#1976d2" stroke="#f2c94c" strokeWidth="6" />
            <rect x="190" y="440" width="160" height="120" rx="12" fill="#e65100" stroke="#f2c94c" strokeWidth="6" />
            <rect x="190" y="620" width="160" height="120" rx="12" fill="#00897b" stroke="#f2c94c" strokeWidth="6" />
            <rect x="190" y="800" width="160" height="120" rx="12" fill="#d84315" stroke="#f2c94c" strokeWidth="6" />
          </g>
          {/* Crescent */}
          <circle cx="540" cy="220" r="85" fill="#ffffff" />
          <circle cx="575" cy="220" r="75" fill="#1b7a3a" />
          {/* 5 Stars */}
          <g fill="#ffffff">
            <circle cx="650" cy="170" r="15" />
            <circle cx="690" cy="200" r="15" />
            <circle cx="710" cy="245" r="15" />
            <circle cx="690" cy="290" r="15" />
            <circle cx="650" cy="320" r="15" />
          </g>
        </svg>
      );

    case 'ru':
      // Russian Flag (White, Blue, Red horizontal stripes)
      return (
        <svg className={`${className} rounded-[2px] shadow-sm border border-black/10`} viewBox="0 0 900 600">
          <rect width="900" height="200" fill="#ffffff" />
          <rect y="200" width="900" height="200" fill="#0039A6" />
          <rect y="400" width="900" height="200" fill="#D52B1E" />
        </svg>
      );

    default:
      return null;
  }
};
