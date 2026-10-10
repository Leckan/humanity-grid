import Link from "next/link";
import type { Initiative } from "@/lib/db";

export function InitiativeCard({item}:{item:Initiative}){
  const funding=item.funding_goal_minor>0;
  const percent=funding?Math.max(0,Math.min(100,Math.round((item.raised_minor||0)/item.funding_goal_minor*100))):0;
  const needs=(()=>{try{return JSON.parse(item.needs) as string[]}catch{return []}})();
  return <article className="project-card"><Link href={`/initiatives/${item.slug}`} aria-label={`View ${item.title}`}><div className="project-img" style={{backgroundImage:`url("${item.cover_image}")`}}><span className="demo-tag">Demonstration data</span></div></Link><div className="project-body"><div className="project-meta"><span className="category">{item.cause}</span><span>{item.remote?"Remote":item.location}</span></div><Link href={`/initiatives/${item.slug}`}><h3>{item.title}</h3></Link><p>{item.summary}</p>{funding&&<div className="funding"><div className="funding-row"><span>Funding goal · demo only</span><span>${(item.funding_goal_minor/100).toLocaleString("en-US")}</span></div><div className="bar"><span style={{width:`${percent}%`}}/></div></div>}<div className="project-foot"><span className="project-needs">Needs: {needs.slice(0,2).join(" · ")||"Community support"}</span><Link className="text-link" href={`/initiatives/${item.slug}`}>Explore ↗</Link></div></div></article>
}
