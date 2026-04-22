import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Car, Receipt } from "lucide-react";
import { formatCurrency, formatDate, formatDuration } from "@/lib/parking";

export const Route = createFileRoute("/admin/reportes")({
  head: () => ({ meta: [{ title: "Reportes — ParkControl" }] }),
  component: () => (
    <ProtectedShell requireAdmin>
      <ReportesPage />
    </ProtectedShell>
  ),
});

interface RegRow {
  id: number;
  placa: string;
  fecha_hora_entrada: string;
  fecha_hora_salida: string;
  minutos_totales: number;
  valor_calculado: number;
  tipos_vehiculo: { nombre: string };
}

function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);
  const [registros, setRegistros] = useState<RegRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const desdeIso = new Date(desde + "T00:00:00").toISOString();
      const hastaIso = new Date(hasta + "T23:59:59").toISOString();
      const { data } = await supabase
        .from("registros")
        .select("*, tipos_vehiculo(nombre)")
        .eq("estado", "FINALIZADO")
        .gte("fecha_hora_salida", desdeIso)
        .lte("fecha_hora_salida", hastaIso)
        .order("fecha_hora_salida", { ascending: false });
      setRegistros((data as any) ?? []);
    };
    load();
  }, [desde, hasta]);

  const totalIngresos = registros.reduce((s, r) => s + Number(r.valor_calculado || 0), 0);
  const totalVehiculos = registros.length;
  const promedioMin = totalVehiculos
    ? Math.round(registros.reduce((s, r) => s + (r.minutos_totales || 0), 0) / totalVehiculos)
    : 0;

  const porTipo = registros.reduce<Record<string, { count: number; ingresos: number }>>((acc, r) => {
    const tipo = r.tipos_vehiculo?.nombre ?? "—";
    if (!acc[tipo]) acc[tipo] = { count: 0, ingresos: 0 };
    acc[tipo].count++;
    acc[tipo].ingresos += Number(r.valor_calculado || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" /> Reportes
        </h1>
        <p className="text-muted-foreground">Ingresos y movimientos por rango de fechas.</p>
      </div>

      <Card className="p-4 shadow-card flex flex-wrap gap-4 items-end">
        <div>
          <Label>Desde</Label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 shadow-card">
          <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Ingresos</div>
          <div className="text-2xl font-bold">{formatCurrency(totalIngresos)}</div>
        </Card>
        <Card className="p-5 shadow-card">
          <Car className="h-5 w-5 text-primary mb-2" />
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Vehículos</div>
          <div className="text-2xl font-bold">{totalVehiculos}</div>
        </Card>
        <Card className="p-5 shadow-card">
          <Receipt className="h-5 w-5 text-amber-500 mb-2" />
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Estadía promedio</div>
          <div className="text-2xl font-bold">{formatDuration(promedioMin)}</div>
        </Card>
      </div>

      <Card className="p-5 shadow-card">
        <h2 className="font-semibold mb-3">Por tipo de vehículo</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {Object.entries(porTipo).map(([tipo, stats]) => (
            <div key={tipo} className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground capitalize">{tipo}</div>
              <div className="text-lg font-bold">{stats.count} vehículos</div>
              <div className="text-sm text-primary">{formatCurrency(stats.ingresos)}</div>
            </div>
          ))}
          {Object.keys(porTipo).length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground text-center py-4">Sin datos en el rango.</div>
          )}
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <h2 className="font-semibold p-4 border-b">Detalle de registros</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Placa</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Entrada</th>
                <th className="text-left p-3 font-medium">Salida</th>
                <th className="text-left p-3 font-medium">Tiempo</th>
                <th className="text-right p-3 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono font-bold">{r.placa}</td>
                  <td className="p-3 capitalize">{r.tipos_vehiculo?.nombre}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(r.fecha_hora_entrada)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(r.fecha_hora_salida)}</td>
                  <td className="p-3">{formatDuration(r.minutos_totales)}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(Number(r.valor_calculado))}</td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">Sin registros en el rango.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
