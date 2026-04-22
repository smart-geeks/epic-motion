"use server";

import { marcarNotificacionLeida } from "@/lib/services/padre-service";

export async function marcarNotificacionLeidaAction(
  notificacionId: string,
  padreId: string
): Promise<void> {
  await marcarNotificacionLeida(notificacionId, padreId);
}
