"use client";
import { useState } from "react";

const field = "w-full border border-line bg-card px-4 py-3 outline-none focus:border-gold";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  if (sent) return <p className="border border-gold-light bg-card p-8 font-display text-2xl">Thank you. We&apos;ll reply within one business day.</p>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
      <input required placeholder="Your name" aria-label="Your name" className={field} />
      <input required type="email" placeholder="Email address" aria-label="Email address" className={field} />
      <textarea required rows={5} placeholder="How can we help?" aria-label="Message" className={field} />
      <button className="bg-ink px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-gold-deep">Send message</button>
    </form>
  );
}
