// components/SeasonalOverlay.tsx
"use client";

import { useEffect, useState } from "react";

export default function SeasonalOverlay() {
  const [ready, setReady] = useState(false);
  const [showSanta, setShowSanta] = useState(true);

  // Cuando monta, habilitamos el overlay
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  const flakes = Array.from({ length: 40 });

  return (
    <div className="pointer-events-none fixed inset-0 z-50">

      {/* 🎅 Papá Noel cruzando una sola vez */}
      {showSanta && (
        <div
          className="xmas-santa"
          onAnimationEnd={() => setShowSanta(false)}
        >
          <img
            src="/seasonal/santa-sled.png"
            alt="Papá Noel en trineo"
            className="xmas-santa-img"
          />
        </div>
      )}

      {/* ❄ Copitos infinitos */}
      {flakes.map((_, i) => {
        const left = Math.random() * 100;
        const duration = 6 + Math.random() * 4;
        const delay = Math.random() * 5;

        return (
          <span
            key={i}
            className="xmas-snowflake"
            style={{
              left: `${left}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              animationIterationCount: "infinite",
            }}
          >
            ❄
          </span>
        );
      })}
    </div>
  );
}
