import { NextRequest,NextResponse } from "next/server";
import { requestUser } from "@/lib/auth";
import { db,audit } from "@/lib/db";
import { canReview,canTransitionInitiative } from "@/lib/domain";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const user=requestUser(request);if(!user||!canReview(user.role))return NextResponse.json({error:"You aren't authorized to review initiatives."},{status:403});
  let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Check the action."},{status:400});}
  const status=b.status==="approved"?"approved":b.status==="changes_requested"?"changes_requested":"";
  const note=typeof b.note==="string"?b.note.trim():"";if(!status||note.length<8||note.length>700)return NextResponse.json({error:"Choose an action and add a concise reviewer note."},{status:400});
  const {slug}=await params;const d=db(),row=d.prepare("SELECT id,status FROM initiatives WHERE slug=?").get(slug) as {id:string;status:string}|undefined;
  if(!row||row.status!=="submitted"||!canTransitionInitiative(row.status,status))return NextResponse.json({error:"This initiative is not awaiting review."},{status:409});
  d.prepare("UPDATE initiatives SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status,row.id);audit(user.id,`initiative.${status}`,"initiative",row.id,note);return NextResponse.json({id:row.id,status});
}
