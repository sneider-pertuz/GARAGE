import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, ShieldCheck, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — ParkControl" }] }),
  component: () => (
    <ProtectedShell requireAdmin>
      <UsuariosPage />
    </ProtectedShell>
  ),
});

interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  role: "admin" | "operario" | null;
}

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
    setUsuarios(
      (profiles ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        email: p.email,
        activo: p.activo,
        role: (map.get(p.id) as any) ?? null,
      })),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAdmin = async (u: UsuarioRow) => {
    if (u.role === "admin") {
      // demote: remove admin role, add operario
      await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", u.id)
        .eq("role", "operario")
        .maybeSingle();
      if (!existing) {
        await supabase.from("user_roles").insert({ user_id: u.id, role: "operario" });
      }
      toast.success("Rol cambiado a Operario");
    } else {
      // promote
      await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "operario");
      await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
      toast.success("Rol cambiado a Administrador");
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" /> Usuarios
        </h1>
        <p className="text-muted-foreground">Gestión de roles del sistema.</p>
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="divide-y">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 hover:bg-muted/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-bold shrink-0">
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.nombre}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.role === "admin" ? (
                  <Badge className="bg-primary text-primary-foreground gap-1"><ShieldCheck className="h-3 w-3" />Admin</Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />Operario</Badge>
                )}
                <Button size="sm" variant="outline" onClick={() => toggleAdmin(u)}>
                  {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                </Button>
              </div>
            </div>
          ))}
          {usuarios.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No hay usuarios todavía.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
