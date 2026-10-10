import { NextRequest,NextResponse } from "next/server";
import { requestUser,rateLimited } from "@/lib/auth";
import { audit,db } from "@/lib/db";
import { canReview } from "@/lib/domain";
const transitions:Record<string,string[]>={submitted:["under_review","more_information","approved","declined"],under_review:["more_information","approved","declined"],more_information:["under_review","approved","declined"],approved:["matched","withdrawn"],matched:["fulfilled","withdrawn"]};
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const user=requestUser(request);if(!user||!canReview(user.role))return NextResponse.json({error:"You aren't authorized to review private requests."},{status:403});
  if(rateLimited(`assistance-review:${user.id}`,60))return NextResponse.json({error:"Please wait before changing more private request records."},{status:429});
  let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
  const status=typeof b.status==="string"?b.status:"";const note=typeof b.note==="string"?b.note.trim():"";
  if(!["under_review","more_information","approved","declined"].includes(status)||note.length<8||note.length>700)return NextResponse.json({error:"Choose a status and add a short private audit note."},{status:400});
  const {id}=await params;const d=db(),row=d.prepare("SELECT id,status FROM assistance_requests WHERE id=?").get(id) as {id:string;status:string}|undefined;
  if(!row||!(transitions[row.status]||[]).includes(status))return NextResponse.json({error:"This request can't move to that status."},{status:409});
  d.prepare("UPDATE assistance_requests SET status=? WHERE id=?").run(status,id);audit(user.id,`assistance.${status}`,"assistance_request",id,note);return NextResponse.json({status});
}
