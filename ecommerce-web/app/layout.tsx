import type { Metadata } from "next";
import "./globals.css";
import CartProvider from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategories } from "@/lib/categories";

export const metadata: Metadata = {
  title: { default: "Aurelia – Fine jewellery & timepieces", template: "%s | Aurelia" },
  description: "Rings, necklaces, watches and earrings crafted to be kept for a lifetime.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  const categories = getCategories();
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <CartProvider>
          <Header categories={categories}/>
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
