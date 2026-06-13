"use client";

import { cn } from "@/lib/cn";

export function PillarTag({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  if (!name) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 hairline bg-bg text-accent mono-caps",
        className
      )}
    >
      {name}
    </span>
  );
}

const STATUS_COLOR: Record<string, string> = {
  idea: "text-textDim",
  scripted: "text-text",
  filmed: "text-accent",
  edited: "text-success",
  posted: "text-success",
};

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 hairline bg-surface mono-caps",
        STATUS_COLOR[status] ?? "text-textDim",
        className
      )}
    >
      {status}
    </span>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    idea: "bg-textDim",
    scripted: "bg-text",
    filmed: "bg-accent",
    edited: "bg-success",
    posted: "bg-success",
  };
  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full",
        map[status] ?? "bg-textDim",
        className
      )}
    />
  );
}

export function Button({
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger" | "ghost";
}) {
  const styles: Record<string, string> = {
    default: "bg-surface hairline text-text hover:bg-bg",
    primary: "bg-accent text-bg hover:opacity-90 font-medium",
    danger: "bg-danger text-bg hover:opacity-90 font-medium",
    ghost: "text-textDim hover:text-text",
  };
  return (
    <button
      {...props}
      className={cn(
        "px-4 py-2 mono-caps text-[11px] transition-opacity",
        styles[variant],
        className
      )}
    />
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mono-caps text-textDim", className)}>{children}</div>;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full bg-surface hairline px-3 py-2 text-text placeholder:text-textDim resize-none focus:outline-none focus:border-accent",
        className
      )}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full bg-surface hairline px-3 py-2 text-text placeholder:text-textDim focus:outline-none focus:border-accent",
        className
      )}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full bg-surface hairline px-3 py-2 text-text focus:outline-none focus:border-accent",
        className
      )}
    >
      {children}
    </select>
  );
}
