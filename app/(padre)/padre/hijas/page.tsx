import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getHijasByPadre } from "@/lib/services/padre-service";
import PadreHijasClient from "@/components/padre/PadreHijasClient";

export default async function PadreHijasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const hijas = await getHijasByPadre(session.user.id);

  return <PadreHijasClient hijas={hijas} />;
}
