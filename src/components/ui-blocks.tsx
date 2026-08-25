import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("animate-fade-rise", className)}>
      {eyebrow ? (
        <p className="formula text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card-surface animate-fade-rise overflow-hidden", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card-surface animate-fade-rise p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FormulaCard({
  lines,
  caption,
  className,
}: {
  lines: string[];
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-secondary/60 px-4 py-3", className)}>
      <div className="space-y-1.5">
        {lines.map((l) => (
          <p key={l} className="formula text-sm text-foreground">
            {l}
          </p>
        ))}
      </div>
      {caption ? <p className="mt-2 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}

export function WhatIsHappening({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-xl border border-primary/25 bg-accent/50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        What is happening?
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{children}</p>
    </aside>
  );
}

export const fmt = (n: number, d = 4) =>
  Number.isFinite(n) ? n.toFixed(d) : "—";

export const fmtSci = (n: number) =>
  !Number.isFinite(n) ? "—" : Math.abs(n) >= 1e-3 || n === 0 ? n.toFixed(5) : n.toExponential(3);
