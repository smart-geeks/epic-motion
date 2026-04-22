import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCargosByPadre } from "@/lib/services/padre-service";
import PadrePagosClient from "@/components/padre/PadrePagosClient";

export default async function PadrePagosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const cargos = await getCargosByPadre(session.user.id);

  return <PadrePagosClient cargos={cargos} />;
}
