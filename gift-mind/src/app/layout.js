import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GiftMind — Know what to gift",
  description:
    "AI-powered gift direction for meaningful gifting — dark, warm, built for India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-md-surface text-md-on-surface`}>
        {children}
      </body>
    </html>
  );
}
