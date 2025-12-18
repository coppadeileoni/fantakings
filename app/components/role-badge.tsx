import { Member } from "../utils/types";

export const ROLE_UI: Record<
  Member["role"],
  {
    label: string;
    badgeClass: string;
    card: { base: string; selected: string; hover: string };
  }
> = {
  player: {
    label: "Giocatore",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    card: {
      base: "border-zinc-200 bg-white",
      selected: "border-blue-500 bg-blue-50",
      hover: "hover:border-blue-400",
    },
  },
  goalkeeper: {
    label: "Portiere",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    card: {
      base: "border-amber-200 bg-amber-50",
      selected: "border-amber-400 bg-amber-100",
      hover: "hover:border-amber-400",
    },
  },
  pres: {
    label: "Presidente",
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
    card: {
      base: "border-purple-200 bg-purple-50",
      selected: "border-purple-500 bg-purple-100",
      hover: "hover:border-purple-400",
    },
  },
};

export function RoleBadge({
  role,
  className = "",
}: {
  role: Member["role"];
  className?: string;
}) {
  const { label, badgeClass } = ROLE_UI[role];

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
