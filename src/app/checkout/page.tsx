'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from 'emailjs-com';
import { useCart } from '@context/CartContext'; // Asegurate que la ruta sea correcta

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart, discount } = useCart(); // ← acceder al carrito y descuento
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalConDescuento = subtotal * (1 - discount);
  const { openCart } = useCart();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    mensaje: '',
    evento: '',
    nombrePersonalizado: '',
    apodo: '',
    edad: '',
    fechaHora: '',
    direccion: '',
    provincia: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalConDescuento = subtotal * (1 - discount);

    const numeroPedido = Math.floor(1000 + Math.random() * 9000);

    const orders = cartItems.map((item) => ({
      name: item.name,
      units: item.quantity,
      price: (item.price * item.quantity).toFixed(2),
    }));
    const resumenProductos = cartItems.map((item) =>
      `• ${item.name} x${item.quantity} – $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const templateParams = {
      ...formData,
      order_id: numeroPedido,
      orders,
      total: totalConDescuento.toFixed(2),
      resumenProductos, // 👈 nueva variable
    };

    try {
      await emailjs.send(
        'service_wg78xcn',
        'template_b529mq6',
        templateParams,
        'cHz6pQf3uU5jTYI48'
      );

      localStorage.setItem('lastCart', JSON.stringify(cartItems));

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

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl shadow"
      >
        <h3 className="text-md font-semibold text-[#A56ABF] mb-2">
            Datos de contacto:
          </h3>
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre*</label>
          <input
            type="text"
            name="nombre"
            required
            value={formData.nombre}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">Apellido*</label>
          <input
            type="text"
            name="apellido"
            required
            value={formData.apellido}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electrónico*</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono*</label>
          <input
            type="tel"
            name="telefono"
            required
            value={formData.telefono}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-md font-semibold text-[#A56ABF] mb-2">
            Datos para la personalización del producto:<br /><br />
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="evento" className="block text-sm font-medium text-gray-700">Evento*</label>
              <input
                type="text"
                name="evento"
                required
                value={formData.evento}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Ej: Cumpleaños, Baby Shower"
              />
            </div>

            <div>
              <label htmlFor="nombrePersonalizado" className="block text-sm font-medium text-gray-700">Nombre*</label>
              <input
                type="text"
                name="nombrePersonalizado"
                required
                value={formData.nombrePersonalizado}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>

            <div>
              <label htmlFor="apodo" className="block text-sm font-medium text-gray-700">Apodo*</label>
              <input
                type="text"
                name="apodo"
                required
                value={formData.apodo}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Opcional para piezas pequeñas"
              />
            </div>

            <div>
              <label htmlFor="edad" className="block text-sm font-medium text-gray-700">Edad a cumplir*</label>
              <input
                type="number"
                name="edad"
                required
                value={formData.edad}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                min="0"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="fechaHora" className="block text-sm font-medium text-gray-700">Fecha y hora del festejo*</label>
              <input
                type="text"
                name="fechaHora"
                required
                value={formData.fechaHora}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Ej: 25/06/2025 a las 17hs"
              />
            </div>

            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Dirección*</label>
              <input
                type="text"
                name="direccion"
                required
                value={formData.direccion}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>

            <div>
              <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">Provincia*</label>
              <input
                type="text"
                name="provincia"
                required
                value={formData.provincia}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700">Mensaje adicional (opcional)</label>
          <textarea
            name="mensaje"
            rows={3}
            value={formData.mensaje}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
          <p className="text-sm text-gray-600">
            (*)Campos obligatorios.
          </p>
        <p className="text-sm text-gray-600">
          Una vez finalizada la compra podrás visualizar el alias para realizar el pago.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-right border mt-4">
          <p className="text-sm text-gray-600">Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></p>
          {discount > 0 && (
            <p className="text-green-600 text-sm">Descuento aplicado: <span className="font-medium">-{(discount * 100).toFixed(0)}%</span></p>
          )}
          <p className="text-lg font-bold mt-1">Total: ${totalConDescuento.toFixed(2)}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#A084CA] text-white py-2 rounded-full hover:bg-[#8C6ABF] transition"
        >
          {loading ? 'Procesando...' : 'Finalizar compra'}
        </button>
      </form>
    </div>
  );
}
