import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "573000000000"; // Reemplazar con número real
const MENSAJE = "Hola, tengo una consulta sobre el parqueadero.";

export function WhatsAppFloat() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MENSAJE)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Soporte por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.7_0.18_150)] text-white shadow-elegant transition hover:scale-110 hover:shadow-glow"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
