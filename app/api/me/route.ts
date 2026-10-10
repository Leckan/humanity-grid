import { NextRequest,NextResponse } from "next/server";
import { requestUser } from "@/lib/auth";
export async function GET(request:NextRequest){const user=requestUser(request);return user?NextResponse.json({user}):NextResponse.json({user:null},{status:401});}
