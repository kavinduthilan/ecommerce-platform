export type Category = "rings" | "necklaces" | "watches" | "earrings";
export type Product = { id: string; name: string; category: Category; price: number; blurb: string; details: string[]; badge?: string };

export const categories: { id: Category; label: string; tagline: string }[] = [
  { id: "rings", label: "Rings", tagline: "Solitaires & bands" },
  { id: "necklaces", label: "Necklaces", tagline: "Pendants & chains" },
  { id: "watches", label: "Watches", tagline: "Automatic movements" },
  { id: "earrings", label: "Earrings", tagline: "Drops & studs" },
];

export const products: Product[] = [
  { id: "solitaire-ring", name: "Solitaire Ring", category: "rings", price: 1280, badge: "Bestseller",
    blurb: "A single brilliant-cut stone held in a slim six-claw setting.", details: ["18k yellow gold", "0.5 ct lab-grown diamond", "Sizes 4 to 9"] },
  { id: "eternity-band", name: "Eternity Band", category: "rings", price: 980,
    blurb: "A continuous line of pavé stones, made to be worn alone or stacked.", details: ["18k yellow gold", "Pavé set stones", "Sizes 4 to 9"] },
  { id: "pendant-necklace", name: "Halo Pendant", category: "necklaces", price: 640, badge: "New",
    blurb: "A polished disc pendant on a fine cable chain that sits at the collarbone.", details: ["18k gold vermeil", "16 to 18 in adjustable chain", "Lobster clasp"] },
  { id: "pearl-strand", name: "Pearl Strand", category: "necklaces", price: 890,
    blurb: "Hand-knotted freshwater pearls with a gold clasp, graded for lustre.", details: ["7 mm freshwater pearls", "Silk knotted", "17 in length"] },
  { id: "classic-watch", name: "Classic Automatic", category: "watches", price: 2400, badge: "Limited",
    blurb: "A 38 mm automatic with a champagne dial and sapphire crystal.", details: ["Swiss automatic movement", "Sapphire crystal", "50 m water resistance"] },
  { id: "dress-watch", name: "Slim Dress Watch", category: "watches", price: 1850,
    blurb: "Barely 7 mm thick, with a hand-stitched leather strap.", details: ["Quartz movement", "Italian leather strap", "36 mm case"] },
  { id: "drop-earrings", name: "Drop Earrings", category: "earrings", price: 520,
    blurb: "Sculpted teardrops that catch the light with every movement.", details: ["18k gold vermeil", "Hypoallergenic posts", "32 mm drop"] },
  { id: "stud-earrings", name: "Everyday Studs", category: "earrings", price: 340,
    blurb: "Small polished studs light enough to forget you're wearing.", details: ["14k solid gold", "6 mm", "Butterfly backs"] },
];

// export const money = (n: number) => "Rs." + n.toLocaleString("en-US");
export const getProduct = (id: string) => products.find((p) => p.id === id);
