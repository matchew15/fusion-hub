import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "zh", name: "中文" },
  { code: "hi", name: "हिंदी" },
  { code: "ar", name: "العربية" },
  { code: "pt", name: "Português" },
  { code: "bn", name: "বাংলা" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "fr", name: "Français" }
];

export const LanguageSelector = React.memo(function LanguageSelector() {
  const { i18n } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <Select value={i18n.language} onValueChange={i18n.changeLanguage}>
      <SelectTrigger 
        className={cn(
          "neon-focus transition-all", 
          isMobile ? "w-[100px] text-sm" : "w-[150px]"
        )}
      >
        <Globe className="h-4 w-4" />
        <SelectValue className="ml-2" />
      </SelectTrigger>
      <SelectContent 
        className="max-h-[300px] overflow-y-auto cyber-panel"
        position={isMobile ? "popper" : "item-aligned"}
      >
        {languages.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            className="cyber-text"
          >
            <span className="flex items-center gap-2">
              {isMobile ? (
                <span className="uppercase">{lang.code}</span>
              ) : (
                <>
                  <span className="w-8 uppercase text-xs opacity-70">{lang.code}</span>
                  <span>{lang.name}</span>
                </>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
