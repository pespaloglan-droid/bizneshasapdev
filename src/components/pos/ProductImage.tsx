import React from 'react';
import { Product } from '../../types';

interface ProductImageProps {
  type: Product['imageType'];
  className?: string;
  imageUrl?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ type, className = 'w-12 h-12', imageUrl }) => {
  // Eğer yüklenen resim URL'si varsa, onu göster
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="product"
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Yoksa SVG ikon göster
  switch (type) {
    case 'water':
      // Mineral Water 500ml (Blue bottle)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          <rect x="42" y="10" width="16" height="12" rx="3" fill="#2563EB" />
          <rect x="45" y="4" width="10" height="6" rx="2" fill="#1D4ED8" />
          <path d="M38 28 C38 22, 62 22, 62 28 L68 45 C74 55, 74 115, 68 128 C64 135, 36 135, 32 128 C26 115, 26 55, 32 45 Z" fill="#60A5FA" fillOpacity="0.85" stroke="#3B82F6" strokeWidth="2.5" />
          {/* Water lines */}
          <rect x="30" y="60" width="40" height="28" rx="4" fill="#3B82F6" />
          <path d="M36 74 Q50 68 64 74" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 100 L62 100" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      );

    case 'cola':
      // Coca Cola 330ml (Red can)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          <ellipse cx="50" cy="18" rx="26" ry="7" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M24 18 L24 115 C24 125, 76 125, 76 115 L76 18 Z" fill="#DC2626" />
          <ellipse cx="50" cy="115" rx="26" ry="7" fill="#B91C1C" />
          {/* Logo swirl */}
          <path d="M28 55 Q50 78 72 55" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 72 Q50 90 68 70" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <text x="50" y="68" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fontStyle="italic">Coca-Cola</text>
        </svg>
      );

    case 'pepsi':
      // Pepsi 330ml (Blue can)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          <ellipse cx="50" cy="18" rx="26" ry="7" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M24 18 L24 115 C24 125, 76 125, 76 115 L76 18 Z" fill="#1E40AF" />
          <ellipse cx="50" cy="115" rx="26" ry="7" fill="#1E3A8A" />
          {/* Pepsi circle emblem */}
          <circle cx="50" cy="65" r="16" fill="#FFFFFF" />
          <path d="M35 60 C42 52, 58 52, 65 60 C58 66, 42 66, 35 60 Z" fill="#DC2626" />
          <path d="M35 70 C42 76, 58 76, 65 70 C58 64, 42 64, 35 70 Z" fill="#2563EB" />
          <text x="50" y="98" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PEPSI</text>
        </svg>
      );

    case 'orange':
      // Orange Juice 1L (Bottle)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          <rect x="42" y="6" width="16" height="10" rx="2" fill="#16A34A" />
          <path d="M36 22 C36 16, 64 16, 64 22 L68 40 C74 50, 74 120, 68 130 C64 135, 36 135, 32 130 C26 120, 26 50, 32 40 Z" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
          {/* Orange label */}
          <rect x="29" y="55" width="42" height="38" rx="5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="50" cy="72" r="11" fill="#F97316" />
          <circle cx="50" cy="72" r="8" fill="#FDBA74" stroke="#EA580C" strokeWidth="1" />
          <text x="50" y="112" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">100% JUICE</text>
        </svg>
      );

    case 'chips':
      // Potato Chips 40g (Yellow Lay's style bag)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          <path d="M26 18 C24 14, 76 14, 74 18 L80 120 C82 126, 18 126, 20 120 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="2" />
          {/* Top/bottom crimps */}
          <path d="M24 16 Q50 20 76 16" stroke="#A16207" strokeWidth="2.5" strokeDasharray="3 2" />
          <path d="M20 122 Q50 126 80 122" stroke="#A16207" strokeWidth="2.5" strokeDasharray="3 2" />
          {/* Red banner & logo */}
          <ellipse cx="50" cy="65" rx="20" ry="17" fill="#DC2626" />
          <ellipse cx="50" cy="65" rx="15" ry="12" fill="#FACC15" />
          <text x="50" y="69" fill="#B91C1C" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">CHIPS</text>
        </svg>
      );

    case 'chocolate':
      // Chocolate Bar 50g (Brown chocolate block)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          <rect x="22" y="25" width="56" height="85" rx="6" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          {/* Chocolate segments */}
          {[0, 1, 2, 3].map((row) => (
            <React.Fragment key={`choc-row-${row}`}>
              <rect x="28" y={32 + row * 19} width="20" height="14" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="1" />
              <rect x="52" y={32 + row * 19} width="20" height="14" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="1" />
            </React.Fragment>
          ))}
          {/* Silver wrapper on bottom */}
          <path d="M22 85 L78 85 L78 110 L22 110 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
          <rect x="22" y="90" width="56" height="15" fill="#DC2626" />
          <text x="50" y="101" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">CHOCO</text>
        </svg>
      );

    case 'milk':
      // Fresh Milk 1L (Carton)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          {/* Milk Carton Top Peak */}
          <polygon points="26,38 50,14 74,38" fill="#2563EB" />
          <polygon points="50,14 74,38 74,42 50,20" fill="#1D4ED8" />
          {/* Carton Body */}
          <rect x="26" y="38" width="48" height="85" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          {/* Blue bottom band */}
          <path d="M26 80 L74 80 L74 123 L26 123 Z" fill="#3B82F6" />
          {/* Cow silhouette / Drop */}
          <path d="M50 50 C46 58, 42 62, 42 67 C42 72, 46 76, 50 76 C54 76, 58 72, 58 67 C58 62, 54 58, 50 50 Z" fill="#60A5FA" />
          <text x="50" y="102" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MILK 1L</text>
        </svg>
      );

    case 'bread':
      // White Bread (Baked golden loaf with cuts)
      return (
        <svg className={`${className} object-contain`} viewBox="0 0 100 140" fill="none">
          <ellipse cx="50" cy="70" rx="38" ry="24" fill="#D97706" stroke="#B45309" strokeWidth="2.5" />
          <ellipse cx="50" cy="67" rx="34" ry="20" fill="#F59E0B" />
          {/* Diagonal score marks */}
          <path d="M34 56 Q40 68 36 78" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M48 53 Q54 67 50 81" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62 56 Q68 68 64 78" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <div className={`${className} rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs`}>
          ITEM
        </div>
      );
  }
};
