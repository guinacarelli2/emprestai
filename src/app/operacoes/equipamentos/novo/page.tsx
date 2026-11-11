import type { Metadata } from "next";
import { CadastroScreen } from "@/components/screens/cadastro";

export const metadata: Metadata = { title: "Cadastrar equipamento · EmpresTI" };

export default function Page() {
  return <CadastroScreen />;
}
