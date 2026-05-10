import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  const number = "15550100199";
  const msg = encodeURIComponent("Hi Firmus Formation, I'd like to know more about your Amazon FBA services.");
  return (
    <a
      href={`https://wa.me/${number}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[oklch(0.72_0.17_150)] px-5 py-3 text-sm font-semibold text-[oklch(0.15_0.02_150)] shadow-elegant transition-transform hover:scale-105"
    >
      <MessageCircle size={18} />
      WhatsApp
    </a>
  );
}
