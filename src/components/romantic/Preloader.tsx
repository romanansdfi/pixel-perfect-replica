import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

/** Soft rose-pink loading veil shown while the site wakes up. */
export function Preloader() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2100);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-blush via-rose/70 to-cream"
      initial={{ opacity: 1 }}
      animate={{ opacity: gone ? 0 : 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      style={{ pointerEvents: gone ? "none" : "auto" }}
      aria-hidden={gone}
    >
      <motion.div
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
      >
        <Heart className="h-16 w-16 fill-rosedeep text-rosedeep drop-shadow-[0_0_20px_oklch(0.879_0.057_350/0.7)]" />
      </motion.div>
      <motion.p
        className="mt-6 font-serif text-xl italic tracking-wide text-burgundy/80"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        getting your surprise ready…
      </motion.p>
    </motion.div>
  );
}
