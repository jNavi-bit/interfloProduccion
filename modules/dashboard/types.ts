export type UserRole = "admin" | "capturista";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  planta: string;
  /** Correo de sesión (Auth o columna usuarios.email). */
  email: string | null;
  /** Si true, debe completar /dashboard/cambiar-contrasena antes de usar el resto del panel. */
  mustChangePassword: boolean;
}

export interface DashboardStats {
  lastDate: string | null;
  totalMerma: number;
  totalProducido: number;
  componentesFabricados: number;
  maquinaEficiente: string | null;
}

export interface RecentRecord {
  id: number;
  capturista: string | null;
  fecha: string | null;
  producto: string | null;
  componente: string | null;
  maquina: string | null;
  cantidad_producida: number | null;
}
