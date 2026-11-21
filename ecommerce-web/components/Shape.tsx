import type { Category } from "@/lib/products";

export default function Shape({ type }: { type: Category }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
      {type === "rings" && (<><circle cx="50" cy="64" r="24" strokeWidth="7" /><path d="M38 32l12-16 12 16-12 14z" fill="currentColor" /></>)}
      {type === "necklaces" && (<><path d="M16 18c0 52 68 52 68 0" /><circle cx="50" cy="64" r="10" fill="currentColor" /></>)}
      {type === "watches" && (<><rect x="38" y="6" width="24" height="88" rx="6" opacity=".35" fill="currentColor" stroke="none" /><circle cx="50" cy="50" r="26" fill="currentColor" /><path d="M50 36v14l10 6" stroke="#faf9f6" /></>)}
      {type === "earrings" && (<><path d="M30 14v14M70 14v14" /><path d="M30 34c-10 10-10 26 0 34 10-8 10-24 0-34zM70 34c-10 10-10 26 0 34 10-8 10-24 0-34z" fill="currentColor" /></>)}
    </svg>
  );
}
