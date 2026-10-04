import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeading({ eyebrow, title, description, align = "left", className }: Props) {
  return (
    <div className={cn("max-w-prose", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-graphite/60">{description}</p>
      ) : null}
    </div>
  );
}
