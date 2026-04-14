import React, { useState, useEffect } from 'react';

interface BackgroundLayoutProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
}

const BackgroundLayout: React.FC<BackgroundLayoutProps> = ({ children, variant = 'primary' }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const getGlowColor = () => {
    switch (variant) {
      case 'secondary': return 'rgba(14, 165, 233, 0.25)';
      case 'accent': return 'rgba(236, 72, 153, 0.25)';
      default: return 'rgba(168, 85, 247, 0.25)';
    }
  };

  return (
    <div 
      className="min-h-screen bg-background text-foreground overflow-x-hidden relative selection:bg-primary/30"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Animated Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-blob filter mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-blob animation-delay-2000 filter mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-accent/20 rounded-full blur-[100px] animate-blob animation-delay-4000 filter mix-blend-screen dark:mix-blend-overlay" />
      </div>

      {/* Film Grain Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grain-y.com/wp-content/uploads/2021/02/Grainy-Texture-1.jpg')] bg-repeat" />

      {/* Interactive Cursor Glow */}
      <div 
        className="fixed pointer-events-none w-[800px] h-[800px] rounded-full hidden md:block"
        style={{ 
          left: mousePos.x - 400, 
          top: mousePos.y - 400,
          background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
          transition: 'background 0.5s ease'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default BackgroundLayout;
