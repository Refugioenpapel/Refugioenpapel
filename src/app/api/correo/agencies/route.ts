import { NextRequest, NextResponse } from 'next/server';
import { fetchSucursalOptionsForCp } from '@lib/correoArgentino/agencies';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cp, provincia, localidad } = body || {};

    if (!cp && !provincia) {
      return NextResponse.json(
        { error: 'Se requiere cp o provincia para buscar sucursales' },
        { status: 400 }
      );
    }

    try {
      const agencies = await fetchSucursalOptionsForCp({ cp, provincia, localidad });
      const hasAgencies = Array.isArray(agencies) && agencies.length > 0;
      return NextResponse.json({
        agencies: hasAgencies ? agencies : [],
        fallback: !hasAgencies,
      });
    } catch (error) {
      return NextResponse.json({
        agencies: [],
        fallback: true,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo parsear la solicitud', detail: String(error) },
      { status: 400 }
    );
  }
}
