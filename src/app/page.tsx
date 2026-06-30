export default function Home() {
  return (
    <section className="relative z-10 flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Hero heading */}
      <h1 className="text-gradient-brand mb-4 text-5xl font-800 tracking-tight leading-tight sm:text-6xl lg:text-7xl">
        BhilaiSync
      </h1>

      <p className="mb-3 text-lg font-500 tracking-widest uppercase text-[rgba(0,229,255,0.65)]">
        Unified Campus SuperApp · IIT Bhilai
      </p>

      <p className="mb-10 max-w-xl text-base text-[rgba(255,255,255,0.55)] leading-relaxed">
        Smart Café Ordering, Freshman Navigator, and Campus Marketplace — all in one place.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <a href="/cafe" className="btn-solid-cyan">
          Order at Café →
        </a>
        <a href="/navigator" className="btn-neon-cyan">
          Freshman Navigator
        </a>
        <a href="/market" className="btn-ghost">
          Campus Market
        </a>
      </div>

      {/* Feature chips */}
      <div className="mt-16 flex flex-wrap justify-center gap-3">
        {[
          { label: "Live Café Menu", color: "badge-cyan" },
          { label: "Campus Map", color: "badge-purple" },
          { label: "P2P Marketplace", color: "badge-green" },
          { label: "SolsticeHack 1.0", color: "badge-amber" },
        ].map(({ label, color }) => (
          <span key={label} className={`badge ${color}`}>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
