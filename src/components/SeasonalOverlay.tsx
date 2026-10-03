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

/**
 * 🎃 HALLOWEEN
 * Para activar/desactivar:
 * - NEXT_PUBLIC_HALLOWEEN_DECOR=true en Netlify
 * - o cambiá ENABLE_HALLOWEEN_DECOR a true/false
 */
const ENABLE_HALLOWEEN_DECOR =
  process.env.NEXT_PUBLIC_HALLOWEEN_DECOR === "false" ? false : true;

export default function SeasonalOverlay() {
  // Si ambos están apagados, no renderiza nada
  if (!ENABLE_XMAS_DECOR && !ENABLE_HALLOWEEN_DECOR) return null;

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

  const spiders = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const left = 5 + Math.random() * 90;
      const top = 8 + Math.random() * 48;
      const drop = 40 + Math.random() * 120;
      const duration = 4.5 + Math.random() * 4;
      const delay = Math.random() * 3;
      const size = 22 + Math.random() * 12;

      return { id: i, left, top, drop, duration, delay, size };
    });
  }, []);

  const bats = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const top = 12 + Math.random() * 42;
      const duration = 10 + Math.random() * 7;
      const delay = Math.random() * 8;
      const size = 22 + Math.random() * 12;

      return { id: i, top, duration, delay, size };
    });
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {ENABLE_HALLOWEEN_DECOR && (
        <>
          <div className="halloween-web halloween-web-left" aria-hidden="true" />
          <div className="halloween-web halloween-web-right" aria-hidden="true" />

          {spiders.map((spider) => (
            <span
              key={spider.id}
              className="halloween-spider"
              style={{
                left: `${spider.left}%`,
                top: `${spider.top}px`,
                fontSize: `${spider.size}px`,
                animationDuration: `${spider.duration}s`,
                animationDelay: `${spider.delay}s`,
                ["--spider-drop" as string]: `${spider.drop}px`,
              }}
              aria-hidden="true"
            >
              🕷️
            </span>
          ))}

          {bats.map((bat) => (
            <span
              key={bat.id}
              className="halloween-bat"
              style={{
                top: `${bat.top}%`,
                fontSize: `${bat.size}px`,
                animationDuration: `${bat.duration}s`,
                animationDelay: `${bat.delay}s`,
              }}
              aria-hidden="true"
            >
              🦇
            </span>
          ))}
        </>
      )}

      {/* 🎅 Papá Noel cruzando una sola vez */}
      {ENABLE_XMAS_DECOR && showSanta && (
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
      {ENABLE_XMAS_DECOR && flakes.map((f) => (
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
