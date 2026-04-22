import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { LogIn, Loader2, ParkingSquare } from "lucide-react";

export const Route = createFileRoute("/entrada")({
  head: () => ({ meta: [{ title: "Registrar entrada — ParkControl" }] }),
  component: () => (
    <ProtectedShell>
      <EntradaPage />
    </ProtectedShell>
  ),
});

interface TipoVehiculo {
  id: number;
  nombre: string;
}

function EntradaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoVehiculo[]>([]);
  const [cuposPorTipo, setCuposPorTipo] = useState<Record<number, number>>({});
  const [placa, setPlaca] = useState("");
  const [tipoId, setTipoId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: t } = await supabase.from("tipos_vehiculo").select("*").order("id");
      setTipos(t ?? []);
      const { data: e } = await supabase
        .from("espacios")
        .select("tipo_vehiculo_id, disponible")
        .eq("disponible", true);
      const map: Record<number, number> = {};
      e?.forEach((row) => {
        map[row.tipo_vehiculo_id] = (map[row.tipo_vehiculo_id] ?? 0) + 1;
      });
      setCuposPorTipo(map);
    };
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const placaUpper = placa.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,10}$/.test(placaUpper)) {
      toast.error("Placa inválida", { description: "Use solo letras, números y guiones (3-10 caracteres)." });
      return;
    }
    if (!tipoId) {
      toast.error("Seleccione un tipo de vehículo");
      return;
    }

    setLoading(true);
    try {
      // Verificar si ya hay un registro EN_CURSO con esa placa
      const { data: existente } = await supabase
        .from("registros")
        .select("id")
        .eq("placa", placaUpper)
        .eq("estado", "EN_CURSO")
        .maybeSingle();

      if (existente) {
        toast.error("Vehículo ya registrado", { description: `La placa ${placaUpper} ya está dentro del parqueadero.` });
        return;
      }

      // Buscar espacio libre del tipo correcto
      const tipoIdNum = Number(tipoId);
      const { data: espacios } = await supabase
        .from("espacios")
        .select("id, codigo")
        .eq("tipo_vehiculo_id", tipoIdNum)
        .eq("disponible", true)
        .limit(1);

      if (!espacios || espacios.length === 0) {
        toast.error("Sin cupos disponibles", { description: "No hay espacios libres para este tipo de vehículo." });
        return;
      }
      const espacio = espacios[0];

      // Buscar tarifa activa
      const { data: tarifa } = await supabase
        .from("tarifas")
        .select("id")
        .eq("tipo_vehiculo_id", tipoIdNum)
        .eq("activo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Crear registro
      const { data: nuevoReg, error: errReg } = await supabase
        .from("registros")
        .insert({
          placa: placaUpper,
          tipo_vehiculo_id: tipoIdNum,
          espacio_id: espacio.id,
          tarifa_id: tarifa?.id ?? null,
          usuario_entrada_id: user.id,
        })
        .select()
        .single();

      if (errReg) throw errReg;

      // Marcar espacio ocupado
      await supabase.from("espacios").update({ disponible: false }).eq("id", espacio.id);

      toast.success(`Entrada registrada — Espacio ${espacio.codigo}`, {
        description: `Placa ${placaUpper}`,
      });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error("Error al registrar entrada", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LogIn className="h-7 w-7 text-primary" /> Registrar entrada
        </h1>
        <p className="text-muted-foreground">Asigna automáticamente un espacio libre.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tipos.map((t) => (
          <Card key={t.id} className="p-3 text-center">
            <ParkingSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.nombre}</div>
            <div className="text-2xl font-bold text-primary">{cuposPorTipo[t.id] ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">cupos libres</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="placa" className="text-base">Placa del vehículo</Label>
            <Input
              id="placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC123"
              required
              maxLength={10}
              className="text-2xl font-mono tracking-widest text-center h-14 mt-1"
            />
          </div>

          <div>
            <Label className="text-base">Tipo de vehículo</Label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger className="h-12 mt-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1)}{" "}
                    <span className="text-muted-foreground">({cuposPorTipo[t.id] ?? 0} cupos)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Registrar entrada"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
