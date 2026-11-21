import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  return (
    <div className="mx-auto grid max-w-6xl gap-16 px-5 py-16 md:grid-cols-2">
      <div>
        <h1 className="font-display text-5xl">Get in touch</h1>
        <p className="mt-5 max-w-sm font-light text-muted">Questions about sizing, care or an order? Our team replies within one business day.</p>
        <dl className="mt-10 space-y-5 text-sm">
          <div><dt className="text-xs uppercase tracking-[0.25em] text-gold-deep">Email</dt><dd className="mt-1">hello@aurelia.example</dd></div>
          <div><dt className="text-xs uppercase tracking-[0.25em] text-gold-deep">Hours</dt><dd className="mt-1">Mon to Fri, 9am to 6pm</dd></div>
        </dl>
      </div>
      <ContactForm />
    </div>
  );
}
