import Link from "next/link";

export default async function OrderSuccess({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-5xl">Thank you</h1>
      <p className="mt-4 text-muted">
        Your order{id ? ` #${id}` : ""} has been placed. We'll contact you shortly to confirm delivery.
      </p>
      <Link href="/shop" className="mt-10 inline-block bg-ink px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-white hover:bg-gold-deep">
        Continue shopping
      </Link>
    </div>
  );
}