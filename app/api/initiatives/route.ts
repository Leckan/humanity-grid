import { NextRequest,NextResponse } from "next/server";
import { requestUser, rateLimited } from "@/lib/auth";
import { db,newId,audit,getInitiatives } from "@/lib/db";
import { slugify,validateInitiative } from "@/lib/domain";

export async function GET(request:NextRequest){
  const p=request.nextUrl.searchParams;
  return NextResponse.json({initiatives:getInitiatives({query:p.get("q")||"",cause:p.get("cause")||"",type:p.get("type")||"",location:p.get("location")||"",remote:p.get("remote")||"",sort:p.get("sort")||"newest"})});
}
export async function POST(request:NextRequest){
  const user=requestUser(request);if(!user)return NextResponse.json({error:"Sign in to start an initiative."},{status:401});
  if(rateLimited(`initiative-create:${user.id}`,6,60*60*1000))return NextResponse.json({error:"You have created several drafts recently. Try again later."},{status:429});
  let input:Record<string,unknown>;try{input=await request.json();}catch{return NextResponse.json({error:"Check the form and try again."},{status:400});}
  const result=validateInitiative(input);if(!result.ok)return NextResponse.json({error:result.errors[0],errors:result.errors},{status:400});
  const {title,description,cause,location,fundingGoalMinor}=result.value;
  const summary=typeof input.summary==="string"?input.summary.trim():description.slice(0,180);
  if(summary.length<20||summary.length>240)return NextResponse.json({error:"Short description must be 20–240 characters."},{status:400});
  const remote=Boolean(input.remote),needs=Array.isArray(input.needs)?input.needs.filter((v):v is string=>typeof v==="string"&&v.length<60).slice(0,8):[];
  const id=newId();let slug=slugify(title);let suffix=0;
  const d=db();while(d.prepare("SELECT id FROM initiatives WHERE slug=?").get(slug))slug=`${slugify(title)}-${++suffix}`;
  d.prepare(`INSERT INTO initiatives (id,slug,title,summary,description,cause,location,remote,organizer_id,status,funding_goal_minor,currency,needs,demo)
    VALUES (?,?,?,?,?,?,?,?,?,'draft',?,'USD',?,0)`).run(id,slug,title,summary,description,cause,location,remote?1:0,user.id,fundingGoalMinor,JSON.stringify(needs));
  audit(user.id,"initiative.created","initiative",id,"status=draft");
  return NextResponse.json({id,slug,status:"draft"},{status:201});
}
