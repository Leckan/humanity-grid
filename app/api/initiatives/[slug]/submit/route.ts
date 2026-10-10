import { NextRequest,NextResponse } from "next/server";
import { requestUser } from "@/lib/auth";
import { db,audit } from "@/lib/db";
import { canTransitionInitiative } from "@/lib/domain";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const user=requestUser(request);if(!user)return NextResponse.json({error:"Sign in to submit your initiative."},{status:401});
  const {slug}=await params;const d=db(),item=d.prepare("SELECT id,status,organizer_id FROM initiatives WHERE slug=?").get(slug) as {id:string;status:string;organizer_id:string|null}|undefined;
  if(!item||item.organizer_id!==user.id)return NextResponse.json({error:"You don't have access to submit this initiative."},{status:403});
  if(!canTransitionInitiative(item.status,"submitted"))return NextResponse.json({error:"Only a draft or returned initiative can be submitted."},{status:409});
  d.prepare("UPDATE initiatives SET status='submitted',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(item.id);audit(user.id,"initiative.submitted","initiative",item.id);return NextResponse.json({status:"submitted"});
}
