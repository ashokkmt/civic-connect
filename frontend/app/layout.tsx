import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LocationProvider } from "@/lib/location/context";
import { AuthSessionProvider } from "@/lib/auth/session-context";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
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
        className={`${inter.variable} ${jetBrainsMono.variable} min-h-screen bg-[var(--background)] antialiased`}
      >
        <LocationProvider>
          <ThemeProvider>
            <AuthSessionProvider>
              <PublicNavbar />
              {children}
              <Footer />
            </AuthSessionProvider>
          </ThemeProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
