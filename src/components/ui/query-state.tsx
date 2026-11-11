"use client";
import { Button } from "./button";
export function QueryState({
  pending,
  error,
  empty,
  retry,
}: {
  pending?: boolean;
  error?: { message: string } | null;
  empty?: string;
  retry?: () => void;
}) {
  if (pending)
    return (
      <p role="status" className="p-5 text-muted">
        Carregando…
      </p>
    );
  if (error)
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-xl border border-late-line p-5 text-late"
      >
        <p>{error.message || "Não foi possível carregar os dados."}</p>
        {retry && <Button onClick={retry}>Tentar novamente</Button>}
      </div>
    );
  return empty ? (
    <p role="status" className="rounded-xl border border-soft p-5 text-muted">
      {empty}
    </p>
  ) : null;
}
