import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

/**
 * Public route group layout — Nav + main + Footer for the standard public
 * surface (Home, /how-it-works, /pricing, /science, /faq, /jeffrey,
 * /morning, /day, /night, /about, /legal/*).
 *
 * Why a route group, not the root layout: /investor-room is a self-contained
 * immersive experience with its own posture, /request-access is a focused
 * conversion flow, and /design + /internal + /api + /_ are tooling. None of
 * those want the public Nav/Footer sitting around their content. The route
 * group keeps the global html/body/font wiring at the root and opts the
 * shelled pages in by file location.
 *
 * Footer is set to `muted` here so a page that does not call its own
 * <RallyCry /> simply doesn't get one. Pages that want a closer rally cry
 * render it themselves above their final section. Brand Bible v1.1 allows
 * one rally cry per page; this layout enforces that ceiling by default.
 */

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer muted />
    </>
  );
}
