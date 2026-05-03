import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Info } from 'lucide-react';
// import type { LucideIcon } from 'lucide-react';
import { Footer, Header } from '../components/landing';
import { useTheme } from '../contexts/ThemeContext';
import { ALL_HAZARD_TYPES } from '../hooks/useHazardFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { getHazardIcon } from '../constants/hazard-icons';
import type { HazardType } from '../constants/hazard-icons';
import { HAZARD_SAFETY_GUIDES } from '../constants/hazardSafetyGuides';
import { cn } from '../lib/utils';

const PHASE_BLOCKS: {
  key: 'before' | 'during' | 'after';
  title: string;
  description: string;
  // Icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
  titleClassName: string;
  badgeFilledClass: string;
}[] = [
  {
    key: 'before',
    title: 'Before',
    description: 'Prepare your household and community before a hazard unfolds.',
    // Icon: Shield,
    cardClassName:
      'rounded-xl border border-blue-700/30 bg-muted/70 shadow-sm shadow-blue-950/10 dark:border-blue-400/22 dark:bg-card/75 dark:shadow-black/40',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    titleClassName: 'text-blue-900 dark:text-blue-100',
    badgeFilledClass:
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-base font-bold text-white tabular-nums dark:bg-blue-600',
  },
  {
    key: 'during',
    title: 'During',
    description: 'Stay safe while the event is unfolding; follow verified advisories.',
    // Icon: Zap,
    cardClassName:
      'rounded-xl border border-violet-600/30 bg-muted/70 shadow-sm shadow-violet-950/10 dark:border-violet-400/25 dark:bg-card/75 dark:shadow-black/40',
    iconClassName: 'text-violet-600 dark:text-violet-400',
    titleClassName: 'text-violet-900 dark:text-violet-100',
    badgeFilledClass:
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-base font-bold text-white tabular-nums dark:bg-violet-500',
  },
  {
    key: 'after',
    title: 'After',
    description: 'Recover safely once official all-clear signals are issued.',
    // Icon: Sparkles,
    cardClassName:
      'rounded-xl border border-teal-700/35 bg-muted/70 shadow-sm shadow-teal-950/10 dark:border-cyan-400/25 dark:bg-card/75 dark:shadow-black/40',
    iconClassName: 'text-teal-600 dark:text-cyan-400',
    titleClassName: 'text-teal-900 dark:text-teal-100',
    badgeFilledClass:
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-base font-bold text-white tabular-nums dark:bg-cyan-600',
  },
];

/**
 * Public preparedness reference aligned with Philippine DRR framing.
 * Category grid swaps to a full-panel flashcard with Before / During / After guides.
 *
 * Route: /hazard-info
 */
