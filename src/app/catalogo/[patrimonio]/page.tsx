import type { Metadata } from "next";
import { DetalheScreen } from "@/components/screens/detalhe";

export const metadata: Metadata = { title: "Equipamento · EmpresTI" };

export default async function Page({ params }: { params: Promise<{ patrimonio: string }> }) {
  const { patrimonio } = await params;
  return <DetalheScreen patrimonio={patrimonio} />;
}
