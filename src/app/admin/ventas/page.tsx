'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminAccess } from 'hooks/useAdminAccess';
import { supabase } from '@lib/supabaseClient';

type OrderRow = {
  order_id: string;
  status: string;
  payment_method: string;
  payment_status: string | null;
  mp_payment_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  amount_total: number;
  currency: string;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

const RECOVERY_STATUSES = [
  'initiated',
  'pending_payment',
  'payment_failed',
  'paid',
  'recovered_manual',
  'cancelled',
];

export default function AdminVentasPage() {
  const { isAdmin, loading } = useAdminAccess();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);

  const getAccessToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    let token = sessionData.session?.access_token || null;

    if (!token) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new Error(`No authenticated session (${refreshError.message})`);
      }
      token = refreshed.session?.access_token || null;
    }

    if (!token) throw new Error('No authenticated session');
    return token;
  };

  const loadOrders = async () => {
    setFetching(true);
    try {
      const token = await getAccessToken();

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '150');

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron cargar las ventas');
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
      alert('No se pudieron cargar las ventas.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadOrders();
  }, [isAdmin, statusFilter]);

  const pendientesRecuperacion = useMemo(
    () => orders.filter((o) => o.status === 'initiated' || o.status === 'payment_failed').length,
    [orders]
  );

  const updateStatus = async (orderId: string, status: string) => {
    setSavingOrderId(orderId);
    try {
      const token = await getAccessToken();

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo actualizar el estado');
      }

      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status: data.order?.status || status } : o))
      );
    } catch (error) {
      console.error(error);
      alert('No se pudo actualizar el estado de la venta.');
    } finally {
      setSavingOrderId(null);
    }
  };

  const resendEmail = async (orderId: string) => {
    setResendingOrderId(orderId);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, sendEmail: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || 'No se pudo reenviar el email');
      }

      await loadOrders();
      alert('Email reenviado correctamente.');
    } catch (error: any) {
      console.error(error);
      alert(`No se pudo reenviar el email. ${error?.message || ''}`.trim());
    } finally {
      setResendingOrderId(null);
    }
  };

  if (loading) {
    return <p className="p-6">Verificando acceso...</p>;
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Ventas</h1>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-700">Estado:</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {RECOVERY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={loadOrders}
          className="bg-gray-100 border px-3 py-1 rounded text-sm hover:bg-gray-200"
          disabled={fetching}
        >
          {fetching ? 'Actualizando...' : 'Actualizar'}
        </button>
        <p className="text-sm text-gray-600">Pendientes para recuperar: {pendientesRecuperacion}</p>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Pedido</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Pago</th>
              <th className="text-left p-2">MP id</th>
              <th className="text-left p-2">Cliente</th>
              <th className="text-left p-2">Email</th>
              <th className="text-right p-2">Total</th>
              <th className="text-left p-2">Email enviado</th>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Accion</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id} className="border-t">
                <td className="p-2">#{o.order_id}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2">
                  {o.payment_method}
                  {o.payment_status ? ` (${o.payment_status})` : ''}
                </td>
                <td className="p-2">{o.mp_payment_id || '-'}</td>
                <td className="p-2">{o.customer_name || '-'}</td>
                <td className="p-2">{o.customer_email || '-'}</td>
                <td className="p-2 text-right">
                  {o.currency} {Number(o.amount_total || 0).toFixed(2)}
                </td>
                <td className="p-2">
                  {o.email_sent ? `si${o.email_sent_at ? ` (${new Date(o.email_sent_at).toLocaleString('es-AR')})` : ''}` : 'no'}
                </td>
                <td className="p-2">{new Date(o.created_at).toLocaleString('es-AR')}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      defaultValue={o.status}
                      disabled={savingOrderId === o.order_id}
                      onChange={(e) => updateStatus(o.order_id, e.target.value)}
                    >
                      {RECOVERY_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={resendingOrderId === o.order_id}
                      className="border rounded px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => resendEmail(o.order_id)}
                    >
                      {resendingOrderId === o.order_id ? 'Enviando...' : 'Reenviar email'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={10}>
                  No hay ventas para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
