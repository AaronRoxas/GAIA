import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

type ThemeToggleProps = {
  className?: string;
  /** Larger hit target for dense toolbars */
  size?: 'default' | 'sm';
};

export function ThemeToggle({ className, size = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'icon'}
      className={cn(
        size === 'sm' && 'h-9 w-9 px-0',
        className,
      )}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      ) : (
        <Moon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      )}
    </Button>
  );
}
