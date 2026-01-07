// components/SeasonalOverlay.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * 🎄 NAVIDAD
 * Para reactivar:
 * - Cambiá ENABLE_XMAS_DECOR a true
 * - o seteá NEXT_PUBLIC_XMAS_DECOR=true en Netlify
 */
const ENABLE_XMAS_DECOR =
  process.env.NEXT_PUBLIC_XMAS_DECOR === "true" ? true : false;

export default function SeasonalOverlay() {
  // Si está apagado, no renderiza nada
  if (!ENABLE_XMAS_DECOR) return null;

  const [ready, setReady] = useState(false);
  const [showSanta, setShowSanta] = useState(true);

  useEffect(() => {
    setReady(true);
  }, []);

  // ✅ Creamos los copos una sola vez (si no, en cada render cambian de lugar)
  const flakes = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const left = Math.random() * 100;
      const duration = 6 + Math.random() * 4;
      const delay = Math.random() * 5;
      const size = 14 + Math.random() * 10; // un poquito de variación

      return { id: i, left, duration, delay, size };
    });
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* 🎅 Papá Noel cruzando una sola vez */}
      {showSanta && (
        <div className="xmas-santa" onAnimationEnd={() => setShowSanta(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/seasonal/santa-sled.png"
            alt="Papá Noel en trineo"
            className="xmas-santa-img"
          />
        </div>
      )}

      {/* ❄ Copitos infinitos */}
      {flakes.map((f) => (
        <span
          key={f.id}
          className="xmas-snowflake"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            animationIterationCount: "infinite",
          }}
        >
          ❄
        </span>
      ))}
    </div>
  );
}
