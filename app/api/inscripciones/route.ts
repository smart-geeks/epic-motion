import { NextRequest, NextResponse } from 'next/server';
import { inscribirAlumna } from '@/lib/actions/inscripcion';

// POST /api/inscripciones
// Delega toda la lógica al server action inscribirAlumna.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resultado = await inscribirAlumna(body);

    if (!resultado.ok) {
      return NextResponse.json(resultado, { status: 400 });
    }

    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    console.error('[POST /api/inscripciones]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
