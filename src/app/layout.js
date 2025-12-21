import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pod Shop",
  description: "Build your hedge fund empire",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Optional: Prevents users from pinching to zoom (app-like feel)
  userScalable: false, // Optional: associated with the above
  // themeColor: 'black', // Optional: matches the status bar to your app
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true} 
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
