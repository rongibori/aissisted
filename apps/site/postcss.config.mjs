/**
 * PostCSS — Tailwind v4 plugin wiring for Next.js.
 *
 * Tailwind v4's @import directive in app/globals.css is processed by the
 * @tailwindcss/postcss plugin. Without this file, Next 15's webpack
 * pipeline ships only the @font-face + plain-class declarations from
 * globals.css and emits zero utility classes — the entire site renders
 * unstyled. Local prod builds and headless screenshot capture need this
 * plugin to produce the same CSS Vercel ships.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
