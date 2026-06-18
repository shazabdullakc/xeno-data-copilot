import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Co-pilot — onboarding-ready in seconds",
  description:
    "Drop a messy transaction CSV. It auto-detects formats, explains what's wrong in plain English, fixes what it safely can, and hands back a clean, chunked file — entirely in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
