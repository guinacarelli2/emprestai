"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AppShell, Breadcrumb, HeaderTail, PageTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EquipmentCard } from "@/components/ui/equipment-card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { QueryState } from "@/components/ui/query-state";
import { api } from "@/lib/trpc";
import { categories, categoryLabel, instantDate } from "@/lib/types";
const schema = z.object({
  nome: z.string().trim().min(2, "Informe ao menos dois caracteres no nome.").max(160),
  categoria: z.enum(categories),
  patrimonio: z
    .string()
    .trim()
    .regex(/^TI-\d{4}$/, "Use o formato TI-0000."),
  numeroSerie: z.string().trim().max(120),
  local: z.string().trim().min(2, "Informe ao menos dois caracteres no local.").max(160),
  situacao: z.enum(["disponivel", "manutencao", "fora_de_uso"]),
  observacoes: z.string().trim().max(2000),
});
type Values = z.infer<typeof schema>;
const empty: Values = {
  nome: "",
  categoria: "notebook",
  patrimonio: "",
  numeroSerie: "",
  local: "",
  situacao: "disponivel",
  observacoes: "",
};
const states = { disponivel: "available", manutencao: "maintenance", fora_de_uso: "retired" } as const;
export function CadastroScreen(_props: { userId?: string } = {}) {
  void _props;
  const session = api.auth.me.useQuery();
  const allowed = session.data?.role === "operacoes";
  const recent = api.equipment.recent.useQuery(undefined, { enabled: allowed });
  const utils = api.useUtils();
  const [feedback, setFeedback] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const values = useWatch({ control });
  const mutation = api.equipment.create.useMutation({
    onError: () => {
      void utils.invalidate();
    },
  });
  async function save(data: Values, another: boolean) {
    if (mutation.isPending || !allowed) return;
    setFeedback(null);
    try {
      await mutation.mutateAsync({
        ...data,
        numeroSerie: data.numeroSerie || undefined,
        observacoes: data.observacoes || undefined,
      });
      setFeedback(`Equipamento ${data.patrimonio} cadastrado.`);
      void utils.invalidate();
      if (another) {
        reset(empty);
        setFocus("nome");
      }
    } catch {
      /* O erro permanece no formulário; nenhum valor é apagado. */
    }
  }
  return (
    <AppShell
      screen="06 Cadastrar equipamento"
      operationsOnly
      header={
        <>
          <Breadcrumb
            items={[
              { label: "Operações", href: "/operacoes/emprestimos" },
              { label: "Cadastrar equipamento" },
            ]}
          />
          <HeaderTail />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_320px]">
        <div className="flex max-w-[620px] flex-col gap-[22px]">
          <PageTitle title="Cadastrar equipamento" sub="Um registro por unidade física" />
          <form
            noValidate
            onSubmit={handleSubmit((data) => save(data, false))}
            className="flex flex-col gap-[22px]"
          >
            <fieldset
              disabled={mutation.isPending || isSubmitting}
              className="grid min-w-0 grid-cols-2 gap-[18px]"
            >
              <Field label="Nome" htmlFor="nome" wide error={errors.nome?.message}>
                <Input id="nome" {...register("nome")} />
              </Field>
              <Field label="Categoria" htmlFor="categoria" error={errors.categoria?.message}>
                <Select id="categoria" {...register("categoria")}>
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {categoryLabel[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Patrimônio" htmlFor="patrimonio" error={errors.patrimonio?.message}>
                <Input id="patrimonio" placeholder="TI-0013" {...register("patrimonio")} />
              </Field>
              <Field label="Número de série" htmlFor="numeroSerie" error={errors.numeroSerie?.message}>
                <Input id="numeroSerie" {...register("numeroSerie")} />
              </Field>
              <Field label="Local de retirada" htmlFor="local" error={errors.local?.message}>
                <Input id="local" {...register("local")} />
              </Field>
              <Field label="Situação inicial" htmlFor="situacao" wide error={errors.situacao?.message}>
                <Select id="situacao" {...register("situacao")}>
                  <option value="disponivel">Disponível</option>
                  <option value="manutencao">Em manutenção</option>
                  <option value="fora_de_uso">Fora de uso</option>
                </Select>
                <p className="text-xs text-muted">Em manutenção não aparece como disponível no catálogo.</p>
              </Field>
              <Field label="Observações" htmlFor="observacoes" wide error={errors.observacoes?.message}>
                <Textarea id="observacoes" {...register("observacoes")} />
              </Field>
            </fieldset>
            <p className="text-xs text-muted">
              Cadastro sem foto. Imagens só serão associadas após o pipeline seguro do Pixabay.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="form" disabled={mutation.isPending || isSubmitting}>
                {mutation.isPending ? "Salvando…" : "Cadastrar"}
              </Button>
              <Button
                variant="secondary"
                size="form"
                disabled={mutation.isPending || isSubmitting}
                onClick={handleSubmit((data) => save(data, true))}
              >
                Cadastrar e adicionar outro
              </Button>
            </div>
            {mutation.error && (
              <p role="alert" className="text-late">
                {mutation.error.message}
              </p>
            )}
            {feedback && (
              <p role="status" className="text-ok">
                {feedback}
              </p>
            )}
          </form>
        </div>
        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-xl border border-cardline bg-surface p-5">
            <h2 className="text-[15px] font-semibold">Prévia no catálogo</h2>
            <EquipmentCard
              name={values.nome?.trim() || "Nome do equipamento"}
              category={categoryLabel[values.categoria ?? "notebook"]}
              patrimonio={values.patrimonio || "TI-0000"}
              state={states[values.situacao ?? "disponivel"]}
              footer="Foto ainda não disponibilizada."
            />
          </section>
          <section className="flex flex-col gap-3 rounded-xl border border-cardline bg-surface p-5">
            <h2 className="text-[15px] font-semibold">Últimos cadastros</h2>
            <QueryState
              pending={recent.isPending}
              error={recent.error}
              retry={() => void recent.refetch()}
              empty={recent.data && !recent.data.length ? "Nenhum equipamento cadastrado." : undefined}
            />
            <ul className="flex flex-col gap-3">
              {recent.data?.map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-2 text-[13px]">
                  <span>
                    {item.nome} · {item.patrimonio}
                  </span>
                  <span className="text-muted">{instantDate(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
