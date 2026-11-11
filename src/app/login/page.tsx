import type { Metadata } from "next";
import { LoginScreen } from "@/components/screens/login";

export const metadata: Metadata = { title: "Entrar · EmpresTI" };

export default function Page() {
  return <LoginScreen />;
}
