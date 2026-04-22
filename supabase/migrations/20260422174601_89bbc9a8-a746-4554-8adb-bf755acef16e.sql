-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('admin', 'operario');
CREATE TYPE public.tipo_cobro AS ENUM ('POR_MINUTO', 'POR_HORA', 'POR_DIA', 'FRACCION');
CREATE TYPE public.estado_registro AS ENUM ('EN_CURSO', 'FINALIZADO');

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============== USER_ROLES ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============== TIPOS_VEHICULO ==============
CREATE TABLE public.tipos_vehiculo (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);
ALTER TABLE public.tipos_vehiculo ENABLE ROW LEVEL SECURITY;

-- ============== ESPACIOS ==============
CREATE TABLE public.espacios (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  tipo_vehiculo_id INT NOT NULL REFERENCES public.tipos_vehiculo(id),
  disponible BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.espacios ENABLE ROW LEVEL SECURITY;

-- ============== TARIFAS ==============
CREATE TABLE public.tarifas (
  id SERIAL PRIMARY KEY,
  tipo_vehiculo_id INT NOT NULL REFERENCES public.tipos_vehiculo(id),
  nombre TEXT NOT NULL,
  tipo_cobro tipo_cobro NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tarifas ENABLE ROW LEVEL SECURITY;

-- ============== REGISTROS ==============
CREATE TABLE public.registros (
  id SERIAL PRIMARY KEY,
  placa TEXT NOT NULL,
  tipo_vehiculo_id INT NOT NULL REFERENCES public.tipos_vehiculo(id),
  espacio_id INT NOT NULL REFERENCES public.espacios(id),
  fecha_hora_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_hora_salida TIMESTAMPTZ,
  minutos_totales INT,
  tarifa_id INT REFERENCES public.tarifas(id),
  valor_calculado NUMERIC(10,2),
  descuento NUMERIC(10,2) DEFAULT 0,
  estado estado_registro NOT NULL DEFAULT 'EN_CURSO',
  usuario_entrada_id UUID NOT NULL REFERENCES auth.users(id),
  usuario_salida_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_registros_estado ON public.registros(estado);
CREATE INDEX idx_registros_placa ON public.registros(placa);

-- ============== TICKETS ==============
CREATE TABLE public.tickets (
  id SERIAL PRIMARY KEY,
  registro_id INT NOT NULL REFERENCES public.registros(id) ON DELETE CASCADE,
  codigo_ticket TEXT NOT NULL UNIQUE,
  email_cliente TEXT,
  enviado_email BOOLEAN NOT NULL DEFAULT false,
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ============== TRIGGER: auto-create profile + default role ==============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- default role: operario
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operario');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== RLS POLICIES ==============

-- profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- tipos_vehiculo: lectura todos autenticados
CREATE POLICY "Authenticated can view tipos"
  ON public.tipos_vehiculo FOR SELECT TO authenticated USING (true);

-- espacios
CREATE POLICY "Authenticated can view espacios"
  ON public.espacios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update espacios"
  ON public.espacios FOR UPDATE TO authenticated USING (true);

-- tarifas
CREATE POLICY "Authenticated can view tarifas"
  ON public.tarifas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert tarifas"
  ON public.tarifas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tarifas"
  ON public.tarifas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tarifas"
  ON public.tarifas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- registros
CREATE POLICY "Authenticated can view registros"
  ON public.registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert registros"
  ON public.registros FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_entrada_id);
CREATE POLICY "Authenticated can update registros"
  ON public.registros FOR UPDATE TO authenticated USING (true);

-- tickets
CREATE POLICY "Authenticated can view tickets"
  ON public.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tickets"
  ON public.tickets FOR INSERT TO authenticated WITH CHECK (true);

-- ============== SEED DATA ==============
INSERT INTO public.tipos_vehiculo (nombre, descripcion) VALUES
  ('sedan', 'Automóvil tipo sedán'),
  ('camioneta', 'Camioneta o SUV'),
  ('moto', 'Motocicleta');

-- 15 espacios para autos sedán (A01-A15)
INSERT INTO public.espacios (codigo, tipo_vehiculo_id)
SELECT 'A' || LPAD(g::text, 2, '0'), 1 FROM generate_series(1, 15) g;

-- 15 espacios para camionetas (C01-C15)
INSERT INTO public.espacios (codigo, tipo_vehiculo_id)
SELECT 'C' || LPAD(g::text, 2, '0'), 2 FROM generate_series(1, 15) g;

-- 15 espacios para motos (M01-M15)
INSERT INTO public.espacios (codigo, tipo_vehiculo_id)
SELECT 'M' || LPAD(g::text, 2, '0'), 3 FROM generate_series(1, 15) g;

-- Tarifas iniciales (COP por minuto)
INSERT INTO public.tarifas (tipo_vehiculo_id, nombre, tipo_cobro, valor) VALUES
  (1, 'Tarifa estándar sedán', 'POR_MINUTO', 80),
  (2, 'Tarifa estándar camioneta', 'POR_MINUTO', 100),
  (3, 'Tarifa estándar moto', 'POR_MINUTO', 50);