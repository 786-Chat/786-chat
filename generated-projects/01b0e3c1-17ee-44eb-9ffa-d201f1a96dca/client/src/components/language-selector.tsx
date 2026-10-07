import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "zh-CN", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
];

declare global {
  interface Window {
    changeLanguage: (langCode: string) => void;
  }
}

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>(LANGUAGES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const path = window.location.pathname;
      setVisible(path.startsWith("/grocery/") || path.startsWith("/grocery-"));
    };
    checkVisibility();
    window.addEventListener("popstate", checkVisibility);
    const interval2 = setInterval(checkVisibility, 500);
    return () => { window.removeEventListener("popstate", checkVisibility); clearInterval(interval2); };
  }, []);

  useEffect(() => {
    const checkCurrentLang = () => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select && select.value) {
        const lang = LANGUAGES.find(l => l.code === select.value);
        if (lang) setCurrentLang(lang);
      }
    };
    
    const interval = setInterval(checkCurrentLang, 1000);
    checkCurrentLang();
    
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    setIsOpen(false);

    if (window.changeLanguage) {
      window.changeLanguage(lang.code);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] print:hidden" data-testid="language-selector">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-600 hover:bg-slate-700 hover:border-cyan-500/50"
            data-testid="button-language-toggle"
          >
            <Globe className="h-5 w-5 text-cyan-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          side="top"
          className="w-52 max-h-80 overflow-y-auto bg-slate-800 border border-slate-600 shadow-xl z-[10000]"
          data-testid="language-dropdown"
        >
          <div className="px-3 py-2 border-b border-slate-600">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Select Language</span>
          </div>
          {LANGUAGES.map((lang, index) => (
            <DropdownMenuItem
              key={`${lang.code}-${index}`}
              onClick={() => handleLanguageChange(lang)}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-700 ${
                currentLang.code === lang.code && currentLang.flag === lang.flag ? "bg-cyan-900/50 text-cyan-300" : "text-slate-200"
              }`}
              data-testid={`language-option-${lang.code}-${index}`}
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{lang.nativeName}</span>
                <span className="text-xs text-slate-400">{lang.name}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
