import { Allura, Ruluko } from "next/font/google";

// Fuentes para esta página
const allura = Allura({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-allura",
});
const ruluko = Ruluko({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ruluko",
});

export const metadata = {
  title: "¿Cómo comprar? | Refugio en Papel",
  description: "Guía paso a paso para comprar en Refugio en Papel",
};

export default function ComoComprarPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1
        className="text-4xl text-[#D85B9C] mb-8 text-center"
        style={{ fontFamily: "var(--font-allura)" }}
      >
        ¿Cómo Comprar?
      </h1>

      <div
        className="space-y-8 text-gray-700 leading-relaxed"
        style={{ fontFamily: "var(--font-ruluko)" }}
      >
        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            1. 🛍️ Elegí tus productos
          </h2>
          <p>
            Explorá las categorías y agregá al carrito todo lo que necesites.
            El descuento en souvenirs se aplica automáticamente al sumar la
            cantidad correspondiente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            2. 🎨 Personalizá tu pedido
          </h2>
          <p>
            Durante la compra vas vas a poder ingresar los datos de nombre y temática.
            Después nos contactamos por WhatsApp para coordinar los detalles y enviarte
            la vista previa digital.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            3. 💰 Pagá la seña o el total
          </h2>
          <p>
            Podés abonar el 100% o una seña del 50%. Enviá el comprobante por WhatsApp
            al <strong>11 2409-8439</strong>.  
            El resto se abona cuando el pedido está finalizado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            4. 🚚 Envíos
          </h2>
          <p>
            Realizamos envíos a todo el país, a domicilio o a la sucursal de Correo Argentino
            más cercana.  
            <br />
            <em>(No contamos con punto de retiro).</em>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            5. ✨ Recibí tu pedido y disfrutá tu evento
          </h2>
          <p>
            Todo llega listo para entregar o colocar directamente en tu mesa.
          </p>
        </section>
      </div>
    </div>
  );
}
