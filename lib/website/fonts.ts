import {
  Inter,
  Poppins,
  Roboto,
  Lato,
  Montserrat,
} from "next/font/google";
import type { FonteWebsite } from "@prisma/client";

const inter = Inter({ subsets: ["latin"], variable: "--font-site", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-site",
  display: "swap",
});
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-site",
  display: "swap",
});
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-site",
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-site",
  display: "swap",
});

export const FONTE_LABELS: Record<FonteWebsite, string> = {
  INTER: "Inter",
  POPPINS: "Poppins",
  ROBOTO: "Roboto",
  LATO: "Lato",
  MONTSERRAT: "Montserrat",
};

export function getFontClass(fonte: FonteWebsite): string {
  switch (fonte) {
    case "INTER":
      return inter.variable;
    case "POPPINS":
      return poppins.variable;
    case "ROBOTO":
      return roboto.variable;
    case "LATO":
      return lato.variable;
    case "MONTSERRAT":
      return montserrat.variable;
    default:
      return inter.variable;
  }
}
