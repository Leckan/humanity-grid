import { NextRequest,NextResponse } from "next/server";
import { requestUser,rateLimited } from "@/lib/auth";
import { audit,db } from "@/lib/db";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{kind:string;id:string}>}){
  const user=requestUser(request);if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  if(rateLimited(`engagement-review:${user.id}`,60))return NextResponse.json({error:"Please wait before updating more contributor records."},{status:429});
  const {kind,id}=await params;let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
  const next=b.status==="accepted"?"accepted":b.status==="declined"?"declined":"";if(!next||!["volunteer","resource"].includes(kind))return NextResponse.json({error:"Unsupported status change."},{status:400});
  const d=db();const table=kind==="volunteer"?"volunteer_applications":"resource_offers";
  const row=d.prepare(`SELECT r.id,r.status,i.organizer_id FROM ${table} r JOIN initiatives i ON i.id=r.initiative_id WHERE r.id=?`).get(id) as {id:string;status:string;organizer_id:string|null}|undefined;
  if(!row||row.organizer_id!==user.id)return NextResponse.json({error:"Only the initiative organizer can decide this offer."},{status:403});
  const expected=kind==="volunteer"?"submitted":"offered";if(row.status!==expected)return NextResponse.json({error:"This contribution has already been handled."},{status:409});
  d.prepare(`UPDATE ${table} SET status=? WHERE id=?`).run(next,id);audit(user.id,`${kind}.${next}`,kind,id);return NextResponse.json({status:next});
}
