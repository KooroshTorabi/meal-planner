import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const root = document.documentElement;
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'light') {
                    root.classList.add('light');
                  } else {
                    // System preference
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      root.classList.add('dark');
                    } else {
                      root.classList.add('light');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip to main content link for keyboard navigation */}
        <SkipLink />
        
        {/* Keyboard navigation shortcuts */}
        <KeyboardNavigation />
        
        {/* Header with user info and theme toggle */}
        <Header />
        
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
