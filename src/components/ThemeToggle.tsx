import { Sun, Moon } from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <button
      onClick={toggleTheme}
      className="relative group flex items-center justify-center w-12 h-12 rounded-2xl glass-premium border border-white/20 hover:border-primary/50 transition-all duration-500 shadow-xl overflow-hidden active:scale-95"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <Sun className={`h-6 w-6 text-yellow-500 transition-all duration-700 ${theme === 'light' ? 'rotate-0 scale-100 opacity-100 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'rotate-90 scale-0 opacity-0'}`} />
        <Moon className={`h-5 w-5 text-primary-foreground absolute top-0 left-0 transition-all duration-700 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : '-rotate-90 scale-0 opacity-0'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
