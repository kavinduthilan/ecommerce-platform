import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl tracking-[0.35em]">AURELIA</p>
          <p className="mt-4 max-w-xs text-sm font-light text-muted-dark">Signature scents for those who notice the details.</p>
        </div>
        <div className="text-sm font-light text-muted-dark">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gold-light">Explore</p>
          <ul className="space-y-2">{[["Shop all", "/shop"], ["Your cart", "/cart"]].map(([l, h]) => <li key={l}><Link href={h} className="hover:text-white">{l}</Link></li>)}</ul>
        </div>
        <div className="text-sm font-light text-muted-dark">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gold-light">Company</p>
          <ul className="space-y-2">{[["Our story", "/about"], ["Contact", "/contact"]].map(([l, h]) => <li key={l}><Link href={h} className="hover:text-white">{l}</Link></li>)}</ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs tracking-wider text-muted-dark">© 2026 Aurelia. Demo store, no real orders.</div>
    </footer>
  );
}
