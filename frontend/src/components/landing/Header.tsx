import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { landingAssets } from '../../constants/landingAssets';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the mobile menu is open
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
    <header className="sticky top-0 z-50 bg-[#f0f4f8] w-full flex items-center justify-center px-4 sm:px-6 lg:px-16 py-3 sm:py-4 shadow-sm">
      <div className="w-full max-w-screen-xl flex items-center justify-between gap-3">
        {/* Company Logo */}
        <Link to="/" className="flex gap-[8px] items-center shrink-0" aria-label="GAIA home">
          <div className="w-[92px] h-[36px] sm:w-[133px] sm:h-[53px]">
            <img
              src={landingAssets.logo.gaia}
              alt="GAIA Logo"
              className="w-full h-full"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-[24px]">
          <Link
            to="/report"
            aria-label="Report a hazard"
            className="bg-[#C75D00] text-white font-inter font-semibold text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] px-[14px] lg:px-[16px] py-[10px] lg:py-[12px] rounded-[10px] lg:rounded-[12px] whitespace-nowrap transition-colors hover:bg-[#B85500] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0a2a4d]"
          >
            Report a Hazard
          </Link>
          <Link
            to="/track"
            className="font-inter font-medium text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] text-[#0a2a4d] whitespace-nowrap transition-colors hover:text-[#005a9c] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#005a9c]"
          >
            Track Report
          </Link>
          <Link
            to="/map"
            className="font-inter font-medium text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] text-[#0a2a4d] whitespace-nowrap transition-colors hover:text-[#005a9c]"
          >
            View Live Map
          </Link>
          <Link
            to={dashboardLink.to}
            className="bg-[#0a2a4d] text-white font-inter font-medium text-[14px] lg:text-[16px] leading-[1.45] tracking-[-0.08px] px-[14px] lg:px-[16px] py-[10px] lg:py-[12px] rounded-[10px] lg:rounded-[12px] whitespace-nowrap transition-colors hover:bg-[#0a2a4d]/90"
          >
            {dashboardLink.label}
          </Link>
        </nav>

        {/* Mobile: primary CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/report"
            aria-label="Report a hazard"
            className="bg-[#C75D00] text-white font-inter font-semibold text-[13px] leading-[1.45] tracking-[-0.08px] px-[12px] py-[8px] rounded-[10px] whitespace-nowrap transition-colors hover:bg-[#B85500] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0a2a4d]"
          >
            Report
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] text-[#0a2a4d] hover:bg-white/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#005a9c]"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 top-[60px] bg-black/30 z-40"
          />
          <nav
            id="mobile-nav"
            aria-label="Mobile primary"
            className="md:hidden absolute top-full left-0 right-0 z-50 bg-[#f0f4f8] border-t border-[#0a2a4d]/10 shadow-lg"
          >
            <ul className="flex flex-col p-4 gap-2 max-w-screen-xl mx-auto">
              <li>
                <Link
                  to="/track"
                  className="block w-full font-inter font-medium text-[16px] text-[#0a2a4d] px-4 py-3 rounded-[10px] hover:bg-white transition-colors"
                >
                  Track Report
                </Link>
              </li>
              <li>
                <Link
                  to="/map"
                  className="block w-full font-inter font-medium text-[16px] text-[#0a2a4d] px-4 py-3 rounded-[10px] hover:bg-white transition-colors"
                >
                  View Live Map
                </Link>
              </li>
              <li>
                <Link
                  to={dashboardLink.to}
                  className="block w-full text-center bg-[#0a2a4d] text-white font-inter font-semibold text-[16px] px-4 py-3 rounded-[10px] transition-colors hover:bg-[#0a2a4d]/90"
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
