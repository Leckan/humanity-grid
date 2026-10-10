import { NextRequest,NextResponse } from "next/server";
import { requestUser,rateLimited } from "@/lib/auth";
import { db,audit } from "@/lib/db";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const user=requestUser(request);if(!user)return NextResponse.json({error:"Sign in to save initiatives."},{status:401});
  if(rateLimited(`saved-initiative:${user.id}`,60))return NextResponse.json({error:"Please wait a moment before changing more saved initiatives."},{status:429});
  const {slug}=await params;const d=db(),item=d.prepare("SELECT id FROM initiatives WHERE slug=? AND status='approved'").get(slug) as {id:string}|undefined;
  if(!item)return NextResponse.json({error:"This initiative isn't available."},{status:404});
  const saved=d.prepare("SELECT 1 AS yes FROM saved_initiatives WHERE user_id=? AND initiative_id=?").get(user.id,item.id);
  if(saved){d.prepare("DELETE FROM saved_initiatives WHERE user_id=? AND initiative_id=?").run(user.id,item.id);audit(user.id,"initiative.unsaved","initiative",item.id);return NextResponse.json({saved:false});}
  d.prepare("INSERT INTO saved_initiatives (user_id,initiative_id) VALUES (?,?)").run(user.id,item.id);audit(user.id,"initiative.saved","initiative",item.id);return NextResponse.json({saved:true});
}
export async function GET(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const user=requestUser(request);if(!user)return NextResponse.json({saved:false},{status:401});
  const {slug}=await params;const item=db().prepare("SELECT id FROM initiatives WHERE slug=? AND status='approved'").get(slug) as {id:string}|undefined;
  if(!item)return NextResponse.json({saved:false},{status:404});
  const saved=Boolean(db().prepare("SELECT 1 AS yes FROM saved_initiatives WHERE user_id=? AND initiative_id=?").get(user.id,item.id));
  return NextResponse.json({saved});
}
