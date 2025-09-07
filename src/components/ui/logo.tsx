import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  forPrint?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 150, 
  height = 60,
  forPrint = false
}) => {
  // Use local logo file
  const logoUrl = "/logo.png";
  
  if (forPrint) {
    // For print, use img tag for better compatibility
    return (
      <img 
        src={logoUrl}
        alt="Sahl Logo"
        width={width}
        height={height}
        className={className}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={logoUrl}
        alt="Sahl Logo"
        fill
        priority
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
};

export default Logo;