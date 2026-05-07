import React from 'react';
import { Link } from 'react-router-dom';

const linkBase =
  'inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 text-[14px] sm:text-[15px] font-lato font-semibold rounded-lg text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none';

export const CTASection: React.FC = () => {
  return (
    <section
      className="relative w-full overflow-hidden border-y border-border bg-muted dark:bg-[#212121]"
      aria-labelledby="cta-heading"
    >
      {/* Ambient gradient — brand blues, low contrast */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90 dark:opacity-100"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 h-56 w-[min(100%,36rem)] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/25 via-secondary/15 to-transparent blur-3xl dark:from-primary/35 dark:via-secondary/20" />
        <div className="absolute bottom-0 right-0 h-40 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-secondary/10 blur-3xl dark:bg-secondary/15" />
        <div className="absolute bottom-0 left-0 h-32 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-screen-xl flex-col items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:px-16">
        {/* Gradient accent — replaces solid orange bar */}
        <div
          className="h-1 w-14 rounded-full bg-gradient-to-r from-primary via-secondary to-primary shadow-sm shadow-primary/25 sm:w-16"
          aria-hidden="true"
        />

        <div className="flex max-w-[640px] flex-col gap-4 px-2 text-center sm:px-4">
          <h2
            id="cta-heading"
            className="font-lato text-[28px] font-extrabold leading-[1.2] tracking-tight text-foreground text-balance sm:text-[32px] md:text-[36px]"
          >
            Get Actionable Hazard Intelligence
          </h2>
          <p className="font-lato text-[14px] leading-relaxed text-muted-foreground sm:text-[16px] sm:leading-[1.6]">
            Equip your response team with the AI-driven insights needed to act faster and protect your community.
            Get started with AGAILA today.
          </p>
        </div>

        <div className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <Link
            to="/report"
            aria-label="Report a Hazard"
            className={`${linkBase} order-1 w-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg hover:from-primary/90 hover:to-secondary/90 sm:order-none sm:w-auto sm:min-w-[180px]`}
          >
            Report a Hazard
          </Link>
          <Link
            to="/map"
            aria-label="View Live Map"
            className={`${linkBase} order-2 w-full border-2 border-primary/30 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:border-secondary/50 hover:bg-primary/5 dark:border-primary/40 dark:bg-card/50 dark:hover:bg-primary/10 sm:order-none sm:w-auto`}
          >
            View Live Map
          </Link>
          <Link
            to="/track"
            aria-label="Track Report"
            className={`${linkBase} order-3 w-full border-2 border-primary/30 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:border-secondary/50 hover:bg-primary/5 dark:border-primary/40 dark:bg-card/50 dark:hover:bg-primary/10 sm:order-none sm:w-auto`}
          >
            Track Report
          </Link>
          <Link
            to="/login"
            aria-label="Login to Dashboard"
            className={`${linkBase} order-4 w-full border-2 border-secondary/45 bg-transparent text-foreground hover:border-secondary hover:bg-secondary/10 dark:border-secondary/50 dark:text-foreground dark:hover:bg-secondary/15 sm:order-none sm:w-auto`}
          >
            Login to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
};
