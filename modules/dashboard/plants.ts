import type { UserProfile } from "./types";

export const PLANTA_OPTIONS = [
  { value: "llave2", label: "Llave" },
  { value: "periferico", label: "Periférico" },
] as const;

export type PlantaValue = (typeof PLANTA_OPTIONS)[number]["value"];

const validPlantas = new Set<PlantaValue>(["llave2", "periferico"]);

function normalizePlanta(value: string | null | undefined): PlantaValue | null {
  if (!value) return null;
  return validPlantas.has(value as PlantaValue) ? (value as PlantaValue) : null;
}

export function resolvePlantaForUser(
  user: UserProfile,
  requestedPlanta?: string | null
): PlantaValue {
  const userPlanta = normalizePlanta(user.planta) ?? "llave2";

  if (user.role !== "admin") {
    return userPlanta;
  }

  return normalizePlanta(requestedPlanta) ?? userPlanta;
}
