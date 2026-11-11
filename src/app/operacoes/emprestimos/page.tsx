import type { Metadata } from "next";
import { OperacoesScreen } from "@/components/screens/operacoes";

export const metadata: Metadata = { title: "Empréstimos em aberto · EmpresTI" };

export default function Page() {
  return <OperacoesScreen />;
}
