import { Geist, Geist_Mono, Poppins, Montserrat } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const montserrat_bold = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: '800'
});

export const montserrat_regular = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: '400'
});

export const poppins = Poppins({
  weight: '100',
  variable: "--font-poppins",
  subsets: ["latin"],
});
