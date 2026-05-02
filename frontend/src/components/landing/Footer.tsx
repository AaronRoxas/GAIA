import React from 'react';
import { Link } from 'react-router-dom';
import { landingAssets } from '../../constants/landingAssets';


export const Footer: React.FC = () => {
  const navigationLinks = [
    { label: 'Home', to: '/' },
    { label: 'Documentation', to: 'https://github.com/AlexisRellon/GAIA/blob/main/README.md' },
    { label: 'Hazard Map', to: '/map' },
    { label: 'Status', to: '/status' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#171717]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 overflow-visible py-10 sm:py-12">
          {/* Column 1: Branding */}
          <div className="flex flex-col gap-4 items-start justify-start sm:col-span-2 md:col-span-1">
            <div className="flex flex-wrap gap-[10px] items-center justify-start w-full">
              <img
                src={landingAssets.logo.gaia} 
                alt="AGAILA Logo"
                className="h-[40px] w-auto sm:h-[53px]"
              />
            </div>

            <p className="font-lato text-[14px] sm:text-[16px] leading-[24px] text-white">
              An Undergraduate Thesis Project
            </p>

            <img
              src={landingAssets.logos.astars}
              alt="A-STARS Logo"
              className="h-[44px] w-auto sm:h-[52px]"
            />
          </div>

          {/* Column 2: Navigation */}
          <nav
            aria-label="Footer"
            className="flex flex-col gap-3 items-start justify-start font-lato text-[14px] sm:text-[16px] leading-[24px] text-white"
          >
            {navigationLinks.map(({ label, to }, index) => {
              const isExternal = to.startsWith('http');
              return isExternal ? (
                <a
                  key={index}
                  href={to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d9d9d9] transition-colors"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={index}
                  to={to}
                  className="hover:text-[#d9d9d9] transition-colors"
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Column 3: Description */}
          <div className="flex flex-col gap-3 items-start justify-start">
            <p className="font-lato text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-white w-full">
              AGAILA is designed to provide real-time environmental hazard reporting by integrating zero-shot classification and Geo-NER.
            </p>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-white/30 py-5 flex items-center justify-center">
          <p className="font-lato text-[12px] sm:text-[13px] leading-[20px] text-white text-center px-4">
            © {currentYear} AGAILA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
