import { NextRequest,NextResponse } from "next/server";
import { requestUser,rateLimited } from "@/lib/auth";
import { db,newId,audit } from "@/lib/db";
const categories=new Set(["Food and basic needs","Education","Healthcare","Housing","Accessibility","Employment and skills","Emergency support","Equipment and supplies","Other"]);
export async function POST(request:NextRequest){
  const user=requestUser(request);if(!user)return NextResponse.json({error:"Sign in to submit a private assistance request."},{status:401});
  if(rateLimited(`assistance:${user.id}`,3,60*60*1000))return NextResponse.json({error:"You have submitted several requests recently. Try again later."},{status:429});
  let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Check the form and try again."},{status:400});}
  const category=typeof b.category==="string"?b.category:"",summary=typeof b.summary==="string"?b.summary.trim():"",details=typeof b.details==="string"?b.details.trim():"",location=typeof b.location==="string"?b.location.trim():"",support=typeof b.support==="string"?b.support.trim():"",urgency=b.urgency==="urgent"?"urgent":"standard";
  if(!categories.has(category)||summary.length<8||summary.length>140||details.length<30||details.length>2500||location.length<2||location.length>120||support.length<5||support.length>500)return NextResponse.json({error:"Please complete each field. Use a general location; do not include a street address."},{status:400});
  const id=newId();db().prepare("INSERT INTO assistance_requests (id,user_id,category,summary,details,general_location,support_needed,urgency,visibility) VALUES (?,?,?,?,?,?,?,?,'private')").run(id,user.id,category,summary,details,location,support,urgency);audit(user.id,"assistance.submitted","assistance_request",id,"visibility=private");
  return NextResponse.json({id,status:"submitted",message:"Your request was submitted privately. It is not a public initiative."},{status:201});
}
