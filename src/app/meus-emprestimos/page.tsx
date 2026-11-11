import type { Metadata } from "next";
import { MeusEmprestimosScreen } from "@/components/screens/meus-emprestimos";

export const metadata: Metadata = { title: "Meus empréstimos · EmpresTI" };

export default function Page() {
  return <MeusEmprestimosScreen />;
}
