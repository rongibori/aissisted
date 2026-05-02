/**
 * PostCSS configuration for apps/web.
 *
 * Tailwind v4 requires the @tailwindcss/postcss plugin to process the
 * @import "tailwindcss" directive in app/globals.css. Without this,
 * Tailwind utility classes never get generated and every utility silently
 * no-ops (verified: app-wide impact, not just onboarding).
 *
 * Adding @tailwindcss/postcss to devDependencies in package.json is the
 * other half of this fix — run `pnpm install` after this file lands.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
