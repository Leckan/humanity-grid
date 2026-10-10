import type { Metadata } from "next";
import "./globals.css";
import { SiteNav, SiteFooter } from "@/components/chrome";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: "Find meaningful ways to contribute money, skills, time, and resources to community initiatives.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body style={{"--green":brand.color} as React.CSSProperties}><div className="topbar"><div className="container topbar-inner"><span><b>{brand.tagline}</b> Find a practical way to help today.</span><span>🌍 &nbsp;A community-powered platform</span></div></div><SiteNav />{children}<SiteFooter /></body></html>;
}
