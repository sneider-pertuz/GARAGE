import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Car, LogIn, LogOut, ParkingSquare, Receipt, Settings, Users, BarChart3, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/parking";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — ParkControl" }],
  }),
  component: () => (
    <ProtectedShell>
      <Dashboard />
    </ProtectedShell>
  ),
});

interface Stats {
  cuposAutos: { total: number; libres: number };
  cuposMotos: { total: number; libres: number };
  vehiculosDentro: number;
  ingresosHoy: number;
}

function Dashboard() {
  const { role, nombre } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: espacios } = await supabase
        .from("espacios")
        .select("disponible, tipos_vehiculo(nombre)");

      const cuposAutos = { total: 0, libres: 0 };
      const cuposMotos = { total: 0, libres: 0 };
      espacios?.forEach((e: any) => {
        const isMoto = e.tipos_vehiculo?.nombre === "moto";
        const target = isMoto ? cuposMotos : cuposAutos;
        target.total++;
        if (e.disponible) target.libres++;
      });

      const { count: dentro } = await supabase
        .from("registros")
        .select("*", { count: "exact", head: true })
        .eq("estado", "EN_CURSO");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: regsHoy } = await supabase
        .from("registros")
        .select("valor_calculado")
        .eq("estado", "FINALIZADO")
        .gte("fecha_hora_salida", today.toISOString());

      const ingresosHoy =
        regsHoy?.reduce((sum, r: any) => sum + Number(r.valor_calculado || 0), 0) ?? 0;

      setStats({ cuposAutos, cuposMotos, vehiculosDentro: dentro ?? 0, ingresosHoy });
    };
    load();
  }, []);

  const operarioActions = [
    { to: "/entrada", title: "Registrar entrada", desc: "Vehículo que llega", icon: LogIn, color: "from-emerald-500 to-teal-500" },
    { to: "/salida", title: "Registrar salida", desc: "Cobrar y liberar", icon: LogOut, color: "from-amber-500 to-orange-500" },
    { to: "/cupos", title: "Consultar cupos", desc: "Disponibilidad en vivo", icon: ParkingSquare, color: "from-sky-500 to-blue-500" },
  ] as const;

  const adminActions = [
    { to: "/admin/tarifas", title: "Gestión de tarifas", desc: "Configurar precios", icon: Settings, color: "from-violet-500 to-purple-500" },
    { to: "/admin/usuarios", title: "Gestión de usuarios", desc: "Roles y accesos", icon: Users, color: "from-pink-500 to-rose-500" },
    { to: "/admin/reportes", title: "Reportes", desc: "Ingresos y estadísticas", icon: BarChart3, color: "from-indigo-500 to-blue-500" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hola, {nombre ?? "operario"} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {role === "admin" ? "Panel de administración" : "Panel de operario"} —{" "}
          {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cupos autos"
          value={stats ? `${stats.cuposAutos.libres}/${stats.cuposAutos.total}` : "—"}
          subtitle="disponibles"
          icon={Car}
          variant="primary"
        />
        <StatCard
          title="Cupos motos"
          value={stats ? `${stats.cuposMotos.libres}/${stats.cuposMotos.total}` : "—"}
          subtitle="disponibles"
          icon={ParkingSquare}
          variant="accent"
        />
        <StatCard
          title="Vehículos dentro"
          value={stats?.vehiculosDentro.toString() ?? "—"}
          subtitle="en este momento"
          icon={Receipt}
          variant="warning"
        />
        <StatCard
          title="Ingresos hoy"
          value={stats ? formatCurrency(stats.ingresosHoy) : "—"}
          subtitle="acumulado"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Operación</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operarioActions.map((a) => (
            <ActionCard key={a.to} {...a} />
          ))}
        </div>
      </section>

      {role === "admin" && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Administración</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminActions.map((a) => (
              <ActionCard key={a.to} {...a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  variant: "primary" | "accent" | "warning" | "success";
}) {
  const styles = {
    primary: "from-primary to-primary-glow",
    accent: "from-sky-500 to-cyan-500",
    warning: "from-amber-500 to-orange-500",
    success: "from-emerald-500 to-teal-500",
  };
  return (
    <Card className="p-4 shadow-card overflow-hidden relative">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${styles[variant]} opacity-15`} />
      <div className="flex items-center justify-between relative">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
    </Card>
  );
}

function ActionCard({ to, title, desc, icon: Icon, color }: any) {
  return (
    <Link to={to}>
      <Card className="p-5 shadow-card hover:shadow-elegant transition-all cursor-pointer group h-full">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white mb-3 group-hover:scale-110 transition`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </Card>
    </Link>
  );
}
