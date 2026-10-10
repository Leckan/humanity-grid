import { NextRequest,NextResponse } from "next/server";
import { requestUser,rateLimited } from "@/lib/auth";
import { db,newId,audit } from "@/lib/db";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const user=requestUser(request);if(!user)return NextResponse.json({error:"Sign in to apply."},{status:401});
  if(rateLimited(`volunteer-apply:${user.id}`,12))return NextResponse.json({error:"You have sent several applications recently. Try again later."},{status:429});
  let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Check the form."},{status:400});}
  const skill=typeof b.skill==="string"?b.skill.trim():"",message=typeof b.message==="string"?b.message.trim():"";
  if(skill.length<2||skill.length>80||message.length<20||message.length>1000)return NextResponse.json({error:"Add a skill and a short message of at least 20 characters."},{status:400});
  const {slug}=await params;const d=db(),initiative=d.prepare("SELECT id FROM initiatives WHERE slug=? AND status='approved'").get(slug) as {id:string}|undefined;
  if(!initiative)return NextResponse.json({error:"This opportunity isn't accepting applications."},{status:404});
  try{const id=newId();d.prepare("INSERT INTO volunteer_applications (id,user_id,initiative_id,skill,message) VALUES (?,?,?,?,?)").run(id,user.id,initiative.id,skill,message);audit(user.id,"volunteer.applied","initiative",initiative.id);return NextResponse.json({id,status:"submitted"},{status:201});}
  catch{return NextResponse.json({error:"You already applied for this skill on this initiative."},{status:409});}
}
