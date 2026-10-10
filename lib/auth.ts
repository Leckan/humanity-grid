import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { db, type User } from "@/lib/db";

const cookieName = "hg_session";
const week = 60 * 60 * 24 * 7;
function secret() {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32 || value.includes("replace-with"))) throw new Error("Set SESSION_SECRET to a random value of at least 32 characters in production.");
  return value || "local-development-only-humanity-grid-session-secret";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, "hex");
  return target.length === actual.length && timingSafeEqual(target, actual);
}
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function sessionToken(user: Pick<User,"id"|"email"|"role">) {
  const payload = Buffer.from(JSON.stringify({ sub:user.id, email:user.email, role:user.role, exp:Math.floor(Date.now()/1000)+week })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function sessionUser(token?: string): User | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload)); const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected,supplied)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as {sub:string;exp:number};
    if (!value.sub || value.exp < Math.floor(Date.now()/1000)) return null;
    return db().prepare("SELECT id,name,email,role,created_at FROM users WHERE id=?").get(value.sub) as User|null;
  } catch { return null; }
}
export async function currentUser() { return sessionUser((await cookies()).get(cookieName)?.value); }
export function requestUser(request: NextRequest) { return sessionUser(request.cookies.get(cookieName)?.value); }
export function issueSession(response: NextResponse, user: Pick<User,"id"|"email"|"role">) {
  response.cookies.set(cookieName,sessionToken(user),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:week});
}
export function expireSession(response: NextResponse) { response.cookies.set(cookieName,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0}); }

const attempts = new Map<string,{count:number;start:number}>();
export function rateLimited(key: string, max = 8, windowMs = 10*60*1000) {
  const now=Date.now(), prior=attempts.get(key);
  if (!prior || now-prior.start>windowMs) { attempts.set(key,{count:1,start:now}); return false; }
  prior.count++; return prior.count>max;
}
