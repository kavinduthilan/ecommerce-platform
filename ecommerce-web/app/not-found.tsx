import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-display text-5xl">Page not found</h1>
      <Link href="/shop" className="mt-8 inline-block bg-ink px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-white hover:bg-gold-deep">Continue shopping</Link>
    </div>
  );
}
