"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [["Discover","/discover"],["Causes","/causes"],["Initiatives","/initiatives"],["Volunteer","/discover?type=volunteer"],["Organizations","/organizations"],["How it works","/how-it-works"],["About","/about"]];
const appName=process.env.NEXT_PUBLIC_APP_NAME?.trim()||"Humanity Grid";

export function SiteNav(){
  const [open,setOpen]=useState(false),[user,setUser]=useState<{name:string}|null>(null);
  useEffect(()=>{fetch("/api/me").then(r=>r.ok?r.json():null).then(d=>d?.user&&setUser(d.user)).catch(()=>{});},[]);
  return <header className="navbar"><div className="container nav-inner"><Link className="brand" href="/"><span className="brand-mark">✳</span>{appName}</Link><nav className="nav-links" aria-label="Primary">{links.map(([t,h])=><Link key={h} href={h}>{t}</Link>)}</nav><div className="nav-actions">{user?<Link className="btn secondary small" href="/dashboard">{user.name.split(" ")[0]} · Dashboard</Link>:<Link className="btn secondary small" href="/login">Sign in</Link>}<Link className="btn small" href="/initiatives/create">Start an initiative <span>↗</span></Link><button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>☰</button></div>{open&&<nav className="mobile-menu" aria-label="Mobile">{links.map(([t,h])=><Link key={h} href={h} onClick={()=>setOpen(false)}>{t}</Link>)}<Link href="/request-assistance" onClick={()=>setOpen(false)}>Request assistance</Link><Link href={user?"/dashboard":"/login"} onClick={()=>setOpen(false)}>{user?"Your dashboard":"Sign in"}</Link></nav>}</div></header>
}

export function SiteFooter(){return <footer className="footer"><div className="container"><div className="footer-grid"><div><Link className="brand" href="/"><span className="brand-mark">✳</span>{appName}</Link><p>Connect resources with community needs. Make every contribution count toward a better future.</p></div><div><h4>Explore</h4><div className="footer-links"><Link href="/discover">Discover opportunities</Link><Link href="/causes">Browse causes</Link><Link href="/organizations">Organizations</Link><Link href="/how-it-works">How it works</Link></div></div><div><h4>Take part</h4><div className="footer-links"><Link href="/initiatives/create">Start an initiative</Link><Link href="/request-assistance">Request assistance</Link><Link href="/login">Join the network</Link></div></div><div><h4>Trust & safety</h4><div className="footer-links"><Link href="/how-it-works#review">How review works</Link><Link href="/privacy">Privacy approach</Link><Link href="/terms">Platform terms</Link></div></div></div><div className="footer-bottom"><span>© 2026 {appName} · {process.env.NEXT_PUBLIC_APP_TAGLINE||"Connect Resources. Empower Humanity."}</span><span>Built for people, powered by community.</span></div></div></footer>}
