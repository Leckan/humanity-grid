import { NextResponse } from "next/server";
import { expireSession } from "@/lib/auth";
export async function POST(){const response=NextResponse.json({ok:true});expireSession(response);return response;}
