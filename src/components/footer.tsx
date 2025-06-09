'use client';

import { FaInstagram, FaFacebookF, FaWhatsapp } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

export default function Footer() {
  return (
    <footer className="bg-[#FDEFF7] text-gray-800 w-full mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Nombre del emprendimiento */}
        <div className="text-center">
          <img
            src="/Refugio-en-papel-footer.png" // Asegurate de tener tu logo aquí
            alt="Refugio en Papel"
            className="mx-auto mb-1 w-16 h-auto" // Ajustá el tamaño según tu logo
          />
          <p className="text-sm">Papelería hecha con amor</p>
        </div>

        {/* Contacto y redes */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex gap-4 text-2xl">
            <a href="https://www.instagram.com/refugioenpapel/" target="_blank" rel="noopener noreferrer" className="hover:text-[#8C6ABF]">
              <FaInstagram />
            </a>
            <a href="https://www.facebook.com/share/1Qsj3WLvaP/" target="_blank" rel="noopener noreferrer" className="hover:text-[#8C6ABF]">
              <FaFacebookF />
            </a>
            <a href="https://wa.me/5491124098439" target="_blank" rel="noopener noreferrer" className="hover:text-[#8C6ABF]">
              <FaWhatsapp />
            </a>
            <a href="mailto:contacto@mirefugioenpapel.com" className="hover:text-[#8C6ABF]">
              <MdEmail />
            </a>
          </div>
          <div className="text-center md:text-end text-xs mt-2 space-y-1">
            <p>© 2025 Refugio en Papel. Todos los derechos reservados.</p>
            <p>El contenido de este sitio está protegido por derechos de autor.</p>
            <div className="flex justify-center md:justify-end gap-4">
              <a href="/terminos-y-condiciones" className="underline hover:text-[#8C6ABF]">Términos y condiciones</a>
              <a href="/politica-de-privacidad" className="underline hover:text-[#8C6ABF]">Política de privacidad</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
