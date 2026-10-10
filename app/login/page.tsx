import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthForm } from "@/components/forms";
export default async function Login(){if(await currentUser())redirect("/dashboard");return <main className="auth-page"><div className="auth-brand"><Link className="brand" href="/"><span className="brand-mark">✳</span>Humanity Grid</Link></div><div className="form-shell"><div style={{textAlign:"center",marginBottom:20}}><div className="eyebrow">Welcome back</div><h1 style={{fontSize:32}}>Sign in to your network</h1><p>Continue supporting the initiatives you care about.</p></div><AuthForm mode="login"/><p style={{textAlign:"center",fontSize:12,marginTop:17}}>New to Humanity Grid? <Link className="text-link" href="/register">Create an account</Link></p></div></main>}
