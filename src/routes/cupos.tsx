import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ParkingSquare, Car, Bike } from "lucide-react";

export const Route = createFileRoute("/cupos")({
  head: () => ({ meta: [{ title: "Cupos disponibles — ParkControl" }] }),
  component: () => (
    <ProtectedShell>
      <CuposPage />
    </ProtectedShell>
  ),
});

interface Espacio {
  id: number;
  codigo: string;
  disponible: boolean;
  tipo_vehiculo_id: number;
  tipos_vehiculo: { nombre: string };
}

function CuposPage() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("espacios")
        .select("*, tipos_vehiculo(nombre)")
        .order("codigo");
      setEspacios((data as any) ?? []);
    };
    load();
    const ch = supabase
      .channel("cupos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "espacios" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const grupos = {
    sedan: espacios.filter((e) => e.tipos_vehiculo?.nombre === "sedan"),
    camioneta: espacios.filter((e) => e.tipos_vehiculo?.nombre === "camioneta"),
    moto: espacios.filter((e) => e.tipos_vehiculo?.nombre === "moto"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ParkingSquare className="h-7 w-7 text-primary" /> Cupos en tiempo real
        </h1>
        <p className="text-muted-foreground">Visualización del estado de cada espacio.</p>
      </div>

      <SeccionCupos titulo="Sedanes" icon={Car} color="from-emerald-500 to-teal-500" espacios={grupos.sedan} />
      <SeccionCupos titulo="Camionetas" icon={Car} color="from-amber-500 to-orange-500" espacios={grupos.camioneta} />
      <SeccionCupos titulo="Motos" icon={Bike} color="from-sky-500 to-cyan-500" espacios={grupos.moto} />
    </div>
  );
}

function SeccionCupos({ titulo, icon: Icon, color, espacios }: any) {
  const libres = espacios.filter((e: Espacio) => e.disponible).length;
  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">{titulo}</h2>
            <p className="text-xs text-muted-foreground">
              {libres} de {espacios.length} disponibles
            </p>
          </div>
        </div>
        <div className="text-2xl font-bold">
          {libres}<span className="text-muted-foreground text-sm">/{espacios.length}</span>
        </div>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {espacios.map((e: Espacio) => (
          <div
            key={e.id}
            className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold border-2 ${
              e.disponible
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300"
                : "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-600 dark:text-rose-300"
            }`}
            title={e.disponible ? "Disponible" : "Ocupado"}
          >
            {e.codigo}
          </div>
        ))}
      </div>
    </Card>
  );
}
