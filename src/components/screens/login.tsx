"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Package } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido.").max(254),
  senha: z.string().min(1, "Informe a senha.").max(256),
});
type Values = z.infer<typeof schema>;

export function LoginScreen() {
  const router = useRouter();
  const cache = useQueryClient();
  const login = api.auth.login.useMutation({
    onSuccess: () => {
      cache.clear();
      router.push("/catalogo");
      router.refresh();
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", senha: "" } });

  return (
    <div
      data-screen-label="01 Login"
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[560px_1fr] bg-bg"
    >
      <section className="flex flex-col justify-between bg-[linear-gradient(160deg,#001449_0%,#00102F_60%,#080C1A_100%)] gap-8 p-6 lg:p-14">
        <div className="flex items-center gap-[10px] text-[16px] font-semibold tracking-[0.02em]">
          <span className="flex size-[34px] items-center justify-center rounded-[8px] bg-accent-900 shadow-[0_0_0_1px_#25408F]">
            <Package size={18} className="text-accent-300" aria-hidden />
          </span>
          EmpresTI
        </div>
        <div className="flex flex-col gap-5">
          <h1 className="max-w-[20ch] text-[34px] leading-[1.15] font-semibold tracking-[-0.01em]">
            Quem está com o quê
          </h1>
          <p className="max-w-[38ch] text-[14px] text-[#93A0C6]">Pedido e devolução sem planilha.</p>
          <div className="divider-brand w-full max-w-[320px]" />
          <div className="flex gap-10">
            <div className="flex flex-col gap-1">
              <span className="text-[24px] font-semibold">3</span>
              <span className="text-[12px] text-[#93A0C6]">itens por pessoa</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[24px] font-semibold">14</span>
              <span className="text-[12px] text-[#93A0C6]">dias de prazo</span>
            </div>
          </div>
        </div>
        <span className="text-[11px] text-[#93A0C6]">Operações · v1</span>
      </section>

      <section className="flex items-center justify-center gap-8 p-6 lg:p-14">
        <form
          noValidate
          onSubmit={handleSubmit((values) => login.mutate({ email: values.email, password: values.senha }))}
          className="flex w-full max-w-[372px] flex-col gap-[18px]"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Entrar</h2>
            <p className="text-[13px] text-muted">E-mail e senha do convite.</p>
          </div>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="nome@empresa.com"
              {...register("email")}
            />
          </Field>
          <Field label="Senha" htmlFor="senha" error={errors.senha?.message}>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="Senha"
              {...register("senha")}
            />
          </Field>
          {login.error && (
            <p role="alert" className="text-sm text-late">
              {login.error.message}
            </p>
          )}
          <Button type="submit" size="form" disabled={login.isPending}>
            {login.isPending ? "Entrando…" : "Entrar"}
            <ArrowRight size={16} aria-hidden />
          </Button>
          <div className="divider-fade" />
          <p className="text-center text-[12px] text-faint">Sem acesso? Fale com Operações.</p>
        </form>
      </section>
    </div>
  );
}
