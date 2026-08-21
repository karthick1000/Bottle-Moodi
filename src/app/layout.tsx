import type { Metadata } from "next";
import { Bakbak_One, Kaushan_Script, Inter_Tight, Anek_Tamil } from "next/font/google";
import "./globals.css";

const bakbak = Bakbak_One({ weight: "400", subsets: ["latin"], variable: "--font-bakbak", display: "swap" });
const kaushan = Kaushan_Script({ weight: "400", subsets: ["latin"], variable: "--font-kaushan", display: "swap" });
const inter = Inter_Tight({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-inter", display: "swap" });
const anek = Anek_Tamil({ weight: ["500", "700"], subsets: ["tamil"], variable: "--font-anek", display: "swap" });

export const metadata: Metadata = {
  title: "Bottlemoodi — Mood-க்கு ஏத்த Design",
  description: "Tamil posters printed on 250gsm matte, shipped from Chennai.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta-IN">
      <body className={`${bakbak.variable} ${kaushan.variable} ${inter.variable} ${anek.variable} font-inter`}>
        {children}
      </body>
    </html>
  );
}
