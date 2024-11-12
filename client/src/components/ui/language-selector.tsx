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

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <Select value={i18n.language} onValueChange={i18n.changeLanguage}>
      <SelectTrigger className="w-[130px] neon-focus">
        <Globe className="mr-2 h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
