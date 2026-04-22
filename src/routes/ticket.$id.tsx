import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Printer, ArrowLeft, Car } from "lucide-react";
import { formatCurrency, formatDate, formatDuration } from "@/lib/parking";

export const Route = createFileRoute("/ticket/$id")({
  head: () => ({ meta: [{ title: "Ticket — ParkControl" }] }),
  component: () => (
    <ProtectedShell>
      <TicketPage />
    </ProtectedShell>
  ),
});

function TicketPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("*, registros(*, espacios(codigo), tipos_vehiculo(nombre))")
        .eq("id", Number(id))
        .maybeSingle();
      setData(ticket);
    };
    load();
  }, [id]);

  if (!data) {
    return <div className="text-center py-10 text-muted-foreground">Cargando ticket...</div>;
  }

  const r = data.registros;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Inicio
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Imprimir
        </Button>
      </div>

      <Card className="p-6 shadow-elegant bg-gradient-card relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-primary opacity-10" />

        <div className="text-center pb-4 border-b border-dashed relative">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant mb-2">
            <Car className="h-6 w-6" />
          </div>
          <h1 className="font-bold text-lg">ParkControl</h1>
          <p className="text-xs text-muted-foreground">Comprobante de servicio</p>
        </div>

        <div className="py-4 space-y-3 text-sm">
          <Row label="Ticket" value={data.codigo_ticket} mono />
          <Row label="Placa" value={r.placa} mono bold />
          <Row label="Tipo" value={r.tipos_vehiculo.nombre} />
          <Row label="Espacio" value={r.espacios.codigo} mono />
          <Row label="Entrada" value={formatDate(r.fecha_hora_entrada)} />
          <Row label="Salida" value={formatDate(r.fecha_hora_salida)} />
          <Row label="Tiempo" value={formatDuration(r.minutos_totales ?? 0)} />
          {Number(r.descuento) > 0 && (
            <Row label="Descuento" value={`- ${formatCurrency(Number(r.descuento))}`} />
          )}
        </div>

        <div className="border-t border-dashed pt-4 flex items-end justify-between">
          <span className="text-sm text-muted-foreground">TOTAL</span>
          <span className="text-3xl font-bold text-primary">
            {formatCurrency(Number(r.valor_calculado ?? 0))}
          </span>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Emitido {formatDate(data.fecha_emision)} · Gracias por su preferencia
        </p>
      </Card>

      <div className="print:hidden flex gap-2">
        <Link to="/entrada" className="flex-1">
          <Button variant="outline" className="w-full">Nueva entrada</Button>
        </Link>
        <Link to="/salida" className="flex-1">
          <Button className="w-full">Nueva salida</Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
      <span className={`text-right ${mono ? "font-mono" : ""} ${bold ? "font-bold text-base" : ""}`}>{value}</span>
    </div>
  );
}
