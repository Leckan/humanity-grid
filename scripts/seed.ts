import { randomBytes, scryptSync } from "node:crypto";
import { db, newId } from "../lib/db.ts";

const database=db();
const adminEmail=process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword=process.env.SEED_ADMIN_PASSWORD;
if(adminEmail&&adminPassword&&adminPassword.length>=12){
  const existing=database.prepare("SELECT id FROM users WHERE email=?").get(adminEmail) as {id:string}|undefined;
  if(!existing){const salt=randomBytes(16).toString("hex"),hash=scryptSync(adminPassword,salt,64).toString("hex");database.prepare("INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?, 'admin')").run(newId(),"Humanity Grid Admin",adminEmail,`${salt}:${hash}`);console.log(`Created local admin account for ${adminEmail}.`);}
  else console.log(`Admin account ${adminEmail} already exists.`);
}else console.log("Demo causes and synthetic initiatives are available. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ characters) to create a local admin account.");
console.log("Seed complete. Synthetic initiatives are marked as demonstration data in the UI.");
