import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppButton() {
  const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE || "447427070000";
  
  const handleClick = () => {
    const message = "Hello! I would like to inquire about your pest control and food safety services.";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      onClick={handleClick}
      data-testid="button-whatsapp-chat"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center group"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      <span className="sr-only">Chat on WhatsApp</span>
    </Button>
  );
}
