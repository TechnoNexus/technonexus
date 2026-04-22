import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar";
import BottomTabNav from "../components/navbar/BottomTabNav";
import Footer from "../components/Footer";
import SpatialBackground from "../components/SpatialBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TechnoNexus | AI Ecosystem & IT Consulting",
  description: "High-performance digital ecosystem for enterprise automation and indie gaming.",
  icons: {
    icon: '/logo.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-[#0A0A0A] relative">
        <SpatialBackground />
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          <Navbar />
          <main className="flex-grow pb-20 md:pb-0">{children}</main>
          <BottomTabNav />
          <Footer />
        </div>
      </body>
    </html>
  );
}
