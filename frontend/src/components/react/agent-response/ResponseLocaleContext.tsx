import { createContext, useContext } from "react";
import type { Locale } from "@/i18n/types";

export const ResponseLocaleContext = createContext<Locale>("es");

export function useResponseLocale(): Locale {
  return useContext(ResponseLocaleContext);
}
