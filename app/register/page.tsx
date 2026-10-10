import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthForm } from "@/components/forms";
export default async function Register(){if(await currentUser())redirect("/dashboard");return <main className="auth-page"><div className="auth-brand"><Link className="brand" href="/"><span className="brand-mark">✳</span>Humanity Grid</Link></div><div className="form-shell"><div style={{textAlign:"center",marginBottom:20}}><div className="eyebrow">Join the network</div><h1 style={{fontSize:32}}>Make your next step count</h1><p>Create an account to save initiatives and coordinate contributions.</p></div><AuthForm mode="register"/><p style={{textAlign:"center",fontSize:12,marginTop:17}}>Already have an account? <Link className="text-link" href="/login">Sign in</Link></p></div></main>}
