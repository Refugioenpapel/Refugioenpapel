import { importCorreoArgentinoShipping } from './importShipping';

export async function importShippingForOrder(options: {
  orderId: string;
  checkoutData: Record<string, unknown> | null;
  cartItems: unknown[] | null;
  supabaseAdmin: any;
}) {
  const { orderId, checkoutData, cartItems, supabaseAdmin } = options;

  const shippingImportEnabled = String(process.env.CORREO_IMPORT_SHIPPING || '').toLowerCase() === 'true';
  if (!shippingImportEnabled) {
    return {
      imported: false,
      skipped: true,
      reason: 'shipping_import_disabled',
      detail: { enabled: false },
    };
  }

  if (!checkoutData || typeof checkoutData !== 'object') {
    return { imported: false, skipped: true, reason: 'checkout_data_missing' };
  }

  const hasPhysicalItem = Array.isArray(cartItems)
    ? cartItems.some((item) => (item as any)?.is_physical)
    : false;

  if (!hasPhysicalItem) {
    return { imported: false, skipped: true, reason: 'no_physical_items' };
  }

  const correoShippingImport = (checkoutData as any).correoShippingImport;
  if (correoShippingImport?.success === true && correoShippingImport?.importedAt) {
    return { imported: true, skipped: true, reason: 'already_imported', result: correoShippingImport };
  }

  const deliveryType = String((checkoutData as any).metodoEntrega || '').trim();
  const postalCode = String((checkoutData as any).cp || '').trim();
  const street = String((checkoutData as any).calle || '').trim();
  const number = String((checkoutData as any).numero || '').trim();
  const locality = String((checkoutData as any).localidad || '').trim();
  const province = String((checkoutData as any).provincia || '').trim();
  const selectedAgency = String(
    (checkoutData as any).selectedBranchId || (checkoutData as any).selectedBranch?.id || ''
  ).trim();

  if (!deliveryType || !postalCode || !street || !number || !locality || !province) {
    return {
      imported: false,
      skipped: false,
      reason: 'missing_shipping_fields',
      detail: { deliveryType, postalCode, street, number, locality, province },
    };
  }

  if (deliveryType !== 'domicilio' && !selectedAgency) {
    return {
      imported: false,
      skipped: false,
      reason: 'missing_pickup_agency',
      detail: { deliveryType, selectedAgency },
    };
  }

  const items = Array.isArray(cartItems)
    ? cartItems.map((item) => {
        const data = item as any;
        return {
          title: String(data.name || data.title || 'Producto'),
          quantity: Number(data.quantity || 1),
          unit_price: Number(data.price ?? data.unit_price ?? 0),
        };
      })
    : [];

  const importResult = await importCorreoArgentinoShipping({
    orderId,
    destinationPostalCode: postalCode,
    deliveryType: deliveryType === 'domicilio' ? 'domicilio' : 'sucursal',
    dimensions: {
      weight: Number((checkoutData as any).shippingWeight || 1000) || 1000,
      height: 10,
      width: 20,
      length: 30,
    },
    customerName: `${String((checkoutData as any).nombre || '')} ${String((checkoutData as any).apellido || '')}`.trim(),
    customerEmail: String((checkoutData as any).email || ''),
    customerPhone: String((checkoutData as any).telefono || ''),
    address: {
      street,
      number,
      floor: String((checkoutData as any).piso || '').trim() || undefined,
      apartment: String((checkoutData as any).departamento || '').trim() || undefined,
      neighborhood: String((checkoutData as any).barrio || '').trim() || undefined,
      locality,
      province,
      postalCode,
    },
    items,
    notes: String((checkoutData as any).mensaje || '') || `Pedido ${orderId}`,
    agency: selectedAgency || undefined,
  });

  const now = new Date().toISOString();
  const nextCheckoutData = {
    ...checkoutData,
    correoShippingImport: {
      attemptedAt: now,
      importedAt: importResult.ok ? now : null,
      success: importResult.ok,
      result: {
        ok: importResult.ok,
        status: importResult.status,
        error: importResult.error || null,
        data: importResult.data || null,
        raw: importResult.ok ? null : importResult.raw || null,
      },
    },
  };

  try {
    await supabaseAdmin
      .from('orders')
      .update({ checkout_data: nextCheckoutData })
      .eq('order_id', orderId);
  } catch (updateError) {
    console.error('Error guardando estado de shipping import en Supabase:', updateError);
  }

  return {
    imported: importResult.ok,
    skipped: false,
    result: importResult,
  };
}
