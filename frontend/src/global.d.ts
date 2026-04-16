/**
 * Global TypeScript Declarations
 * Project mandates TailwindCSS with design tokens, no CSS modules
 */

declare module '*.css' {
  // Plain CSS module - allows side-effect imports like: import './index.css'
}
