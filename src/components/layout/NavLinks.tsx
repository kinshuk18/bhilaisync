"use client";

import Link from "next/link";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface NavLinksProps {
  links: NavLink[];
}

export default function NavLinks({ links }: NavLinksProps) {
  return (
    <nav
      className="hidden md:flex items-center gap-1"
      aria-label="Primary navigation"
    >
      {links.map((link) => (
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

          <span
            className="absolute bottom-1 left-1/2 h-px w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-1/2"
            style={{
              background: "linear-gradient(90deg, #00E5FF, #7C3AED)",
            }}
            aria-hidden="true"
          />
        </Link>
      ))}
    </nav>
  );
}
