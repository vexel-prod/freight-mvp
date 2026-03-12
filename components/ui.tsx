import clsx from "clsx";
import type React from "react";

export function Panel(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-white/60 bg-white/80 shadow-panel backdrop-blur",
        props.className,
      )}
    >
      {props.children}
    </section>
  );
}

export function PanelHeader(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("border-b border-slate-200/80 px-6 py-5", props.className)}>{props.children}</div>;
}

export function PanelBody(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-6 py-5", props.className)}>{props.children}</div>;
}

export function Badge(props: React.PropsWithChildren<{ tone?: "neutral" | "good" | "warn" | "bad"; className?: string }>) {
  const tone = props.tone ?? "neutral";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        tone === "neutral" && "border-slate-300 bg-slate-100 text-slate-600",
        tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warn" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "bad" && "border-rose-200 bg-rose-50 text-rose-700",
        props.className,
      )}
    >
      {props.children}
    </span>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const variant = props.variant ?? "primary";
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40",
        variant === "primary" && "bg-ink text-sand hover:bg-slate-800",
        variant === "secondary" && "bg-copper text-white hover:bg-[#b85d30]",
        variant === "ghost" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        props.className,
      )}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900",
        "outline-none ring-0 transition focus:border-copper",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900",
        "outline-none ring-0 transition focus:border-copper",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900",
        "outline-none ring-0 transition focus:border-copper",
        props.className,
      )}
    />
  );
}

export function Label(props: React.PropsWithChildren<{ className?: string }>) {
  return <label className={clsx("mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500", props.className)}>{props.children}</label>;
}

export function Table(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} className={clsx("w-full border-collapse text-sm", props.className)} />;
}

export function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={clsx("border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500", props.className)} />;
}

export function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={clsx("border-b border-slate-100 px-4 py-4 align-top text-slate-700", props.className)} />;
}
