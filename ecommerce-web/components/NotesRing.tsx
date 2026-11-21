// import "./luxury.css";

const notes = ["Oud", "Amber", "Saffron", "Rose", "Vanilla", "Sandalwood", "Bergamot", "Musk"];
// const notes = ["AURELIA"];

/** A slow 3D carousel of scent notes. Pauses on hover. */
export default function NotesRing() {
  const step = 360 / notes.length;
  return (
    <section
      aria-label="Fragrance notes"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_50%,#26221b_0%,#141312_75%)] py-14 text-white"
    >
      <div className="ring-scene">
        <div className="ring">
          {notes.map((n, i) => (
            <span
              key={n}
              className="bg-linear-to-b from-[#f8e8b0] via-[#d6b05a] to-[#9a7730] bg-clip-text font-display text-4xl text-transparent sm:text-5xl"
              style={{ transform: `rotateY(${i * step}deg) translateZ(250px)` }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}