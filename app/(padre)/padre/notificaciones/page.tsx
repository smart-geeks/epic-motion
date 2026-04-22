import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotificacionesByPadre } from "@/lib/services/padre-service";
import PadreNotificacionesClient from "@/components/padre/PadreNotificacionesClient";

export default async function PadreNotificacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const notificaciones = await getNotificacionesByPadre(session.user.id);

  return (
    <PadreNotificacionesClient
      notificaciones={notificaciones}
      padreId={session.user.id}
    />
  );
}
