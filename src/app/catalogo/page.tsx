import type { Metadata } from "next";
import { CatalogoScreen } from "@/components/screens/catalogo";

export const metadata: Metadata = { title: "Catálogo · EmpresTI" };

export default function Page() {
  return <CatalogoScreen />;
}
