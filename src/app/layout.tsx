import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// ---------------------------------------------------------------------------
// Font
// ---------------------------------------------------------------------------
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "BhilaiSync | SolsticeHack 1.0",
  description:
    "Unified Campus SuperApp for IIT Bhilai — Smart Café Ordering, Freshman Navigator, and Campus Marketplace.",
  keywords: [
    "IIT Bhilai",
    "campus app",
    "BhilaiSync",
    "SolsticeHack",
    "café ordering",
    "freshman navigator",
    "campus marketplace",
  ],
  authors: [{ name: "BhilaiSync Team — SolsticeHack 1.0" }],
  creator: "BhilaiSync",
  applicationName: "BhilaiSync",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "BhilaiSync | SolsticeHack 1.0",
    description: "Unified Campus SuperApp for IIT Bhilai.",
    siteName: "BhilaiSync",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ---------------------------------------------------------------------------
// Nav link definitions — static, server-safe
// ---------------------------------------------------------------------------
interface NavLink {
  href:  string;
  label: string;
  icon:  string; // inline SVG path data rendered as a tiny accent
}

const NAV_LINKS: NavLink[] = [
  {
    href:  "/",
    label: "Home",
    icon:  "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z",
  },
  {
    href:  "/cafe",
    label: "Café",
    icon:  "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3",
  },
  {
    href:  "/navigator",
    label: "Navigator",
    icon:  "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20",
  },
  {
    href:  "/market",
    label: "Market",
    icon:  "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  },
];

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <body
        className={`
          ${inter.className}
          bg-surface-0
          text-white
          antialiased
          min-h-screen
          min-h-[100dvh]
          overflow-x-hidden
        `}
      >
        {/* ----------------------------------------------------------------
            Persistent ambient orbs — decorative, pointer-events: none
        ---------------------------------------------------------------- */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          {/* Top-left purple bloom */}
          <div
            className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          {/* Bottom-right cyan bloom */}
          <div
            className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full opacity-15"
            style={{
              background:
                "radial-gradient(circle, #00E5FF 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          {/* Center subtle purple mid-tone */}
          <div
            className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06]"
            style={{
              background:
                "radial-gradient(circle, #7C3AED 0%, transparent 60%)",
              filter: "blur(100px)",
            }}
          />
        </div>

        {/* ----------------------------------------------------------------
            Glassmorphic Navigation Bar
        ---------------------------------------------------------------- */}
        <header className="navbar safe-px" role="banner">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

            {/* ── Brand mark ── */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 select-none"
              aria-label="BhilaiSync — go to home"
            >
              {/* Animated logo mark */}
              <div
                className="relative flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(0,229,255,0.25) 100%)",
                  border: "1px solid rgba(0,229,255,0.30)",
                  boxShadow:
                    "0 0 12px rgba(0,229,255,0.20), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
              >
                {/* Hexagon-ish "B" mark rendered as inline SVG for zero dep */}
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M10 2L17 6V14L10 18L3 14V6L10 2Z"
                    stroke="url(#logo-grad)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fill="rgba(0,229,255,0.08)"
                  />
                  <text
                    x="7"
                    y="13.5"
                    fontSize="8"
                    fontWeight="800"
                    fill="url(#logo-grad)"
                    fontFamily="-apple-system, sans-serif"
                  >
                    B
                  </text>
                  <defs>
                    <linearGradient
                      id="logo-grad"
                      x1="0"
                      y1="0"
                      x2="20"
                      y2="20"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#00E5FF" />
                      <stop offset="1" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Wordmark */}
              <span className="text-gradient-brand text-lg font-800 tracking-tight leading-none">
                BhilaiSync
              </span>

              {/* Version chip */}
              <span
                className="hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-600 tracking-wider uppercase"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.30)",
                  color: "#a78bfa",
                }}
              >
                Beta
              </span>
            </Link>

            {/* ── Desktop Navigation Links ── */}
            <nav
              className="hidden md:flex items-center gap-1"
              aria-label="Primary navigation"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-500 transition-all duration-200"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.color = "#ffffff";
                    el.style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.color = "rgba(255,255,255,0.65)";
                    el.style.background = "transparent";
                  }}
                >
                  {/* Icon */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 flex-shrink-0 opacity-70 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <path d={link.icon} />
                  </svg>
                  {link.label}

                  {/* Hover underline accent */}
                  <span
                    className="absolute bottom-1 left-1/2 h-px w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-1/2"
                    style={{
                      background:
                        "linear-gradient(90deg, #00E5FF, #7C3AED)",
                    }}
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>

            {/* ── Right-side status pill ── */}
            <div className="hidden md:flex items-center gap-3">
              {/* Live indicator */}
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.20)",
                }}
              >
                <span className="dot-online animate-pulse" aria-hidden="true" />
                <span
                  className="text-xs font-600 tracking-wide"
                  style={{ color: "#34d399" }}
                >
                  Campus Live
                </span>
              </div>

              {/* SolsticeHack badge */}
              <div
                className="hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(0,229,255,0.08) 100%)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path
                    d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.6l-3.7 2 .7-4.1-3-2.9 4.2-.6L8 1z"
                    fill="#7C3AED"
                    stroke="rgba(124,58,237,0.5)"
                    strokeWidth="0.5"
                  />
                </svg>
                <span
                  className="text-xs font-600 tracking-wide"
                  style={{ color: "#a78bfa" }}
                >
                  SolsticeHack 1.0
                </span>
              </div>
            </div>

            {/* ── Mobile hamburger placeholder (accessible) ── */}
            {/* Full mobile menu is handled by MobileNav client component on
                individual pages to avoid adding "use client" to this layout */}
            <div className="flex md:hidden items-center gap-2">
              <div
                className="flex items-center gap-2 rounded-full px-2.5 py-1.5"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.20)",
                }}
              >
                <span className="dot-online animate-pulse" aria-hidden="true" />
                <span
                  className="text-xs font-600"
                  style={{ color: "#34d399" }}
                >
                  Live
                </span>
              </div>

              {/* Mobile nav trigger — rendered as a details/summary for
                  zero-JS progressive enhancement */}
              <details className="relative" id="mobile-nav">
                <summary
                  className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl transition-colors duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  aria-label="Open navigation menu"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="h-4.5 w-4.5"
                    aria-hidden="true"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </summary>

                {/* Mobile dropdown */}
                <div
                  className="glass-panel-elevated absolute right-0 top-12 z-50 w-56 overflow-hidden p-2"
                  style={{ minWidth: "200px" }}
                >
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-500 transition-all duration-150"
                      style={{ color: "rgba(255,255,255,0.75)" }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "#00E5FF" }}
                        aria-hidden="true"
                      >
                        <path d={link.icon} />
                      </svg>
                      {link.label}
                    </Link>
                  ))}

                  <div className="divider mx-2 my-2" aria-hidden="true" />

                  <div className="px-4 py-2">
                    <p
                      className="text-xs font-600 tracking-wider uppercase"
                      style={{ color: "rgba(255,255,255,0.30)" }}
                    >
                      SolsticeHack 1.0 · Track 2
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Bottom neon accent line */}
          <div
            aria-hidden="true"
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.45) 30%, rgba(0,229,255,0.45) 70%, transparent 100%)",
            }}
          />
        </header>

        {/* ----------------------------------------------------------------
            Main content area — AuthProvider wraps everything below the nav
            so all page-level components and route handlers have auth access.
        ---------------------------------------------------------------- */}
        <AuthProvider>
          <main
            id="main-content"
            className="relative z-10 min-h-[calc(100vh-65px)] min-h-[calc(100dvh-65px)]"
          >
            {children}
          </main>
        </AuthProvider>

        {/* ----------------------------------------------------------------
            Footer
        ---------------------------------------------------------------- */}
        <footer
          className="relative z-10 mt-auto"
          role="contentinfo"
          aria-label="Site footer"
        >
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            }}
            aria-hidden="true"
          />
          <div
            className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8"
            style={{ background: "rgba(8,9,13,0.60)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-600"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                BhilaiSync
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.20)" }}
              >
                ·
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Built for SolsticeHack 1.0 by DSC IIT Bhilai
              </span>
            </div>

            <div className="flex items-center gap-4">
              {NAV_LINKS.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-500 transition-colors duration-150 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Track 2 · Campus Innovation
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-700 uppercase tracking-widest"
                style={{
                  background: "rgba(0,229,255,0.08)",
                  border: "1px solid rgba(0,229,255,0.20)",
                  color: "rgba(0,229,255,0.70)",
                }}
              >
                ⚡ Live
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
