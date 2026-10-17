import type { Metadata } from "next";
import "./globals.css";
import { RevealObserver, SkipLink } from "./ui";

export const metadata: Metadata = {
  metadataBase: new URL("https://seethrough-live.v-volokitinaa.chatgpt.site"),
  title: "See/Through — Live floor plan",
  description: "Connect a phone. See people, room updates, walked paths and sensor readings in one shared view.",
  openGraph: { title: "See/Through — Find your people", description: "Connect a phone and see your people on one shared floor plan.", images: [{ url: "/social-preview.png", width: 1200, height: 630 }] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><SkipLink />{children}<RevealObserver /></body>
    </html>
  );
}
