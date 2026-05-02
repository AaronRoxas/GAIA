import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { landingAssets } from '../../constants/landingAssets';
import { ThemeToggle } from '../ThemeToggle';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  const dashboardLink = user
    ? { to: '/dashboard', label: 'Dashboard' }
    : { to: '/login', label: 'Login' };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 border-b border-border w-full flex items-center justify-center px-4 sm:px-6 lg:px-16 py-3 sm:py-4 shadow-sm">
      <div className="w-full max-w-screen-xl flex items-center justify-between gap-3">
        <Link to="/" className="flex gap-[8px] items-center shrink-0" aria-label="GAIA home">
          <div className="w-[133px] sm:w-[133px] lg:w-[150px] xl:w-[170px]">
            <img
              src={landingAssets.logo.gaia}
              alt="AGAILA Logo"
              className="w-full h-full"
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2 lg:gap-[24px]">
          <ThemeToggle className="text-foreground shrink-0 hover:bg-secondary" />
          <Link
            to="/report"
            aria-label="Report a hazard"
            className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-inter font-semibold text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] px-[14px] lg:px-[16px] py-[10px] lg:py-[12px] rounded-[10px] lg:rounded-[12px] whitespace-nowrap shadow-md transition-all hover:shadow-lg hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Report a Hazard
          </Link>
          <Link
            to="/track"
            className="font-inter font-medium text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] text-foreground whitespace-nowrap transition-colors hover:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Track Report
          </Link>
          <Link
            to="/map"
            className="font-inter font-medium text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] text-foreground whitespace-nowrap transition-colors hover:text-secondary"
          >
            View Live Map
          </Link>
          <Link
            to={dashboardLink.to}
            className="bg-primary text-primary-foreground font-inter font-medium text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] px-[14px] lg:px-[16px] py-[10px] lg:py-[12px] rounded-[10px] lg:rounded-[12px] whitespace-nowrap transition-colors hover:bg-primary/90"
          >
            {dashboardLink.label}
          </Link>
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle size="sm" className="text-foreground shrink-0" />
          <Link
            to="/report"
            aria-label="Report a hazard"
            className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-inter font-semibold text-[13px] leading-[1.45] tracking-[-0.08px] px-[12px] py-[8px] rounded-[10px] whitespace-nowrap shadow-md transition-all hover:shadow-lg hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Report
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 top-[60px] bg-black/30 z-40"
          />
          <nav
            id="mobile-nav"
            aria-label="Mobile primary"
            className="md:hidden absolute top-full left-0 right-0 z-50 bg-background border-t border-border shadow-lg"
          >
            <ul className="flex flex-col p-4 gap-2 max-w-screen-xl mx-auto">
              <li>
                <Link
                  to="/track"
                  className="block w-full font-inter font-medium text-[16px] text-foreground px-4 py-3 rounded-[10px] hover:bg-muted transition-colors"
                >
                  Track Report
                </Link>
              </li>
              <li>
                <Link
                  to="/map"
                  className="block w-full font-inter font-medium text-[16px] text-foreground px-4 py-3 rounded-[10px] hover:bg-muted transition-colors"
                >
                  View Live Map
                </Link>
              </li>
              <li>
                <Link
                  to={dashboardLink.to}
                  className="block w-full text-center bg-primary text-primary-foreground font-inter font-semibold text-[16px] px-4 py-3 rounded-[10px] transition-colors hover:bg-primary/90"
                >
                  {dashboardLink.label}
                </Link>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  );
};
