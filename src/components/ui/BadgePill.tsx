// components/ui/BadgePill.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

type Pos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export default function BadgePill({
  label,
  position = 'top-left',
  className = '',
}: {
  label: string;
  position?: Pos;
  className?: string;
}) {
  const posClass =
    position === 'top-left'
      ? 'left-3 top-3'
      : position === 'top-right'
      ? 'right-3 top-3'
      : position === 'bottom-left'
      ? 'left-3 bottom-3'
      : 'right-3 bottom-3';

  return (
    <span
      className={clsx(
        // 👇 SIEMPRE absolute + z-index alto
        'absolute z-30',
        posClass,
        // 👇 Estilo unificado (mismo que usamos en home/gallery)
        'rounded-full bg-[#EBD8FF]/90 text-[#6B4EA0] text-[11px] font-semibold',
        'px-3 py-[3px] shadow-sm border border-[#DCC0FF] backdrop-blur-sm',
        'select-none transition-transform duration-200',
        'group-hover:scale-[1.05]',
        className
      )}
    >
      {label}
    </span>
  );
}
