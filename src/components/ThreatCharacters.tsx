import React from 'react';
import { ThreatType } from '../types/game';

interface ThreatIllustrationProps {
  type: ThreatType;
  className?: string;
}

export const ThreatIllustration: React.FC<ThreatIllustrationProps> = ({ type, className = 'w-20 h-20' }) => {
  switch (type) {
    case 'cat':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          {/* Mischievous Pastel Orange Cat */}
          <polygon points="22,42 18,14 42,28" fill="#FDBA74" stroke="#1F2937" strokeWidth="3.5" strokeLinejoin="round" />
          <polygon points="78,42 82,14 58,28" fill="#FDBA74" stroke="#1F2937" strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="50" cy="54" r="30" fill="#FED7AA" stroke="#1F2937" strokeWidth="3.5" />
          <path d="M26 42 L34 45 M74 42 L66 45" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          {/* Mischievous eyes */}
          <ellipse cx="38" cy="52" rx="4.5" ry="6" fill="#1F2937" />
          <ellipse cx="62" cy="52" rx="4.5" ry="6" fill="#1F2937" />
          <circle cx="37" cy="50" r="1.5" fill="#FFFFFF" />
          <circle cx="61" cy="50" r="1.5" fill="#FFFFFF" />
          {/* Whiskers */}
          <path d="M12 56 L28 58 M12 64 L28 63 M88 56 L72 58 M88 64 L72 63" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          {/* Nose & smirk */}
          <polygon points="46,60 54,60 50,65" fill="#FB7185" stroke="#1F2937" strokeWidth="2" />
          <path d="M42 69 Q50 75 58 69" fill="none" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'dog':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          {/* Hyperactive Caramelo Dog */}
          <ellipse cx="22" cy="52" rx="11" ry="20" transform="rotate(14 22 52)" fill="#D97706" stroke="#1F2937" strokeWidth="3.5" />
          <ellipse cx="78" cy="52" rx="11" ry="20" transform="rotate(-14 78 52)" fill="#D97706" stroke="#1F2937" strokeWidth="3.5" />
          <circle cx="50" cy="52" r="28" fill="#FCD34D" stroke="#1F2937" strokeWidth="3.5" />
          <ellipse cx="50" cy="64" rx="16" ry="12" fill="#FEF3C7" stroke="#1F2937" strokeWidth="2.5" />
          <circle cx="39" cy="46" r="4.5" fill="#1F2937" />
          <circle cx="61" cy="46" r="4.5" fill="#1F2937" />
          <ellipse cx="50" cy="58" rx="6" ry="4.5" fill="#1F2937" />
          {/* Happy tongue */}
          <path d="M44 68 C44 82, 56 82, 56 68 Z" fill="#FB7185" stroke="#1F2937" strokeWidth="2.5" />
        </svg>
      );

    case 'rain':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <path
            d="M26 54 C14 54, 12 36, 26 34 C30 20, 52 16, 62 28 C76 24, 88 38, 78 54 Z"
            fill="#93C5FD"
            stroke="#1F2937"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M32 66 L26 82 M50 66 L44 84 M68 66 L62 82" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'hen':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          {/* Angry Mama Hen */}
          <path d="M40 24 C38 12, 48 12, 50 22 C54 10, 64 14, 60 26 Z" fill="#EF4444" stroke="#1F2937" strokeWidth="3" />
          <circle cx="50" cy="55" r="28" fill="#FFFBEB" stroke="#1F2937" strokeWidth="3.5" />
          {/* Angry brows */}
          <path d="M32 42 L44 47 M68 42 L56 47" stroke="#1F2937" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="38" cy="51" r="4" fill="#1F2937" />
          <circle cx="62" cy="51" r="4" fill="#1F2937" />
          {/* Beak */}
          <polygon points="44,58 56,58 50,70" fill="#F59E0B" stroke="#1F2937" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      );

    case 'pigeon':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <path d="M18 46 Q34 26 50 48 Q66 26 82 46 Q68 68 50 66 Q32 68 18 46 Z" fill="#CBD5E1" stroke="#1F2937" strokeWidth="3.5" />
          <circle cx="50" cy="40" r="14" fill="#94A3B8" stroke="#1F2937" strokeWidth="3.5" />
          <circle cx="45" cy="38" r="2.5" fill="#1F2937" />
          <circle cx="55" cy="38" r="2.5" fill="#1F2937" />
          <polygon points="47,42 53,42 50,49" fill="#FBBF24" stroke="#1F2937" strokeWidth="2.5" />
        </svg>
      );

    case 'falling':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <path d="M22 22 L22 50 M50 14 L50 44 M78 22 L78 50" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" strokeDasharray="5 5" />
          <path d="M40 58 L50 72 L60 58" fill="none" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="50" cy="84" rx="26" ry="7" fill="#FCA5A5" stroke="#1F2937" strokeWidth="3" />
        </svg>
      );

    case 'thief':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <circle cx="50" cy="54" r="28" fill="#FDE68A" stroke="#1F2937" strokeWidth="3.5" />
          {/* Black beanie */}
          <path d="M22 44 C22 20, 78 20, 78 44 Z" fill="#334155" stroke="#1F2937" strokeWidth="3.5" />
          {/* Bandit mask */}
          <rect x="24" y="45" width="52" height="16" rx="8" fill="#1F2937" />
          <circle cx="38" cy="53" r="3.5" fill="#FFFFFF" />
          <circle cx="62" cy="53" r="3.5" fill="#FFFFFF" />
          <path d="M42 70 Q50 66 58 70" fill="none" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'ufo':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <polygon points="34,54 66,54 80,88 20,88" fill="#86EFAC" opacity="0.65" />
          <path d="M32 42 C32 24, 68 24, 68 42 Z" fill="#A5F3FC" stroke="#1F2937" strokeWidth="3.5" />
          <ellipse cx="50" cy="48" rx="36" ry="12" fill="#A78BFA" stroke="#1F2937" strokeWidth="3.5" />
          <circle cx="34" cy="48" r="3" fill="#FEF08A" />
          <circle cx="50" cy="50" r="3" fill="#FEF08A" />
          <circle cx="66" cy="48" r="3" fill="#FEF08A" />
        </svg>
      );

    case 'frying_pan':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <rect x="64" y="44" width="28" height="10" rx="5" transform="rotate(-20 64 44)" fill="#F97316" stroke="#1F2937" strokeWidth="3" />
          <circle cx="42" cy="56" r="26" fill="#475569" stroke="#1F2937" strokeWidth="3.5" />
          <circle cx="42" cy="56" r="18" fill="#334155" />
          <path d="M32 26 Q36 16 32 10 M46 24 Q50 14 46 8" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'wind':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <path d="M16 40 L64 40 C74 40, 74 26, 62 26" fill="none" stroke="#06B6D4" strokeWidth="5" strokeLinecap="round" />
          <path d="M12 56 L78 56 C88 56, 88 70, 74 70" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" />
          <path d="M24 72 L52 72" fill="none" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'mosquito':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <ellipse cx="42" cy="42" rx="14" ry="8" transform="rotate(-30 42 42)" fill="#E0F2FE" stroke="#1F2937" strokeWidth="2.5" />
          <ellipse cx="58" cy="42" rx="14" ry="8" transform="rotate(30 58 42)" fill="#E0F2FE" stroke="#1F2937" strokeWidth="2.5" />
          <ellipse cx="50" cy="56" rx="10" ry="18" fill="#84CC16" stroke="#1F2937" strokeWidth="3" />
          <path d="M50 74 L50 90" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          <circle cx="46" cy="48" r="2.5" fill="#1F2937" />
          <circle cx="54" cy="48" r="2.5" fill="#1F2937" />
        </svg>
      );

    case 'paparazzi':
      return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
          <rect x="20" y="34" width="60" height="40" rx="10" fill="#A855F7" stroke="#1F2937" strokeWidth="3.5" />
          <rect x="36" y="24" width="28" height="10" rx="4" fill="#FACC15" stroke="#1F2937" strokeWidth="3" />
          <circle cx="50" cy="54" r="13" fill="#E0F2FE" stroke="#1F2937" strokeWidth="3.5" />
          <circle cx="50" cy="54" r="6" fill="#1F2937" />
          <path d="M12 20 L22 26 M88 20 L78 26 M50 10 L50 18" stroke="#FACC15" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
  }
};
