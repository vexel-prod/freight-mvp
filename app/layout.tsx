import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freight MVP",
  description: "MVP внутренней системы подбора грузов для транспортной компании",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
