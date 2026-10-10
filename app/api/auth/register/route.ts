import { NextRequest, NextResponse } from "next/server";
import { db, newId, audit } from "@/lib/db";
import { hashPassword, issueSession, rateLimited } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  if(rateLimited(`register:${ip}`,5)) return NextResponse.json({error:"Too many attempts. Try again later."},{status:429});
  try {
    const body=await request.json() as Record<string,unknown>;
    const name=typeof body.name==="string"?body.name.trim():"";
    const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
    const password=typeof body.password==="string"?body.password:"";
    const role=body.role==="organizer"?"organizer":"contributor";
    if(name.length<2||name.length>80||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||password.length<10||password.length>200)
      return NextResponse.json({error:"Enter a name, a valid email, and a password with at least 10 characters."},{status:400});
    const id=newId();
    try { db().prepare("INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)").run(id,name,email,hashPassword(password),role); }
    catch { return NextResponse.json({error:"An account with this email may already exist."},{status:409}); }
    audit(id,"account.created","user",id,`role=${role}`);
    const response=NextResponse.json({user:{id,name,email,role}}, {status:201});
    issueSession(response,{id,email,role});
    return response;
  } catch { return NextResponse.json({error:"We couldn't create the account. Please try again."},{status:400}); }
}
