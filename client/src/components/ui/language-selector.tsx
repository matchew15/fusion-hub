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
];

export const LanguageSelector = React.memo(function LanguageSelector() {
  const { i18n } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <Select value={i18n.language} onValueChange={i18n.changeLanguage}>
      <SelectTrigger className={cn(
        "neon-focus", 
        isMobile ? "w-[90px]" : "w-[130px]"
      )}>
        <Globe className="h-4 w-4" />
        <SelectValue className="ml-2" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {isMobile ? lang.code.toUpperCase() : lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
