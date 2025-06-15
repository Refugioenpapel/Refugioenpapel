'use client';
import Link from 'next/link';

export default function TerminosYCondiciones() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-3xl font-semibold mb-6">Términos y Condiciones</h1>
      <p className="text-sm text-gray-600 mb-6">Última actualización: 26 de mayo de 2025</p>

      <div className="space-y-4 text-base leading-relaxed">
        <p>
          Bienvenido/a a Refugio en Papel. Al acceder y utilizar este sitio web, aceptás estar sujeto/a a los siguientes términos y condiciones.
          Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices este sitio.
        </p>

        <h2 className="text-lg font-medium mt-6">1. Propiedad intelectual</h2>
        <p>
          Todo el contenido disponible en este sitio web, incluyendo imágenes, diseños, textos, logotipos y gráficos, es propiedad de Refugio en Papel
          y está protegido por leyes de derechos de autor. No está permitido copiar, reproducir o distribuir este contenido sin autorización previa
          por escrito.
        </p>

        <h2 className="text-lg font-medium mt-6">2. Productos personalizados</h2>
        <p>
          Los productos ofrecidos son realizados a mano y en muchos casos personalizados, por lo que pueden tener pequeñas variaciones respecto a las
          imágenes publicadas. No se aceptan devoluciones en productos personalizados, salvo que presenten defectos.
        </p>

        <h2 className="text-lg font-medium mt-6">3. Medios de pago</h2>
        <p>
          Aceptamos pagos mediante transferencia bancaria, Mercado Pago y otros métodos especificados al finalizar la compra.
        </p>

        <h2 className="text-lg font-medium mt-6">4. Envíos</h2>
        <p>
          Realizamos envíos a todo el país. Los plazos de entrega varían según el destino y se informan al momento de la compra.
          Refugio en Papel no se responsabiliza por demoras causadas por el correo o empresas de logística.
        </p>

        <h2 className="text-lg font-medium mt-6">5. Cambios y devoluciones</h2>
        <p>
          En caso de productos con fallas de fabricación, se podrá solicitar el cambio dentro de los 5 días hábiles desde la recepción.
          Los productos deben estar sin uso y en su empaque original.
        </p>

        <h2 className="text-lg font-medium mt-6">6. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de actualizar estos términos en cualquier momento sin previo aviso. Te recomendamos revisar esta sección periódicamente.
        </p>

        <p className="mt-6">
          Si tenés dudas, podés contactarnos a:{' '}
          <a href="mailto:mirefugioenpapel@gmail.com" className="text-[#8C6ABF] underline">
            mirefugioenpapel@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
