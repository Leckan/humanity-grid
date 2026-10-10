import { NextRequest,NextResponse } from "next/server";
import { requestUser,rateLimited } from "@/lib/auth";
import { db,newId,audit } from "@/lib/db";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const user=requestUser(request);if(!user)return NextResponse.json({error:"Sign in to offer a resource."},{status:401});
  if(rateLimited(`resource-offer:${user.id}`,12))return NextResponse.json({error:"You have sent several offers recently. Try again later."},{status:429});
  let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Check the form."},{status:400});}
  const item=typeof b.item==="string"?b.item.trim():"",quantity=typeof b.quantity==="string"?b.quantity.trim():"",description=typeof b.description==="string"?b.description.trim():"";
  if(item.length<2||item.length>100||quantity.length<1||quantity.length>60||description.length<10||description.length>500)return NextResponse.json({error:"Describe the item, quantity, and how it can be provided."},{status:400});
  const {slug}=await params;const d=db(),initiative=d.prepare("SELECT id FROM initiatives WHERE slug=? AND status='approved'").get(slug) as {id:string}|undefined;
  if(!initiative)return NextResponse.json({error:"This initiative isn't available."},{status:404});
  const id=newId();d.prepare("INSERT INTO resource_offers (id,user_id,initiative_id,item,quantity,description) VALUES (?,?,?,?,?,?)").run(id,user.id,initiative.id,item,quantity,description);audit(user.id,"resource.offered","initiative",initiative.id);return NextResponse.json({id,status:"offered"},{status:201});
}
