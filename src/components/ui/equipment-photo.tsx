"use client";
import { useState } from "react";
import type { Equipment } from "@/lib/types";
function safeLink(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function PhotoCredit() {
  return (
    <p className="text-xs text-muted">
      Fotos:{" "}
      <a href="https://pixabay.com/" target="_blank" rel="noreferrer">
        Pixabay
      </a>
    </p>
  );
}
export function EquipmentPhoto({ item }: { item: Equipment }) {
  const [failed, setFailed] = useState(false);
  const source = item.imageUrl;
  return (
    <figure className="flex flex-col gap-2">
      {source && !failed ? (
        <img
          src={source}
          width={800}
          height={600}
          alt={`Foto ilustrativa de ${item.nome}`}
          className="aspect-[4/3] w-full rounded-lg object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-soft bg-sunken text-xs text-muted">
          {failed ? "Foto indisponível no momento." : "Foto ainda não disponibilizada."}
        </div>
      )}
      {source && item.photoSource === "Pixabay" && (
        <figcaption className="flex flex-wrap gap-1 text-xs text-muted">
          <span>Foto ilustrativa · </span>
          {safeLink(item.photoPage) ? (
            <a href={safeLink(item.photoPage)} target="_blank" rel="noreferrer">
              Pixabay
            </a>
          ) : (
            <span>Pixabay</span>
          )}
          {item.photographer && (
            <span>
              ·{" "}
              {safeLink(item.photographerUrl) ? (
                <a href={safeLink(item.photographerUrl)} target="_blank" rel="noreferrer">
                  {item.photographer}
                </a>
              ) : (
                item.photographer
              )}
            </span>
          )}
          {safeLink(item.licenseUrl) && (
            <a href={safeLink(item.licenseUrl)} target="_blank" rel="noreferrer">
              · {item.licenseName || "Licença"}
            </a>
          )}
        </figcaption>
      )}
    </figure>
  );
}
