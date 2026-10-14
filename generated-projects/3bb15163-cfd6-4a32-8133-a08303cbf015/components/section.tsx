import { cn } from "@/lib/utils";

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("border-b border-line", className)}>
      <div className="mx-auto max-w-shell px-4 py-14 sm:px-6 sm:py-20">
        {(eyebrow || title || description) && (
          <div className="mb-10 max-w-2xl">
            {eyebrow && (
              <p className="font-mono text-xs uppercase tracking-widest text-muted">{eyebrow}</p>
            )}
            {title && (
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            )}
            {description && <p className="mt-3 text-sm text-muted sm:text-base">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
