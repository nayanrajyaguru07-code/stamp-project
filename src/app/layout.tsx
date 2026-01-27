import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "CS Stamp - #1 Online Digital Stamp & Seal Generator",
  description: "Create professional digital stamps, round seals, and business chops in seconds. The most advanced online stamp maker for CA firms, lawyers, and businesses. Download transparent (PNG) and vector (SVG) stamps instantly.",
  keywords: [
    "online stamp maker",
    "digital stamp generator",
    "round seal creator",
    "business stamp maker",
    "electronic signature stamp",
    "rubber stamp generator",
    "free stamp maker",
    "professional stamp design",
    "company seal generator",
    "CA stamp maker",
    "lawyer stamp creator"
  ],
  openGraph: {
    title: "CS Stamp - Create Professional Digital Stamps Online",
    description: "The #1 tool to design and download custom business stamps, seals, and signatures. Try it for free!",
    url: "https://cs-stamp.com", 
    siteName: "CS Stamp",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "CS Stamp Generator Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CS Stamp - Digital Stamp Generator",
    description: "Create unmatched professional stamps in seconds.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // --- FIX: Use the imported objects directly ---
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased flex flex-col min-h-screen`}
        // --- END FIX ---
      >
        <Toaster />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
