-- Restringir UPDATE de espacios a operario/admin
DROP POLICY "Authenticated can update espacios" ON public.espacios;
CREATE POLICY "Staff can update espacios"
  ON public.espacios FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'operario') OR public.has_role(auth.uid(), 'admin'));

-- Restringir UPDATE de registros
DROP POLICY "Authenticated can update registros" ON public.registros;
CREATE POLICY "Staff can update registros"
  ON public.registros FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'operario') OR public.has_role(auth.uid(), 'admin'));

-- Restringir INSERT de tickets
DROP POLICY "Authenticated can insert tickets" ON public.tickets;
CREATE POLICY "Staff can insert tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'operario') OR public.has_role(auth.uid(), 'admin'));

-- Restringir INSERT registros también (que sea staff)
DROP POLICY "Authenticated can insert registros" ON public.registros;
CREATE POLICY "Staff can insert registros"
  ON public.registros FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = usuario_entrada_id AND
    (public.has_role(auth.uid(), 'operario') OR public.has_role(auth.uid(), 'admin'))
  );