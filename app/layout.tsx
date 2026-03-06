import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, IBM_Plex_Serif as IBM_Plex_Serif_Font, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({subsets: ["latin"],variable: '--font-inter'})

const ibmPlexSerif = IBM_Plex_Serif_Font({
  subsets:['latin'],
  weight: ['400','700'],
  variable: '--font-ibm-plex-seriff'
})
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Horizon",
  description: "Modern banking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${ibmPlexSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
