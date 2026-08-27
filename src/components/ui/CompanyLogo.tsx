import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Deterministic brand gradient palette based on company name
const GRADIENT_PALETTES = [
  'from-sky-500 to-indigo-600 text-white',
  'from-indigo-500 to-purple-600 text-white',
  'from-emerald-500 to-teal-700 text-white',
  'from-violet-500 to-fuchsia-600 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-rose-500 to-pink-600 text-white',
  'from-blue-600 to-cyan-600 text-white',
];

const getGradientForName = (name: string): string => {
  if (!name) return GRADIENT_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
};

const SIZE_MAP = {
  sm: 'w-8 h-8 rounded-xl text-xs font-bold',
  md: 'w-12 h-12 rounded-2xl text-base font-bold',
  lg: 'w-16 h-16 rounded-2xl text-xl font-extrabold',
  xl: 'w-20 h-20 rounded-3xl text-2xl font-extrabold',
};

const ICON_SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  logoUrl,
  companyName,
  className = '',
  size = 'md',
}) => {
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Validate clean URL
  const trimmedUrl = logoUrl?.trim();
  const isValidUrl =
    !imageError &&
    trimmedUrl &&
    trimmedUrl !== 'null' &&
    trimmedUrl !== 'undefined' &&
    trimmedUrl !== 'https://' &&
    trimmedUrl !== 'http://' &&
    (trimmedUrl.startsWith('http://') ||
      trimmedUrl.startsWith('https://') ||
      trimmedUrl.startsWith('data:image/') ||
      trimmedUrl.startsWith('/'));

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const iconSizeClass = ICON_SIZE_MAP[size] || ICON_SIZE_MAP.md;
  const gradientClass = getGradientForName(companyName);
  const initial = companyName?.trim() ? companyName.trim().charAt(0).toUpperCase() : '';

  if (!isValidUrl) {
    return (
      <div
        className={`${sizeClass} bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-sm select-none shrink-0 border border-white/20 dark:border-white/10 ${className}`}
        aria-label={companyName}
      >
        {initial ? (
          <span className="tracking-tight drop-shadow-sm">{initial}</span>
        ) : (
          <Building2 className={iconSizeClass} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative ${className}`}
    >
      {!loaded && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
        >
          {initial ? (
            <span className="tracking-tight text-white drop-shadow-sm">{initial}</span>
          ) : (
            <Building2 className={`${iconSizeClass} text-white`} />
          )}
        </div>
      )}
      <img
        src={trimmedUrl}
        alt={`${companyName} Logo`}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setImageError(true);
        }}
      />
    </div>
  );
};
