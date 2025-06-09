'use client';
import Link from 'next/link';

export default function PoliticaDePrivacidad() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-3xl font-semibold mb-6">Política de Privacidad</h1>
      <p className="text-sm text-gray-600 mb-6">Última actualización: 26 de mayo de 2025</p>

      <div className="space-y-4 text-base leading-relaxed">
        <p>
          En Refugio en Papel nos comprometemos a proteger tu privacidad. Esta política explica cómo recopilamos, usamos y resguardamos tus datos personales.
        </p>

        <h2 className="text-lg font-medium mt-6">1. Datos que recopilamos</h2>
        <p>Podemos recopilar información como:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Nombre y apellido</li>
          <li>Dirección de correo electrónico</li>
          <li>Número de teléfono</li>
          <li>Dirección de envío</li>
          <li>Información de pago (protegida mediante plataformas seguras como Mercado Pago)</li>
        </ul>

        <h2 className="text-lg font-medium mt-6">2. Uso de la información</h2>
        <p>Utilizamos tus datos únicamente para:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Procesar y enviar tus pedidos</li>
          <li>Comunicarnos con vos sobre tu compra</li>
          <li>Mejorar la atención al cliente</li>
        </ul>
        <p>No compartimos tus datos con terceros, salvo que sea necesario para completar una transacción (por ejemplo, servicios de correo o pago).</p>

        <h2 className="text-lg font-medium mt-6">3. Seguridad</h2>
        <p>
          Implementamos medidas de seguridad para proteger tu información personal. No almacenamos datos sensibles de tarjetas de crédito en nuestros servidores.
        </p>

        <h2 className="text-lg font-medium mt-6">4. Derechos del usuario</h2>
        <p>
          Podés acceder, corregir o eliminar tus datos personales en cualquier momento escribiéndonos a:{' '}
          <a href="mailto:contacto@mirefugioenpapel.com" className="text-[#8C6ABF] underline">
            contacto@mirefugioenpapel.com
          </a>
        </p>

        <h2 className="text-lg font-medium mt-6">5. Cookies</h2>
        <p>
          Este sitio puede utilizar cookies para mejorar tu experiencia de navegación. Podés desactivarlas desde la configuración de tu navegador si lo preferís.
        </p>

        <h2 className="text-lg font-medium mt-6">6. Cambios en la política</h2>
        <p>
          Podemos actualizar esta política ocasionalmente. Si lo hacemos, te lo informaremos en esta página.
        </p>
      </div>
    </main>
  );
}
