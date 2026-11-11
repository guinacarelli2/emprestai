import {
  Laptop,
  Monitor,
  ProjectorScreen,
  Usb,
  VideoCamera,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pill, type PillState } from "./pill";

export const categoryIcon: Record<Category, Icon> = {
  Notebooks: Laptop,
  Monitores: Monitor,
  Câmeras: VideoCamera,
  Cabos: Usb,
  Projetores: ProjectorScreen,
};

export function ItemIcon({ category, size = 40 }: { category: Category; size?: 40 | 44 }) {
  const Glyph = categoryIcon[category];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-sunken text-accent-400",
        size === 40 ? "size-10 rounded-[9px]" : "size-11 rounded-[10px]",
      )}
    >
      <Glyph size={size === 40 ? 20 : 21} aria-hidden />
    </span>
  );
}

type Props = {
  name: string;
  category: Category;
  patrimonio: string;
  state: PillState;
  footer: string;
  href?: string;
  className?: string;
};

/** Card de equipamento (layout.md §5.4). Só o disponível é clicável. */
export function EquipmentCard({ name, category, patrimonio, state, footer, href, className }: Props) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <ItemIcon category={category} />
        <Pill state={state} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-text">{name}</div>
        <div className="text-[12px] text-ink-500">
          {category} · {patrimonio}
        </div>
      </div>
      <div className={cn("text-[12px]", state === "available" ? "text-accent-400" : "text-faint")}>{footer}</div>
    </>
  );
  const base = "flex min-h-[158px] flex-col justify-between gap-3 rounded-[12px] border border-cardline bg-surface p-4";
  if (href && state === "available") {
    return (
      <Link
        href={href}
        data-state={state}
        className={cn(
          base,
          "text-text transition-[border-color] duration-[160ms] ease-out hover:border-accent-600 hover:text-text",
          className,
        )}
      >
        {body}
      </Link>
    );
  }
  return (
    <article data-state={state} className={cn(base, className)}>
      {body}
    </article>
  );
}
