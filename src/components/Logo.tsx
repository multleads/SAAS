'use client';

import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'light' | 'dark';
}

export default function Logo({ className = '', width = 140, height = 45, variant = 'light' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image 
        src="/logo.png" 
        alt="MultLeads" 
        width={width} 
        height={height}
        priority
      />
      <span 
        className="font-bold text-2xl"
        style={{ 
          background: 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        AI
      </span>
    </div>
  );
}

// Simple text version for smaller spaces
export function LogoText({ className = '', variant = 'light' }: { className?: string; variant?: 'light' | 'dark' }) {
  const textColor = variant === 'light' ? 'text-white' : 'text-primary-600';
  
  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span className={`font-bold text-xl ${textColor}`} style={{ letterSpacing: '-0.5px' }}>
        mult
      </span>
      <span className={`font-bold text-xl ${textColor} ml-4`} style={{ letterSpacing: '-0.5px' }}>
        leads→
      </span>
    </div>
  );
}
