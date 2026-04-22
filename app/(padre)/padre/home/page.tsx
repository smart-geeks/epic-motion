import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getHomeResumen } from "@/lib/services/padre-service";
import PadreHomeClient from "@/components/padre/PadreHomeClient";

export default async function PadreHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const resumen = await getHomeResumen(session.user.id);

  return (
    <PadreHomeClient
      nombre={session.user.nombre ?? "Bienvenido"}
      resumen={resumen}
    />
  );
}
