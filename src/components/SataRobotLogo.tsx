import React from 'react';

interface SataRobotLogoProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

export const SataRobotLogo: React.FC<SataRobotLogoProps> = ({
  className = '',
  size = 48,
  glow = true,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        glow ? 'drop-shadow-[0_4px_12px_rgba(0,180,255,0.4)]' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Main App Icon Squircle Background Gradients */}
          <linearGradient id="sata_bg_grad" x1="20" y1="10" x2="180" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#0284C7" />
            <stop offset="70%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          <linearGradient id="sata_gloss_grad" x1="100" y1="10" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Robot White Helmet Gradients */}
          <linearGradient id="sata_helmet_grad" x1="100" y1="45" x2="100" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="75%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Visor Dark Screen Gradient */}
          <linearGradient id="sata_visor_grad" x1="100" y1="70" x2="100" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#051329" />
            <stop offset="50%" stopColor="#0B1E3B" />
            <stop offset="100%" stopColor="#030E1E" />
          </linearGradient>

          {/* Cyan Glow Gradients for Eyes and Accents */}
          <radialGradient id="sata_eye_glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="35%" stopColor="#38BDF8" />
            <stop offset="80%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0284C7" />
          </radialGradient>

          <radialGradient id="sata_eye_core" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#00D2FF" />
          </radialGradient>

          {/* Antenna Top Bead Gradient */}
          <radialGradient id="sata_antenna_glow" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0284C7" />
          </radialGradient>

          {/* Earphone Outer Gradient */}
          <linearGradient id="sata_ear_grad" x1="50" y1="60" x2="50" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Soft Filter Glow for Eyes */}
          <filter id="cyan_glow_filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. App Icon Rounded Background Squircle */}
        <rect
          x="15"
          y="15"
          width="170"
          height="170"
          rx="45"
          fill="url(#sata_bg_grad)"
        />

        {/* Gloss Top Reflection */}
        <path
          d="M 20 60 C 20 35, 35 20, 60 20 L 140 20 C 165 20, 180 35, 180 60 C 180 85, 150 95, 100 95 C 50 95, 20 85, 20 60 Z"
          fill="url(#sata_gloss_grad)"
        />

        {/* Bottom Ambient Wave Layer */}
        <path
          d="M 15 140 Q 60 120 100 135 T 185 130 L 185 140 C 185 165, 165 185, 140 185 L 60 185 C 35 185, 15 165, 15 140 Z"
          fill="#0284C7"
          opacity="0.5"
        />

        {/* 2. Body / Torso and Armor Collar */}
        <g id="robot_body">
          {/* Blue Body Base */}
          <path
            d="M 45 185 Q 55 135 100 135 Q 145 135 155 185 Z"
            fill="#0369A1"
          />
          {/* White Chest Armor Plates */}
          <path
            d="M 52 185 Q 60 142 100 142 Q 140 142 148 185 Z"
            fill="#F8FAFC"
          />
          {/* Center Chest Cyan Accent Line */}
          <path
            d="M 94 150 L 106 150 L 102 180 L 98 180 Z"
            fill="#38BDF8"
          />
          {/* Collar Arc */}
          <path
            d="M 75 142 Q 100 152 125 142 Q 100 147 75 142 Z"
            fill="#CBD5E1"
          />
        </g>

        {/* 3. Earphone / Side Speakers */}
        <g id="robot_ears">
          {/* Left Earphone Outer */}
          <rect x="24" y="65" width="16" height="42" rx="8" fill="url(#sata_ear_grad)" />
          <rect x="34" y="70" width="8" height="32" rx="4" fill="#0284C7" />
          <circle cx="32" cy="86" r="3.5" fill="#38BDF8" />

          {/* Right Earphone Outer */}
          <rect x="160" y="65" width="16" height="42" rx="8" fill="url(#sata_ear_grad)" />
          <rect x="158" y="70" width="8" height="32" rx="4" fill="#0284C7" />
          <circle cx="168" cy="86" r="3.5" fill="#38BDF8" />
        </g>

        {/* 4. Head Antenna */}
        <g id="robot_antenna">
          {/* Antenna Base Stem */}
          <path d="M 97 46 L 103 46 L 102 32 L 98 32 Z" fill="#CBD5E1" />
          {/* Antenna Blue Middle Socket */}
          <rect x="94" y="38" width="12" height="6" rx="3" fill="#0284C7" />
          {/* Top Glowing Cyan Antenna Bead */}
          <circle cx="100" cy="27" r="7" fill="url(#sata_antenna_glow)" filter="url(#cyan_glow_filter)" />
          <circle cx="98" cy="25" r="2.5" fill="#FFFFFF" />
        </g>

        {/* 5. Robot Head Chassis / Helmet */}
        <g id="robot_head">
          {/* Head Main Shape with 3D soft curve */}
          <path
            d="M 40 85 C 40 50, 65 42, 100 42 C 135 42, 160 50, 160 85 C 160 118, 138 132, 100 132 C 62 132, 40 118, 40 85 Z"
            fill="url(#sata_helmet_grad)"
          />

          {/* Helmet Top Highlight Reflection */}
          <path
            d="M 58 58 C 70 48, 100 46, 142 58 C 125 50, 85 48, 58 58 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />

          {/* Forehead Blue Tech Dot / Emblem */}
          <circle cx="100" cy="55" r="3.5" fill="#0284C7" />
          <circle cx="100" cy="55" r="1.8" fill="#38BDF8" />

          {/* 6. Dark Visor Screen */}
          <path
            d="M 48 85 C 48 67, 65 65, 100 65 C 135 65, 152 67, 152 85 C 152 106, 134 112, 100 112 C 66 112, 48 106, 48 85 Z"
            fill="url(#sata_visor_grad)"
          />

          {/* Visor Corner Soft Glass Reflection */}
          <path
            d="M 52 75 Q 80 68 120 71 Q 78 72 52 82 Z"
            fill="#38BDF8"
            opacity="0.35"
          />

          {/* 7. Glowing Cyan Robot Eyes */}
          <g id="robot_eyes" filter="url(#cyan_glow_filter)">
            {/* Left Eye */}
            <circle cx="76" cy="88" r="12" fill="url(#sata_eye_glow)" />
            <circle cx="76" cy="88" r="9" fill="url(#sata_eye_core)" />
            {/* Left Eye Pupil Highlight */}
            <circle cx="73" cy="85" r="3" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx="124" cy="88" r="12" fill="url(#sata_eye_glow)" />
            <circle cx="124" cy="88" r="9" fill="url(#sata_eye_core)" />
            {/* Right Eye Pupil Highlight */}
            <circle cx="121" cy="85" r="3" fill="#FFFFFF" />
          </g>

          {/* Cute Robot Nose/Mouth Cyan Tech Triangle */}
          <path
            d="M 96 99 L 104 99 L 100 104 Z"
            fill="#38BDF8"
            opacity="0.9"
          />

          {/* Chin Seam Line */}
          <path
            d="M 88 120 Q 100 123 112 120"
            stroke="#94A3B8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
