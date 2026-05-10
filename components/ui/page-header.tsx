import * as React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4 mb-6", className)}>
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 dark:text-slate-100 m-0 leading-none">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-0">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
