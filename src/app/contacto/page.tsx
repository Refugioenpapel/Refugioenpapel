'use client';
import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export default function ContactoPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    emailjs
      .sendForm(
        'service_wg78xcn', // reemplazá
        'template_kj6gl9a',    // tu ID de template
        formRef.current,
        'cHz6pQf3uU5jTYI48'  // reemplazá
      )
      .then(
        () => {
          setEnviado(true);
          setError('');
          formRef.current?.reset();
        },
        () => {
          setError('Ocurrió un error al enviar el formulario. Intentá de nuevo.');
        }
      );
  };

  return (
    <div className="px-4 py-20 text-center max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#A084CA]">Contacto</h1>
      <p className="text-gray-700">
        ¿Querés hacer un pedido personalizado o tenés dudas? ¡Consultanos!
      </p>

      <div className="flex flex-col items-center space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#A084CA]" />
          <span>mirefugioenpapel@gmail.com</span>
        </div>
        <div className="flex items-center gap-2">
          <FaWhatsapp className="w-4 h-4 text-[#A084CA]" />
          <span>11-2409-8439</span>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4 text-left"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tu nombre *
          </label>
          <input
            type="text"
            name="user_name"
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#A084CA] focus:border-[#A084CA]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Correo electrónico *
          </label>
          <input
            type="text"
            name="user_contact"
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#A084CA] focus:border-[#A084CA]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tu mensaje *
          </label>
          <textarea
            name="user_message"
            required
            rows={4}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#A084CA] focus:border-[#A084CA]"
          />
        </div>

        {enviado && <p className="text-green-600 text-sm">Mensaje enviado con éxito ✨</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-[#A084CA] text-white py-2 rounded-md hover:bg-[#8C6ABF] transition"
        >
          Enviar mensaje
        </button>
      </form>
    </div>
  );
}
