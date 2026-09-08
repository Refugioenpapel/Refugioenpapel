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
            1. Elegí tus productos 🛒
          </h2>
          <p>
            Explorá las categorías y agregá al carrito todo lo que necesites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            2. Completá la personalización ✏️
          </h2>
          <p>
            Ingresá los datos solicitados para cada producto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            3. Realizá el pago 💳
          </h2>
          <p>
            Podés pagar por transferencia bancaria o Mercado Pago. Si elegís transferencia, enviá el comprobante por WhatsApp al <strong>11 2409-8439</strong> para confirmar tu pedido.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            4. Aprobá la muestra digital 👀
          </h2>
          <p>
            Te enviaremos la muestra digital por WhatsApp. Una vez aprobada, comenzaremos la producción.
            <br />
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#A56ABF] mb-2">
            5. Recibí tu pedido 📦
          </h2>
          <p>
            Podés recibirlo en tu domicilio o retirarlo en una sucursal de Correo Argentino.
          </p>
        </section>
      </div>
    </div>
  );
}
