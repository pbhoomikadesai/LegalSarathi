import type { Metadata } from "next";
import { LangProvider } from "@/context/LangContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal Sarathi — कानूनी साथी | Your Legal Buddy",
  description: "Free multilingual legal help for every Indian citizen. Know your rights in Hindi, Tamil, Telugu, Marathi, Bengali and more.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Noto Sans', 'Noto Sans Devanagari', 'Inter', sans-serif", margin: 0 }}>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
