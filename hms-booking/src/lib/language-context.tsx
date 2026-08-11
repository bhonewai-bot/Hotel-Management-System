import { createContext, useContext, useState, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { Language, t } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: Parameters<typeof t>[1]) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANGUAGE_KEY = "hmsbooking_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = SecureStore.getItem(LANGUAGE_KEY);
    return (stored === "mm" ? "mm" : "en") as Language;
  });

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    SecureStore.setItem(LANGUAGE_KEY, lang);
  }

  function translate(key: Parameters<typeof t>[1]): string {
    return t(language, key);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
