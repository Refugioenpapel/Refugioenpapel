// app/checkout/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from 'emailjs-com';
import { useCart } from '@context/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart, discount, openCart } = useCart();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalConDescuento = subtotal * (1 - discount);

  const contieneFisicos = cartItems.some((item) => item.is_physical);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    mensaje: '',
    evento: '',
    nombrePersonalizado: '',
    edad: '',
    fechaHora: '',
    direccioninvitacion: '',
    calle: '',
    numero: '',
    piso: '',
    departamento: '',
    barrio: '',
    cp: '',
    provincia: '',
    metodoEntrega: 'sucursal',
  });

  const [loading, setLoading] = useState(false);
  const [envioPrecio, setEnvioPrecio] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchEnvio = async () => {
      console.warn('Consulta automática de tarifa de envío deshabilitada hasta tener credenciales.');
      setEnvioPrecio(null); // Forzamos null
    };

    fetchEnvio();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const numeroPedido = Math.floor(1000 + Math.random() * 9000);

    const resumenProductos = cartItems
      .map((item) => `• ${item.name} x${item.quantity} – $${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    const resumenEnvio = contieneFisicos
      ? formData.metodoEntrega === 'domicilio'
        ? 'Envío a domicilio por Correo Argentino (a coordinar)'
        : 'Envío a sucursal de Correo Argentino (a coordinar)'
      : 'No aplica (producto digital)';

    const templateParams = {
      ...formData,
      order_id: numeroPedido,
      resumenProductos,
      resumenEnvio,
      total: (totalConDescuento + (envioPrecio || 0)).toFixed(2),
      descuento: discount > 0 ? `${(discount * 100).toFixed(0)}%` : '0', // nuevo
    };

    try {
      await emailjs.send(
        'service_wg78xcn',
        'template_b529mq6',
        templateParams,
        'cHz6pQf3uU5jTYI48'
      );

      // 🔥 Guarda el carrito, checkout info y el descuento aplicado
      localStorage.setItem('lastCheckoutInfo', JSON.stringify(templateParams));
      localStorage.setItem('lastCart', JSON.stringify(cartItems));
      localStorage.setItem('lastDiscount', JSON.stringify(discount)); // ✅ GUARDAMOS EL DESCUENTO

      clearCart();
      router.push(`/resumen?pedido=${numeroPedido}&email=${formData.email}`);
    } catch (error) {
      console.error('Error al enviar el email:', error);
      alert('Hubo un error al procesar tu compra. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#A56ABF] mb-6 text-center">
        <div className="flex items-center justify-center mb-6 text-sm sm:text-base font-medium text-gray-600">
          <button
            type="button"
            onClick={openCart}
            className="flex items-center space-x-1 text-[#A56ABF] hover:underline"
          >
            <span>🛒 Carrito</span>
          </button>
          <span className="mx-2">→</span>
          <span className="text-[#A084CA]">📝 Información</span>
          <span className="mx-2">→</span>
          <span className="text-gray-400">✅ Compra finalizada</span>
        </div>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
        {/* CONTACTO */}
        <h3 className="text-md font-semibold text-[#A56ABF] mb-2">Datos de contacto:</h3>
        <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Nombre" className="w-full border p-2 rounded-md" />
        <input type="text" name="apellido" required value={formData.apellido} onChange={handleChange} placeholder="Apellido" className="w-full border p-2 rounded-md" />
        <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="Correo electrónico" className="w-full border p-2 rounded-md" />
        <input type="tel" name="telefono" required value={formData.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full border p-2 rounded-md" />

        {/* PERSONALIZACIÓN */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-md font-semibold text-[#A56ABF] mb-2">Datos para la personalización del producto:</h3>
          <input type="text" name="evento" required value={formData.evento} onChange={handleChange} placeholder="Temática deseada (Ejemplo: Baby Shark, Unicornio, Fotos del niño/a, etc.)" className="w-full border p-2 rounded-md mb-2" />
          <input type="text" name="nombrePersonalizado" value={formData.nombrePersonalizado} onChange={handleChange} placeholder="Nombre del niño/a o persona homenajeada (opcional)" className="w-full border p-2 rounded-md mb-2" />
          <input type="number" name="edad" value={formData.edad} onChange={handleChange} placeholder="Edad a cumplir (opcional)" className="w-full border p-2 rounded-md mb-2" />
          <input type="text" name="fechaHora" value={formData.fechaHora} onChange={handleChange} placeholder="Fecha y hora del evento (opcional)" className="w-full border p-2 rounded-md mb-2" />
          <input type="text" name="direccioninvitacion" value={formData.direccioninvitacion} onChange={handleChange} placeholder="Dirección para la invitación (opcional)" className="w-full border p-2 rounded-md mb-2" />
        </div>

        {/* ENVÍO */}
          {contieneFisicos && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-md font-semibold text-[#A56ABF] mb-2">Envío del producto:</h3>
              <p className="text-sm text-gray-700">
                📦 Te contactaremos para coordinar el envío una vez confirmado tu pedido.
              </p>
            </div>
          )}

        <textarea name="mensaje" rows={3} value={formData.mensaje} onChange={handleChange} placeholder="Ej: Paleta de colores (opcional)" className="w-full border p-2 rounded-md mt-4" />

        <p className="text-sm text-gray-600">
          (*) Campos obligatorios. Una vez finalizada la compra podrás visualizar el alias para realizar el pago.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-right border mt-4">
          <p className="text-sm text-gray-600">Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></p>
          {discount > 0 && (
            <p className="text-green-600 text-sm">Descuento aplicado: <span className="font-medium">-{(discount * 100).toFixed(0)}%</span></p>
          )}
          {contieneFisicos && (
            <p className="text-sm text-blue-600">
              Envío: {envioPrecio !== null ? `$${envioPrecio.toFixed(2)}` : 'a coordinar'}
            </p>
          )}
          <p className="text-lg font-bold mt-1">Total: ${(totalConDescuento + (envioPrecio || 0)).toFixed(2)}</p>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#A084CA] text-white py-2 rounded-full hover:bg-[#8C6ABF] transition">
          {loading ? 'Procesando...' : 'Finalizar compra'}
        </button>
      </form>
    </div>
  );
}
