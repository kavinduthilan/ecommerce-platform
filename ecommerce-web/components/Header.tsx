"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";

const links = [["Shop", "/shop"], ["About", "/about"], ["Contact", "/contact"]];

export default function Header({categories= {}}) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);


  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <button className="text-xs uppercase tracking-[0.2em] md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open ? "Close" : "Menu"}</button>
        <nav aria-label="Main" className="hidden gap-8 text-xs uppercase tracking-[0.2em] md:flex">
          {links.slice(0, 2).map(([l, h]) => <Link key={l} href={h} className="hover:text-gold-deep">{l}</Link>)}
        </nav>
        <Link href="/" className="font-display text-3xl tracking-[0.35em] md:absolute md:left-1/2 md:-translate-x-1/2">AURELIA</Link>
        <div className="flex items-center gap-8 text-xs uppercase tracking-[0.2em]">
          <nav aria-label="Secondary" className="hidden gap-8 md:flex">
            {links.slice(2).map(([l, h]) => <Link key={l} href={h} className="hover:text-gold-deep">{l}</Link>)}
          </nav>
          <Link href="/cart" className="hover:text-gold-deep">Cart ({count})</Link>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-4 border-t border-line px-5 py-5 text-xs uppercase tracking-[0.2em] md:hidden">
          {links.map(([l, h]) => <Link key={l} href={h} onClick={() => setOpen(false)}>{l}</Link>)}
        </nav>
      )}
    </header>
  );
}
