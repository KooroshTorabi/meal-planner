import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import KeyboardNavigation from "@/components/KeyboardNavigation";
import SkipLink from "@/components/SkipLink";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meal Planner System",
  description: "Digital meal planning and ordering system for elderly care homes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip to main content link for keyboard navigation */}
        <SkipLink />
        
        {/* Keyboard navigation shortcuts */}
        <KeyboardNavigation />
        
        {/* Theme Toggle - Fixed position in top right */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        {/* Keyboard Shortcuts Help - Fixed position in bottom right */}
        <KeyboardShortcutsHelp />
        
        {/* Main content wrapper with id for skip link */}
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
