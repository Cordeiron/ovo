import React from 'react';

export type EggMood = 'happy' | 'nervous' | 'panicked' | 'falling' | 'shielded' | 'cracked';

interface EggCharacterProps {
  hp: number;
  mood: EggMood;
  hasUmbrella?: boolean;
  isHealedPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EggCharacter: React.FC<EggCharacterProps> = ({
  hp,
  mood,
  hasUmbrella = false,
  isHealedPulse = false,
  size = 'lg',
}) => {
  const sizeClass =
    size === 'sm'
      ? 'w-24 h-28'
      : size === 'md'
        ? 'w-32 h-40'
        : 'w-40 h-48 sm:w-44 sm:h-52';

  const motionClass =
    mood === 'cracked'
      ? ''
      : mood === 'panicked' || mood === 'falling'
        ? 'animate-panic-shake'
        : mood === 'nervous'
          ? 'animate-wobble-egg'
          : 'animate-float-slow';

  if (mood === 'cracked' || hp <= 0) {
    return (
      <div className={`relative flex items-center justify-center ${sizeClass} select-none`} aria-label="Ovo quebrado">
        <svg viewBox="0 0 180 180" className="w-full h-full drop-shadow-md">
          {/* Puddle of egg white & yolk */}
          <ellipse cx="90" cy="142" rx="68" ry="22" fill="#FEF9C3" stroke="#1F2937" strokeWidth="3.5" />
          <ellipse cx="92" cy="138" rx="28" ry="14" fill="#FACC15" stroke="#1F2937" strokeWidth="3.5" />
          <ellipse cx="83" cy="133" rx="6" ry="3" fill="#FEF08A" />

          {/* Broken left shell */}
          <path
            d="M36 116 C32 82, 52 54, 82 54 L76 74 L90 86 L74 102 L86 122 C65 128, 42 126, 36 116 Z"
            fill="#FFF7ED"
            stroke="#1F2937"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Broken right shell */}
          <path
            d="M144 118 C148 84, 128 56, 98 56 L104 76 L92 90 L108 106 L96 124 C118 130, 138 128, 144 118 Z"
            fill="#FFF7ED"
            stroke="#1F2937"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Dizzy X eyes on yolk */}
          <path d="M77 134 L84 141 M84 134 L77 141" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M99 134 L106 141 M106 134 L99 141" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M87 146 Q92 142 97 146" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClass} ${motionClass} select-none transition-transform duration-200 ${
        isHealedPulse ? 'scale-105' : ''
      }`}
      aria-label={`Ovo com ${hp}% de vida`}
    >
      {/* Umbrella shield when raining */}
      {hasUmbrella && (
        <svg
          viewBox="0 0 180 90"
          className="absolute -top-11 left-1/2 -translate-x-1/2 w-44 h-24 z-20 pointer-events-none drop-shadow-sm"
        >
          <path
            d="M18 62 C24 18, 156 18, 162 62 Q138 52 114 62 Q90 52 66 62 Q42 52 18 62 Z"
            fill="#F472B6"
            stroke="#1F2937"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M90 18 L90 8" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
          <path d="M90 56 L90 84" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}

      {/* Soft ground shadow */}
      <div className="absolute bottom-1 w-24 h-5 rounded-full bg-[#1F2937]/10 blur-[1px]" />

      <svg viewBox="0 0 160 190" className="w-full h-full drop-shadow-[0_8px_0_rgba(31,41,55,0.12)]">
        {/* Egg Shell */}
        <path
          d="M80 14 C122 14, 144 68, 144 114 C144 152, 118 176, 80 176 C42 176, 16 152, 16 114 C16 68, 38 14, 80 14 Z"
          fill="#FFFDF7"
          stroke="#1F2937"
          strokeWidth="4.5"
        />

        {/* Pastel shell shading */}
        <path
          d="M120 38 C134 62, 138 92, 136 118 C134 148, 110 168, 78 170 C100 164, 120 142, 122 112 C124 84, 120 56, 112 36 Z"
          fill="#FDE68A"
          opacity="0.45"
        />

        {/* Shine highlight */}
        <ellipse cx="52" cy="52" rx="9" ry="16" transform="rotate(-22 52 52)" fill="#FFFFFF" opacity="0.9" />

        {/* Cracks when damaged */}
        {hp < 75 && (
          <path
            d="M114 48 L100 62 L109 73 L95 85"
            fill="none"
            stroke="#1F2937"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {hp < 45 && (
          <>
            <path
              d="M28 96 L44 106 L37 118 L52 126"
              fill="none"
              stroke="#1F2937"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Cute pink band-aid */}
            <g transform="translate(96, 124) rotate(-18)">
              <rect x="0" y="0" width="32" height="14" rx="5" fill="#FDA4AF" stroke="#1F2937" strokeWidth="2.5" />
              <circle cx="10" cy="7" r="1.5" fill="#881337" />
              <circle cx="16" cy="7" r="1.5" fill="#881337" />
              <circle cx="22" cy="7" r="1.5" fill="#881337" />
            </g>
          </>
        )}

        {/* Rosy cheeks */}
        <ellipse cx="48" cy="108" rx="9" ry="5.5" fill="#FDA4AF" opacity="0.7" />
        <ellipse cx="112" cy="108" rx="9" ry="5.5" fill="#FDA4AF" opacity="0.7" />

        {/* Facial Expressions */}
        {mood === 'happy' || mood === 'shielded' ? (
          <>
            {/* Happy eyes */}
            <circle cx="58" cy="92" r="6.5" fill="#1F2937" />
            <circle cx="55.8" cy="89.5" r="2.2" fill="#FFFFFF" />
            <circle cx="102" cy="92" r="6.5" fill="#1F2937" />
            <circle cx="99.8" cy="89.5" r="2.2" fill="#FFFFFF" />
            {/* Smile */}
            <path
              d="M68 106 Q80 118 92 106"
              fill="none"
              stroke="#1F2937"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        ) : mood === 'nervous' ? (
          <>
            {/* Worried eyebrows */}
            <path d="M48 80 L64 85" stroke="#1F2937" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M112 80 L96 85" stroke="#1F2937" strokeWidth="3.2" strokeLinecap="round" />
            {/* Wide eyes */}
            <circle cx="58" cy="94" r="7.5" fill="#FFFFFF" stroke="#1F2937" strokeWidth="3" />
            <circle cx="59" cy="94" r="3.5" fill="#1F2937" />
            <circle cx="102" cy="94" r="7.5" fill="#FFFFFF" stroke="#1F2937" strokeWidth="3" />
            <circle cx="101" cy="94" r="3.5" fill="#1F2937" />
            {/* Wavy mouth */}
            <path
              d="M66 112 Q73 107 80 112 Q87 117 94 112"
              fill="none"
              stroke="#1F2937"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Sweat drop */}
            <path
              d="M126 68 C132 78, 132 86, 126 86 C120 86, 120 78, 126 68 Z"
              fill="#7DD3FC"
              stroke="#1F2937"
              strokeWidth="2.5"
            />
          </>
        ) : (
          <>
            {/* Panicked / falling */}
            <circle cx="57" cy="92" r="9.5" fill="#FFFFFF" stroke="#1F2937" strokeWidth="3.2" />
            <circle cx="57" cy="92" r="3" fill="#1F2937" />
            <circle cx="103" cy="92" r="9.5" fill="#FFFFFF" stroke="#1F2937" strokeWidth="3.2" />
            <circle cx="103" cy="92" r="3" fill="#1F2937" />
            {/* Screaming O mouth */}
            <ellipse cx="80" cy="115" rx="9" ry="12" fill="#FB7185" stroke="#1F2937" strokeWidth="3.5" />
            {/* Sweat drops */}
            <path
              d="M32 66 C38 75, 38 82, 32 82 C26 82, 26 75, 32 66 Z"
              fill="#7DD3FC"
              stroke="#1F2937"
              strokeWidth="2.5"
            />
            <path
              d="M128 62 C134 71, 134 78, 128 78 C122 78, 122 71, 128 62 Z"
              fill="#7DD3FC"
              stroke="#1F2937"
              strokeWidth="2.5"
            />
          </>
        )}
      </svg>
    </div>
  );
};
