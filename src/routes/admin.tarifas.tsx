import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Plus, Loader2 } from "lucide-react";
import { formatCurrency, tipoCobroLabel } from "@/lib/parking";

export const Route = createFileRoute("/admin/tarifas")({
  head: () => ({ meta: [{ title: "Tarifas — ParkControl" }] }),
  component: () => (
    <ProtectedShell requireAdmin>
      <TarifasPage />
    </ProtectedShell>
  ),
});

interface Tarifa {
  id: number;
  nombre: string;
  tipo_cobro: any;
  valor: number;
  activo: boolean;
  tipo_vehiculo_id: number;
  tipos_vehiculo: { nombre: string };
}

function TarifasPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    tipo_vehiculo_id: "",
    tipo_cobro: "POR_MINUTO",
    valor: "",
  });

  const load = async () => {
    const [{ data: t }, { data: tv }] = await Promise.all([
      supabase.from("tarifas").select("*, tipos_vehiculo(nombre)").order("id", { ascending: false }),
      supabase.from("tipos_vehiculo").select("*").order("id"),
    ]);
    setTarifas((t as any) ?? []);
    setTipos(tv ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActivo = async (t: Tarifa) => {
    await supabase.from("tarifas").update({ activo: !t.activo }).eq("id", t.id);
    toast.success(`Tarifa ${!t.activo ? "activada" : "desactivada"}`);
    load();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo_vehiculo_id || !form.valor) {
      toast.error("Completa todos los campos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("tarifas").insert({
      nombre: form.nombre,
      tipo_vehiculo_id: Number(form.tipo_vehiculo_id),
      tipo_cobro: form.tipo_cobro as any,
      valor: Number(form.valor),
    });
    setLoading(false);
    if (error) {
      toast.error("Error al crear tarifa", { description: error.message });
    } else {
      toast.success("Tarifa creada");
      setOpen(false);
      setForm({ nombre: "", tipo_vehiculo_id: "", tipo_cobro: "POR_MINUTO", valor: "" });
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" /> Tarifas
          </h1>
          <p className="text-muted-foreground">Configura los precios por tipo de vehículo.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva tarifa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <Label>Tipo de vehículo</Label>
                <Select value={form.tipo_vehiculo_id} onValueChange={(v) => setForm({ ...form, tipo_vehiculo_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)} className="capitalize">{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de cobro</Label>
                <Select value={form.tipo_cobro} onValueChange={(v) => setForm({ ...form, tipo_cobro: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POR_MINUTO">Por minuto</SelectItem>
                    <SelectItem value="POR_HORA">Por hora</SelectItem>
                    <SelectItem value="POR_DIA">Por día</SelectItem>
                    <SelectItem value="FRACCION">Fracción 15 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (COP)</Label>
                <Input type="number" min={0} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarifas.map((t) => (
          <Card key={t.id} className={`p-5 shadow-card ${!t.activo ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground capitalize">
                  {t.tipos_vehiculo.nombre}
                </div>
                <div className="font-semibold">{t.nombre}</div>
              </div>
              <Switch checked={t.activo} onCheckedChange={() => toggleActivo(t)} />
            </div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(Number(t.valor))}</div>
            <div className="text-xs text-muted-foreground">{tipoCobroLabel(t.tipo_cobro)}</div>
          </Card>
        ))}
        {tarifas.length === 0 && (
          <Card className="p-10 col-span-full text-center text-muted-foreground">Aún no hay tarifas.</Card>
        )}
      </div>
    </div>
  );
}
