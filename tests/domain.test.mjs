import test from "node:test";
import assert from "node:assert/strict";
import { canReview, canTransitionInitiative, matchScore, slugify, validateInitiative } from "../lib/domain.ts";

test("initiative state transitions allow draft submission and reviewer decisions only",()=>{
  assert.equal(canTransitionInitiative("draft","submitted"),true);
  assert.equal(canTransitionInitiative("submitted","approved"),true);
  assert.equal(canTransitionInitiative("submitted","changes_requested"),true);
  assert.equal(canTransitionInitiative("approved","submitted"),false);
  assert.equal(canTransitionInitiative("draft","approved"),false);
});

test("review authorization is restricted to reviewer and admin roles",()=>{
  assert.equal(canReview("admin"),true);
  assert.equal(canReview("reviewer"),true);
  assert.equal(canReview("organizer"),false);
  assert.equal(canReview(undefined),false);
});

test("initiative validation rejects short content and negative funding",()=>{
  assert.equal(validateInitiative({title:"Short",description:"Too short",cause:"Education",location:"Accra",fundingGoal:-2}).ok,false);
  const good=validateInitiative({title:"Community learning devices",description:"A sufficiently detailed description of the community need and the practical response being planned.",cause:"Education",location:"Accra, Ghana",fundingGoal:"125.50"});
  assert.equal(good.ok,true);
  assert.equal(good.value.fundingGoalMinor,12550);
});

test("matching rewards shared causes, skills, location, and remote preference",()=>{
  const score=matchScore({cause:"Education",needs:["Digital skills mentors","Laptops"],location:"Accra, Ghana",remote:1},{causes:["Education"],skills:["mentor"],location:"Accra",remoteOnly:true});
  assert.equal(score,100);
  assert.equal(matchScore({cause:"Food",needs:[],location:"Lima",remote:0},{}),0);
});

test("slug generation is stable and strips punctuation",()=>{
  assert.equal(slugify(" Café for All! "),"cafe-for-all");
  assert.equal(slugify("..."),"initiative");
});
