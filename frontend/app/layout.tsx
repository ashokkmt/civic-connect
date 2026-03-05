import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { LocationProvider } from "@/lib/location/context";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivicConnect",
  description: "Civic issue reporting and resolution platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${jetBrainsMono.variable} min-h-screen bg-[var(--background)] antialiased`}
      >
        <ThemeProvider>
          <LocationProvider>{children}</LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
