import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — ParkControl" },
      { name: "description", content: "Acceso al sistema de control de parqueadero." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup form
  const [sNombre, setSNombre] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");

  if (user) {
    navigate({ to: "/dashboard" });
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("Credenciales inválidas", { description: error.message });
    } else {
      toast.success("Bienvenido");
      navigate({ to: "/dashboard" });
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (sPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await signUp(sEmail, sPassword, sNombre);
    setLoading(false);
    if (error) {
      toast.error("No se pudo crear la cuenta", { description: error.message });
    } else {
      toast.success("Cuenta creada", { description: "Ya puedes iniciar sesión." });
      setEmail(sEmail);
      setPassword(sPassword);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white_0,transparent_50%)]" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md mb-3 shadow-glow">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ParkControl</h1>
          <p className="text-sm text-white/80 mt-1">
            Sistema de control de parqueadero
          </p>
        </div>

        <Card className="p-6 shadow-elegant">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="sNombre">Nombre completo</Label>
                  <Input
                    id="sNombre"
                    value={sNombre}
                    onChange={(e) => setSNombre(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="sEmail">Email</Label>
                  <Input
                    id="sEmail"
                    type="email"
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sPassword">Contraseña (mín. 6)</Label>
                  <Input
                    id="sPassword"
                    type="password"
                    value={sPassword}
                    onChange={(e) => setSPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Las nuevas cuentas se crean con rol <strong>Operario</strong>. Un administrador puede cambiar el rol después.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-white/70 mt-6">
          Proyecto SENA — Tecnología en Análisis y Desarrollo de Software
        </p>
      </div>
      <WhatsAppFloat />
    </div>
  );
}
