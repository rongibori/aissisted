/**
 * PostCSS — wires Tailwind v4 into the Next.js build pipeline.
 *
 * Tailwind v4 ships its engine in `tailwindcss` + `@tailwindcss/oxide`,
 * but Next.js needs the `@tailwindcss/postcss` plugin to actually
 * generate utility classes from `@import "tailwindcss"` in globals.css.
 *
 * Without this file, the @theme tokens compile but `.flex`, `.bg-surface`,
 * `.grid-cols-3`, etc. never get emitted — leaving the app unstyled.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
