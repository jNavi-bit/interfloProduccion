import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Construction className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-slate-400">
        {description || "Esta sección estará disponible próximamente."}
      </p>
    </div>
  );
}
