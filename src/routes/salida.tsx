import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { LogOut, Loader2, Search, Clock, Receipt } from "lucide-react";
import { calcularValor, formatCurrency, formatDate, formatDuration, tipoCobroLabel } from "@/lib/parking";

export const Route = createFileRoute("/salida")({
  head: () => ({ meta: [{ title: "Registrar salida — ParkControl" }] }),
  component: () => (
    <ProtectedShell>
      <SalidaPage />
    </ProtectedShell>
  ),
});

interface RegistroEnCurso {
  id: number;
  placa: string;
  fecha_hora_entrada: string;
  espacio_id: number;
  tipo_vehiculo_id: number;
  tarifa_id: number | null;
  espacios: { codigo: string };
  tipos_vehiculo: { nombre: string };
  tarifas: { tipo_cobro: any; valor: number; nombre: string } | null;
}

function SalidaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("");
  const [registros, setRegistros] = useState<RegistroEnCurso[]>([]);
  const [seleccionado, setSeleccionado] = useState<RegistroEnCurso | null>(null);
  const [descuento, setDescuento] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRegistros();
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadRegistros = async () => {
    const { data } = await supabase
      .from("registros")
      .select("*, espacios(codigo), tipos_vehiculo(nombre), tarifas(tipo_cobro, valor, nombre)")
      .eq("estado", "EN_CURSO")
      .order("fecha_hora_entrada", { ascending: false });
    setRegistros((data as any) ?? []);
  };

  const filtered = registros.filter((r) =>
    filtro ? r.placa.includes(filtro.toUpperCase()) : true,
  );

  const calcularResumen = (r: RegistroEnCurso) => {
    const entrada = new Date(r.fecha_hora_entrada).getTime();
    const minutos = Math.max(1, Math.floor((now - entrada) / 60000));
    const tarifa = r.tarifas;
    const bruto = tarifa ? calcularValor({ tipo_cobro: tarifa.tipo_cobro, valor: Number(tarifa.valor) }, minutos) : 0;
    const total = Math.max(0, bruto - descuento);
    return { minutos, bruto, total, tarifa };
  };

  const handleConfirmar = async () => {
    if (!seleccionado || !user) return;
    setLoading(true);
    try {
      const { minutos, total } = calcularResumen(seleccionado);
      const ahora = new Date().toISOString();

      const { error: errReg } = await supabase
        .from("registros")
        .update({
          fecha_hora_salida: ahora,
          minutos_totales: minutos,
          valor_calculado: total,
          descuento,
          estado: "FINALIZADO",
          usuario_salida_id: user.id,
        })
        .eq("id", seleccionado.id);
      if (errReg) throw errReg;

      // Liberar espacio
      await supabase.from("espacios").update({ disponible: true }).eq("id", seleccionado.espacio_id);

      // Generar ticket
      const codigo = `T-${seleccionado.id}-${Date.now().toString(36).toUpperCase()}`;
      const { data: ticket, error: errT } = await supabase
        .from("tickets")
        .insert({
          registro_id: seleccionado.id,
          codigo_ticket: codigo,
        })
        .select()
        .single();
      if (errT) throw errT;

      toast.success("Salida registrada", { description: `Ticket ${codigo}` });
      navigate({ to: "/ticket/$id", params: { id: String(ticket.id) } });
    } catch (err: any) {
      toast.error("Error al registrar salida", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (seleccionado) {
    const { minutos, bruto, total, tarifa } = calcularResumen(seleccionado);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" /> Confirmar salida
          </h1>
          <p className="text-muted-foreground">Verifica los datos antes de cobrar.</p>
        </div>

        <Card className="p-6 shadow-elegant bg-gradient-card">
          <div className="text-center pb-4 border-b">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Placa</div>
            <div className="text-4xl font-mono font-bold tracking-wider mt-1">{seleccionado.placa}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Espacio <strong>{seleccionado.espacios.codigo}</strong> · {seleccionado.tipos_vehiculo.nombre}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b">
            <div>
              <div className="text-xs text-muted-foreground">Entrada</div>
              <div className="font-medium">{formatDate(seleccionado.fecha_hora_entrada)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Salida</div>
              <div className="font-medium">{formatDate(new Date())}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tiempo total</div>
              <div className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(minutos)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tarifa</div>
              <div className="font-medium">
                {tarifa ? `${formatCurrency(Number(tarifa.valor))} · ${tipoCobroLabel(tarifa.tipo_cobro)}` : "Sin tarifa"}
              </div>
            </div>
          </div>

          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(bruto)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="desc" className="text-sm text-muted-foreground whitespace-nowrap">Descuento (COP)</Label>
              <Input
                id="desc"
                type="number"
                min={0}
                value={descuento}
                onChange={(e) => setDescuento(Math.max(0, Number(e.target.value) || 0))}
                className="max-w-[140px] text-right"
              />
            </div>
            <div className="flex justify-between items-end pt-3 border-t">
              <span className="text-sm text-muted-foreground">Total a pagar</span>
              <span className="text-3xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSeleccionado(null)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirmar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar cobro"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LogOut className="h-7 w-7 text-primary" /> Registrar salida
        </h1>
        <p className="text-muted-foreground">Selecciona el vehículo que sale.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por placa..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value.toUpperCase())}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No hay vehículos {filtro ? "que coincidan" : "dentro del parqueadero"}.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((r) => {
            const min = Math.floor((now - new Date(r.fecha_hora_entrada).getTime()) / 60000);
            return (
              <Card
                key={r.id}
                className="p-4 cursor-pointer hover:shadow-elegant transition border-2 border-transparent hover:border-primary/30"
                onClick={() => {
                  setSeleccionado(r);
                  setDescuento(0);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xl font-bold tracking-wider">{r.placa}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {r.tipos_vehiculo.nombre} · Espacio {r.espacios.codigo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Tiempo</div>
                    <div className="font-medium text-sm">{formatDuration(min)}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
