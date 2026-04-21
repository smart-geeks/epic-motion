'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as svc from '@/lib/services/staff-service';
import { Rol } from '@/app/generated/prisma/enums';

const StaffSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  apellido: z.string().min(2, 'El apellido es obligatorio'),
  email: z.string().email('Email inválido'),
  rol: z.nativeEnum(Rol),
  telefono: z.string().optional(),
  tarifaHora: z.coerce.number().min(0).optional(),
  especialidades: z.array(z.string()).optional(),
  activo: z.boolean().default(true),
});

export async function upsertStaff(formData: z.infer<typeof StaffSchema>) {
  try {
    const validated = StaffSchema.parse(formData);

    if (validated.id) {
      await svc.actualizarStaff(validated.id, validated);
    } else {
      await svc.crearStaff(validated);
    }

    revalidatePath('/admin/staff');
    return { success: true, message: 'Miembro del staff guardado correctamente' };
  } catch (error: any) {
    console.error('Error in upsertStaff:', error);
    return { success: false, message: error.message || 'Error al guardar el miembro del staff' };
  }
}

export async function notificarRetraso(claseId: string, maestro: string) {
  // Simulamos el envío de una notificación (WhatsApp/Push)
  // En el futuro esto integraría con un servicio de mensajería
  console.log(`[NOTIFICACIÓN] Enviando aviso a ${maestro} por la clase ${claseId}`);
  
  // Agregamos un delay para simular proceso
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return { 
    success: true, 
    message: `Notificación enviada a ${maestro}. Se ha registrado el aviso.` 
  };
}