export default function HazardInfoPage() {
  const { theme } = useTheme();
  const [selectedId, setSelectedId] = useState<HazardType | null>(null);
  const flashcardAnchorRef = useRef<HTMLDivElement>(null);

  const guide = selectedId ? HAZARD_SAFETY_GUIDES[selectedId] : null;
  const config = selectedId ? getHazardIcon(selectedId) : null;

  useEffect(() => {
    if (!selectedId || !flashcardAnchorRef.current) return;
    flashcardAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const openCategory = (id: HazardType) => {
    setSelectedId(id);
  };

  const closeFlashcard = () => {
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <Header />

      <main
        id="hazard-info-main"
        className={cn(
          'flex-1 w-full max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 py-7 sm:py-9'
        )}
        aria-label="Hazard information guides"
      >
        <nav
          className="mb-8 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm font-inter"
          aria-label="Breadcrumb"
        >
          <Link
            to="/"
            className={cn(
              'text-secondary hover:text-secondary/90 dark:text-secondary font-medium underline-offset-2 hover:underline',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-xl px-1.5 py-0.5',
              'dark:hover:text-neutral-50'
            )}
          >
            Home
          </Link>
          <span className="text-muted-foreground px-0.5" aria-hidden>
            /
          </span>
          {!selectedId || !config ? (
            <span className="text-foreground dark:text-neutral-50 font-semibold rounded-xl px-1.5 py-0.5" aria-current="page">
              Hazard info
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={closeFlashcard}
                className={cn(
                  'font-medium underline-offset-2 hover:underline text-secondary hover:text-secondary/90 rounded-xl px-1.5 py-0.5 text-left',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary dark:text-secondary dark:hover:text-neutral-50'
                )}
              >
                Hazard info
              </button>
              <span className="text-muted-foreground px-0.5" aria-hidden>
                /
              </span>
              <span
                className="text-foreground dark:text-neutral-50 font-semibold rounded-xl px-1.5 py-0.5 truncate max-w-[12rem] sm:max-w-none"
                aria-current="page"
              >
                {config.label}
              </span>
            </>
          )}
        </nav>

        <div className={cn('mb-8')}>
          <h1 className="font-lato text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight dark:text-neutral-50 text-primary mb-2">
            Hazard categories
          </h1>
          <p className="font-inter text-sm sm:text-base text-muted-foreground dark:text-neutral-300 max-w-xl leading-relaxed">
            {!selectedId ? (
              <>
                Tap a hazard to open a full-panel guide grouped into{' '}
                <strong className="text-foreground dark:text-neutral-100 font-semibold">Before</strong>,{' '}
                <strong className="text-foreground dark:text-neutral-100 font-semibold">During</strong>, and{' '}
                <strong className="text-foreground dark:text-neutral-100 font-semibold">After</strong>.
              </>
            ) : (
              <>
                Use the chips below to switch hazards or{' '}
                <strong className="text-foreground dark:text-neutral-100 font-semibold">Hazard info</strong> in the
                breadcrumb to return to all categories.
              </>
            )}
          </p>
        </div>

        <section aria-labelledby="hazard-categories-heading" className="mb-12">
          <h2 id="hazard-categories-heading" className="sr-only">
            {selectedId ? 'Hazard safety guide' : 'Select a hazard category'}
          </h2>

          <div
            ref={flashcardAnchorRef}
            className={cn(
              'rounded-xl border bg-card transition-[box-shadow,border-color] duration-300 ease-out p-4 sm:p-5',
              'shadow-md border-border',
              selectedId && 'shadow-md dark:border-border'
            )}
          >
            {!selectedId ? (
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 list-none m-0 p-0">
                {ALL_HAZARD_TYPES.map((id) => {
                  const typed = id as HazardType;
                  const item = getHazardIcon(typed);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => openCategory(typed)}
                        className={cn(
                          'w-full text-left rounded-xl border border-border bg-card shadow-md transition-all duration-200',
                          'hover:shadow-lg hover:border-secondary/55 dark:hover:border-secondary focus:outline-none',
                          'focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                          'px-3 py-3.5 sm:px-4 sm:py-4 flex flex-row items-center gap-3 sm:gap-3.5'
                        )}
                      >
                        <span
                          className="inline-flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl shrink-0"
                          style={{ backgroundColor: item.bgColor }}
                          aria-hidden
                        >
                          <FontAwesomeIcon icon={item.icon} className="w-6 h-6 sm:w-5 sm:h-5" style={{ color: item.color }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span
                            className="font-lato text-sm sm:text-[0.9375rem] font-bold leading-tight block text-primary dark:text-neutral-50 line-clamp-2 sm:line-clamp-none"
                            style={{ color: theme === 'dark' ? undefined : item.color }}
                          >
                            {item.label}
                          </span>
                          <span className="font-inter text-xs text-muted-foreground dark:text-neutral-400 mt-0.5 block leading-snug">
                            View safety guide
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              guide &&
              config && (
                <article
                  className="flex flex-col animate-in fade-in-0 duration-200"
                  aria-labelledby="guide-hazard-title"
                  aria-live="polite"
                >
                  <div className="shrink-0 flex flex-col gap-5 border-b border-border bg-muted/30 dark:bg-muted/50 -mx-4 sm:-mx-5 px-4 sm:px-5 pt-5 sm:pt-6 pb-5 rounded-t-xl">
                    <button
                      type="button"
                      onClick={closeFlashcard}
                      className={cn(
                        'inline-flex items-center gap-2 self-start font-inter text-sm font-medium rounded-xl px-3 py-2 -ml-1 sm:ml-0',
                        'text-secondary hover:text-secondary/90 hover:bg-muted/60 dark:text-secondary dark:hover:bg-muted/80',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                      )}
                      aria-label="Return to all hazard categories"
                    >
                      ← All hazards
                    </button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <span
                        className="inline-flex items-center justify-center w-14 h-14 sm:w-[3.75rem] sm:h-[3.75rem] rounded-xl shrink-0 shadow-md border border-secondary/35 ring-2 ring-secondary/25 dark:ring-secondary/35"
                        style={{ backgroundColor: config.bgColor }}
                        aria-hidden
                      >
                        <FontAwesomeIcon icon={config.icon} className="w-8 h-8 sm:w-[2.125rem] sm:h-[2.125rem]" style={{ color: config.color }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-inter text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1">
                          Safety guide
                        </p>
                        <h2
                          id="guide-hazard-title"
                          className="font-lato text-2xl sm:text-[1.875rem] md:text-[2rem] font-bold tracking-tight text-primary dark:text-neutral-50"
                          style={{ color: theme === 'dark' ? undefined : config.color }}
                        >
                          {config.label}
                        </h2>
                        <p className="font-inter text-sm sm:text-base text-muted-foreground dark:text-neutral-300 max-w-3xl mt-2 leading-relaxed">
                          {guide.summary}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex flex-wrap gap-2 gap-y-2.5 pb-0.5"
                      role="tablist"
                      aria-label="Switch hazard category"
                    >
                      {ALL_HAZARD_TYPES.map((id) => {
                        const typed = id as HazardType;
                        const chip = getHazardIcon(typed);
                        const active = selectedId === typed;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setSelectedId(typed)}
                            className={cn(
                              'font-inter text-xs sm:text-[0.8125rem] font-medium rounded-xl px-3 py-2 border transition-colors',
                              active
                                ? 'border-secondary bg-secondary text-secondary-foreground shadow-sm ring-2 ring-secondary/25'
                                : 'border-neutral-700/55 bg-muted/60 text-muted-foreground dark:bg-card/90 dark:border-border dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:border-secondary/55 dark:hover:border-secondary/55'
                            )}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-10 pt-8 sm:pt-9 w-full">
                    <div className="grid w-full grid-cols-1 gap-8 xl:gap-10 lg:grid-cols-3 lg:gap-8 px-0 sm:px-1 xl:px-2">
                      {PHASE_BLOCKS.map(
                        ({ key, title, description, cardClassName, titleClassName, badgeFilledClass }) => (
                          <Card
                            key={key}
                            className={cn(cardClassName, 'overflow-hidden shadow-md')}
                            aria-labelledby={`phase-title-${key}`}
                          >
                            <CardHeader className="space-y-3 px-5 pt-7 pb-1 sm:px-6 lg:px-7">
                              <div className="flex items-start gap-3.5">
                                {/* <Icon
                                  className={cn('mt-1 size-7 shrink-0 stroke-[2]', iconClassName)}
                                  strokeWidth={2}
                                  aria-hidden
                                /> */}
                                <div className="min-w-0 space-y-2">
                                  <CardTitle
                                    id={`phase-title-${key}`}
                                    className={cn('font-lato text-xl sm:text-[1.35rem] font-bold tracking-tight', titleClassName)}
                                  >
                                    {title}
                                  </CardTitle>
                                  <CardDescription className="font-inter text-sm sm:text-[0.9375rem] leading-relaxed text-muted-foreground dark:text-neutral-300">
                                    {description}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="px-5 pb-8 pt-2 sm:px-6 lg:px-7">
                              <ul className="m-0 list-none space-y-5 p-0">
                                {guide[key].map((tip, idx) => (
                                  <li key={`${key}-${idx}`} className="flex gap-4 items-start font-inter leading-relaxed">
                                    <span className={cn(badgeFilledClass)} aria-hidden>
                                      {idx + 1}
                                    </span>
                                    <span className="min-w-0 pt-0.5 text-base sm:text-lg text-foreground dark:text-neutral-100 leading-relaxed">
                                      {tip}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>

                    <footer
                      className={cn(
                        'w-full -mx-4 sm:-mx-5 px-4 sm:px-6 lg:px-8 py-4 rounded-xl',
                        'border border-neutral-700/65 bg-muted/70 dark:bg-card/80 dark:border-border'
                      )}
                      role="note"
                    >
                      <div className="flex items-start gap-3 max-w-full">
                        <Info
                          className="mt-0.5 size-[1.0625rem] shrink-0 text-secondary opacity-95"
                          aria-hidden
                        />
                        <p className="font-inter text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-neutral-400">
                          Informational reference only not a substitute for official warnings from LGU, NDRRMC,
                          PAGASA, PHIVOLCS, PCG, or BFP during an emergency.
                        </p>
                      </div>
                    </footer>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
