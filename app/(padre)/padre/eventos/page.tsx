import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEventosFuturos } from "@/lib/services/padre-service";
import PadreEventosClient from "@/components/padre/PadreEventosClient";

export default async function PadreEventosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const eventos = await getEventosFuturos();

  return <PadreEventosClient eventos={eventos} />;
}
