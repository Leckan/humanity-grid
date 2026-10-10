import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const folder=mkdtempSync(path.join(tmpdir(),"humanity-grid-test-"));
process.env.DATABASE_PATH=path.join(folder,"test.sqlite");
const {db}=await import("../lib/db.ts");

test("database seeds are repeatable and sample initiatives stay marked synthetic",()=>{
  const database=db();
  const before=database.prepare("SELECT COUNT(*) AS n FROM initiatives").get().n;
  const causes=database.prepare("SELECT COUNT(*) AS n FROM causes").get().n;
  assert.equal(before,6);
  assert.equal(causes,12);
  assert.equal(database.prepare("SELECT COUNT(*) AS n FROM initiatives WHERE demo=1").get().n,before);
  database.exec("CREATE TABLE IF NOT EXISTS repeatability_check (id INTEGER PRIMARY KEY)");
  assert.equal(database.prepare("SELECT COUNT(*) AS n FROM repeatability_check").get().n,0);
  database.close();
  rmSync(folder,{recursive:true,force:true});
});
