'use client';

import { FaWhatsapp } from 'react-icons/fa';

const WHATSAPP_URL =
  'https://wa.me/5491124098439?text=Hola%20Refugio%20en%20Papel%2C%20quer%C3%ADa%20hacer%20una%20consulta%20%F0%9F%92%95';

export default function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      title="Consultar por WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#1EBE5D] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
    >
      <FaWhatsapp className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />
      <span className="sr-only">Consultar por WhatsApp</span>
    </a>
  );
}