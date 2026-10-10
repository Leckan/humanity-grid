import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueSession, rateLimited, verifyPassword } from "@/lib/auth";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return NextResponse.json({error:"Enter your email and password."},{status:400});}
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"",password=typeof body.password==="string"?body.password:"";
  const key=`login:${ip}:${email}`;
  if(rateLimited(key,8))return NextResponse.json({error:"Too many attempts. Try again later."},{status:429});
  const user=db().prepare("SELECT id,name,email,role,created_at,password_hash FROM users WHERE email=?").get(email) as ({id:string;name:string;email:string;role:string;created_at:string;password_hash:string}|undefined);
  if(!user||!verifyPassword(password,user.password_hash))return NextResponse.json({error:"Email or password did not match."},{status:401});
  const response=NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role}});
  issueSession(response,user);return response;
}
