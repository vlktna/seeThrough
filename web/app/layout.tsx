import type { Metadata } from "next";
import "./globals.css";
import { RevealObserver, SkipLink } from "./ui";

export const metadata: Metadata = {
  metadataBase: new URL("https://seethrough-live.v-volokitinaa.chatgpt.site"),
  title: "See/Through — Indoor mapping for robots",
  description: "Collect confirmed rooms, coordinates, and motion data in a live dashboard designed as a foundation for robot navigation.",
  openGraph: { title: "See/Through — Map spaces for robots", description: "Indoor mapping for robots, with data contributed through phones.", images: [{ url: "/social-preview-robots.png", width: 1200, height: 630 }] },
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
