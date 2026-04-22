import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Car, LogOut, LayoutDashboard, LogIn, LogOut as LogOutIcon, ParkingSquare, Receipt, Users, Settings, BarChart3 } from "lucide-react";
import { WhatsAppFloat } from "./WhatsAppFloat";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, role, nombre } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const operarioLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/entrada", label: "Entrada", icon: LogIn },
    { to: "/salida", label: "Salida", icon: LogOutIcon },
    { to: "/cupos", label: "Cupos", icon: ParkingSquare },
  ] as const;

  const adminLinks = [
    { to: "/admin/tarifas", label: "Tarifas", icon: Settings },
    { to: "/admin/usuarios", label: "Usuarios", icon: Users },
    { to: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight">ParkControl</div>
              <div className="text-xs text-muted-foreground leading-tight">Sistema de Parqueadero</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {operarioLinks.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
            {role === "admin" &&
              adminLinks.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                );
              })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-medium">{nombre ?? "Usuario"}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {role ?? "—"}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Salir</span>
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t flex overflow-x-auto px-2 py-2 gap-1">
          {operarioLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <l.icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            );
          })}
          {role === "admin" &&
            adminLinks.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                </Link>
              );
            })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      <WhatsAppFloat />
    </div>
  );
}
