// Helpers compartidos para cálculo de tarifas y formato

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDuration(minutes: number): string {
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(" ");
}

export interface TarifaCalc {
  tipo_cobro: "POR_MINUTO" | "POR_HORA" | "POR_DIA" | "FRACCION";
  valor: number;
}

/**
 * Calcula el valor a pagar según tipo de cobro y minutos transcurridos.
 * - POR_MINUTO: valor * minutos
 * - POR_HORA: valor * horas (con fracción)
 * - POR_DIA: valor * días (con fracción de día)
 * - FRACCION: cobra cada fracción de 15 min iniciada
 */
export function calcularValor(tarifa: TarifaCalc, minutos: number): number {
  if (minutos <= 0) return 0;
  switch (tarifa.tipo_cobro) {
    case "POR_MINUTO":
      return Math.round(minutos * tarifa.valor);
    case "POR_HORA":
      return Math.round((minutos / 60) * tarifa.valor);
    case "POR_DIA":
      return Math.round((minutos / (60 * 24)) * tarifa.valor);
    case "FRACCION":
      return Math.round(Math.ceil(minutos / 15) * tarifa.valor);
    default:
      return 0;
  }
}

export function tipoCobroLabel(t: TarifaCalc["tipo_cobro"]): string {
  switch (t) {
    case "POR_MINUTO":
      return "Por minuto";
    case "POR_HORA":
      return "Por hora";
    case "POR_DIA":
      return "Por día";
    case "FRACCION":
      return "Fracción 15 min";
  }
}
