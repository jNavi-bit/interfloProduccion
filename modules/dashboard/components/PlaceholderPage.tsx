import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
        <Construction className="h-8 w-8 text-violet-400" strokeWidth={1.5} />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-strong">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-mute">
        {description || "Esta sección estará disponible próximamente."}
      </p>
    </div>
  );
}
