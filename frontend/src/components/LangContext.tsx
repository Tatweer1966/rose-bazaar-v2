"use client";
import { createContext, useContext, useState } from "react";

type Lang = "en" | "ar";
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; toggle: () => void }>({ lang: "en", setLang: () => {}, toggle: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const toggle = () => setLang(l => l === "en" ? "ar" : "en");
  return <LangContext.Provider value={{ lang, setLang, toggle }}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }
