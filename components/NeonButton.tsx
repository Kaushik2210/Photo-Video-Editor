import React from 'react';

interface NeonButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  onClick, 
  disabled, 
  variant = 'primary', 
  children,
  className = '',
  icon
}) => {
  const baseStyles = "relative px-6 py-3 font-bold uppercase tracking-wider text-sm transition-all duration-300 transform border backdrop-blur-md flex items-center justify-center gap-2 clip-path-slant";
  
  const variants = {
    primary: "bg-neon-purple/10 border-neon-purple text-neon-cyan hover:bg-neon-purple/30 hover:shadow-[0_0_15px_rgba(176,38,255,0.5)]",
    secondary: "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/50",
    danger: "bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105'} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};
