import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type User = { id: string; name: string; email: string; role: string; created_at: string };
export type Initiative = { id: string; slug: string; title: string; summary: string; description: string; cause: string; location: string; remote: number; organizer_id: string | null; organizer_name?: string; organization_name?: string; status: string; cover_image: string; funding_goal_minor: number; currency: string; needs: string; created_at: string; demo: number; raised_minor?: number; milestone_count?: number };

const globalForDb = globalThis as typeof globalThis & { humanityGridDb?: DatabaseSync };

function openDb() {
  const configured = process.env.DATABASE_PATH || "./data/humanity-grid.sqlite";
  const dbPath = path.isAbsolute(configured) ? configured : path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  db.exec(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('contributor','organizer','reviewer','admin')) DEFAULT 'contributor',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS causes (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, icon TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, location TEXT NOT NULL,
      website TEXT, checked_detail TEXT, verified INTEGER NOT NULL DEFAULT 0, demo INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS initiatives (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, summary TEXT NOT NULL,
      description TEXT NOT NULL, cause TEXT NOT NULL, location TEXT NOT NULL, remote INTEGER NOT NULL DEFAULT 0,
      organizer_id TEXT REFERENCES users(id), organization_id TEXT REFERENCES organizations(id), status TEXT NOT NULL DEFAULT 'draft'
       CHECK(status IN ('draft','submitted','approved','changes_requested','archived')),
      cover_image TEXT NOT NULL DEFAULT '', funding_goal_minor INTEGER NOT NULL DEFAULT 0 CHECK(funding_goal_minor >= 0),
      currency TEXT NOT NULL DEFAULT 'USD', needs TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, demo INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY, initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT NOT NULL, target_date TEXT, status TEXT NOT NULL DEFAULT 'planned'
    );
    CREATE TABLE IF NOT EXISTS saved_initiatives (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, initiative_id)
    );
    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), initiative_id TEXT NOT NULL REFERENCES initiatives(id),
      amount_minor INTEGER NOT NULL CHECK(amount_minor > 0), currency TEXT NOT NULL DEFAULT 'USD', status TEXT NOT NULL DEFAULT 'pledged'
       CHECK(status IN ('pledged','pending','paid','failed','refunded')), anonymous INTEGER NOT NULL DEFAULT 0,
      provider_ref TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS volunteer_applications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), initiative_id TEXT NOT NULL REFERENCES initiatives(id),
      skill TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'submitted'
       CHECK(status IN ('submitted','accepted','declined','withdrawn','completed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, initiative_id, skill)
    );
    CREATE TABLE IF NOT EXISTS resource_offers (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), initiative_id TEXT NOT NULL REFERENCES initiatives(id),
      item TEXT NOT NULL, quantity TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'offered'
       CHECK(status IN ('offered','accepted','delivered','confirmed','declined')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS assistance_requests (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), category TEXT NOT NULL, summary TEXT NOT NULL,
      details TEXT NOT NULL, general_location TEXT NOT NULL, support_needed TEXT NOT NULL, urgency TEXT NOT NULL DEFAULT 'standard',
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','under_review','more_information','approved','matched','fulfilled','declined','withdrawn')),
      visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility = 'private'), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, object_type TEXT NOT NULL,
      object_id TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS initiatives_status_cause_idx ON initiatives(status, cause);
    CREATE INDEX IF NOT EXISTS initiatives_created_idx ON initiatives(created_at DESC);
    CREATE INDEX IF NOT EXISTS assistance_owner_idx ON assistance_requests(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS applications_initiative_idx ON volunteer_applications(initiative_id, status);
    CREATE INDEX IF NOT EXISTS donations_initiative_status_idx ON donations(initiative_id, status);`);
  seedDemo(db);
  return db;
}

const causeSeeds = [
  ["food", "Food and Basic Needs", "Food security, essential supplies, and immediate community support.", "🥕"],
  ["health", "Healthcare and Well-Being", "Accessible care, health education, and community well-being.", "♡"],
  ["education", "Education and Digital Access", "Learning opportunities, equipment, and digital inclusion.", "✎"],
  ["housing", "Housing and Community Development", "Safe housing, resilient neighborhoods, and shared spaces.", "⌂"],
  ["employment", "Employment and Economic Empowerment", "Skills, livelihoods, entrepreneurship, and financial inclusion.", "↗"],
  ["environment", "Environment and Sustainability", "Climate resilience, conservation, and sustainable communities.", "◌"],
  ["emergency", "Emergency and Disaster Relief", "Community-led response and recovery after emergencies.", "＋"],
  ["families", "Children, Families, and Youth", "Support for young people, caregivers, and families.", "♡"],
  ["accessibility", "Disability Inclusion and Accessibility", "Inclusive access, assistive resources, and equal participation.", "◎"],
  ["caregiving", "Older Adults and Caregiving", "Connection, practical care, and resources for older adults.", "⌘"],
  ["enterprise", "Entrepreneurship and Small Business", "Community enterprise and locally led economic growth.", "◫"],
  ["rights", "Human Rights and Community Development", "Dignity, community voice, and inclusive development.", "✳"],
];

function seedDemo(db: DatabaseSync) {
  const causeCount = Number((db.prepare("SELECT COUNT(*) as n FROM causes").get() as { n: number }).n);
  if (!causeCount) {
    const insert = db.prepare("INSERT OR IGNORE INTO causes (id,slug,name,description,icon) VALUES (?,?,?,?,?)");
    for (const row of causeSeeds) insert.run(randomUUID(), ...row);
  }
  const campaignCount = Number((db.prepare("SELECT COUNT(*) as n FROM initiatives").get() as { n: number }).n);
  if (campaignCount) return;
  const orgs = [
    ["sample-learning", "Learning Together Collective", "A community-led learning group connecting students with digital tools and patient mentors.", "Accra, Ghana", "https://example.org", "Demonstration organization. No real-world affiliation has been verified."],
    ["sample-greenspaces", "Neighborhood Green Circle", "Local residents restoring shared green spaces and building climate resilience.", "Portland, Oregon", "https://example.org", "Demonstration organization. No real-world affiliation has been verified."],
    ["sample-care", "Community Care Network", "A sample community group coordinating household support and essential supplies.", "Remote · United States", "https://example.org", "Demonstration organization. No real-world affiliation has been verified."],
  ];
  const oi = db.prepare("INSERT INTO organizations (id,name,description,location,website,checked_detail,verified,demo) VALUES (?,?,?,?,?,?,0,1)");
  for (const o of orgs) oi.run(...o);
  const ids = (db.prepare("SELECT id,name FROM organizations ORDER BY rowid").all() as {id:string;name:string}[]);
  const initiatives = [
    {slug:"learning-kits-for-community-classrooms", title:"Learning kits for community classrooms", summary:"Equip neighborhood learning circles with shared laptops, books, and hands-on digital lessons.", description:"Students in this demonstration project learn in small community groups, but shared devices are limited. The sample initiative outlines a practical way to pool refurbished laptops, create a lending schedule, and pair learners with volunteer mentors. It is synthetic project data for local development and has not been reviewed or verified.", cause:"Education and Digital Access", location:"Accra, Ghana", remote:0, image:"https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1100&q=80", goal:3200000, needs:["Refurbished laptops","Digital skills mentors","Learning materials"], org:ids[0]},
    {slug:"a-neighborhood-food-pantry", title:"A neighborhood food pantry", summary:"Help a local volunteer network keep a welcoming pantry stocked with everyday essentials.", description:"This sample project explores a shared pantry model that lets nearby residents coordinate shelf-stable food, household essentials, and volunteer shifts. Organizers can post current needs and share regular updates. It is synthetic project data for local development and has not been reviewed or verified.", cause:"Food and Basic Needs", location:"Portland, Oregon", remote:0, image:"https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1100&q=80", goal:1800000, needs:["Shelf-stable food","Volunteer shifts","Storage shelving"], org:ids[2]},
    {slug:"community-led-greenspace-restoration", title:"Community-led greenspace restoration", summary:"Restore a shared neighborhood space with native planting and accessible paths.", description:"Residents in this demonstration project are planning a small greenspace restoration with native plants, accessible walking paths, and community stewardship days. The plan is a synthetic example and does not represent a real campaign or verified outcome.", cause:"Environment and Sustainability", location:"Portland, Oregon", remote:0, image:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1100&q=80", goal:2500000, needs:["Native plants","Landscape design","Community volunteers"], org:ids[1]},
    {slug:"career-mentors-for-new-graduates", title:"Career mentors for new graduates", summary:"Create a small, welcoming mentorship circle for young adults exploring their first jobs.", description:"This synthetic initiative describes a mentor-led program to help young adults practice interviews, review resumes, and learn about different career paths. Mentors can contribute remotely in short, scheduled sessions. This is demonstration data only and has not been verified.", cause:"Employment and Economic Empowerment", location:"Remote · United States", remote:1, image:"https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1100&q=80", goal:0, needs:["Resume review","Interview practice","Career mentoring"], org:ids[0]},
    {slug:"accessible-community-health-days", title:"Accessible community health days", summary:"Bring plain-language health resources and accessible check-in support to community events.", description:"A demonstration plan for neighborhood health days includes accessible check-in, translated information, and referrals to local providers. It is not a real medical service and does not offer medical advice. This synthetic sample is not reviewed or verified.", cause:"Healthcare and Well-Being", location:"Remote · United States", remote:1, image:"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=80", goal:0, needs:["Translation","Event volunteers","Accessible materials"], org:ids[2]},
    {slug:"repair-and-reuse-community-workshop", title:"Repair and reuse community workshop", summary:"Share tools and practical skills to help neighbors repair household essentials.", description:"This demonstration initiative imagines a monthly repair workshop where neighbors can learn basic repair skills and extend the life of household items. Sample needs include volunteer fixers, hand tools, and a community space. This is synthetic data, not a real-world offering.", cause:"Housing and Community Development", location:"Seattle, Washington", remote:0, image:"https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1100&q=80", goal:950000, needs:["Hand tools","Repair mentors","Accessible venue"], org:ids[1]},
  ];
  const insert = db.prepare(`INSERT INTO initiatives (id,slug,title,summary,description,cause,location,remote,organization_id,status,cover_image,funding_goal_minor,currency,needs,demo)
    VALUES (?,?,?,?,?,?,?,?,?,'approved',?,?, 'USD', ?,1)`);
  const milestone = db.prepare("INSERT INTO milestones (id,initiative_id,title,description,target_date,status) VALUES (?,?,?,?,?,'planned')");
  for (const item of initiatives) {
    const id = randomUUID();
    insert.run(id,item.slug,item.title,item.summary,item.description,item.cause,item.location,item.remote,item.org.id,item.image,item.goal,JSON.stringify(item.needs));
    milestone.run(randomUUID(),id,"Plan and listen","Gather community input and define the first delivery steps.","2027-03-15");
    milestone.run(randomUUID(),id,"Share a progress update","Publish a clear update on work completed and next needs.","2027-06-30");
  }
}

export function db() { return globalForDb.humanityGridDb ??= openDb(); }
export function newId() { return randomUUID(); }
export function getInitiatives(options: { query?: string; cause?: string; type?: string; location?: string; remote?: string; sort?: string; approvedOnly?: boolean } = {}): Initiative[] {
  const d = db();
  const conditions: string[] = [];
  const args: (string|number)[] = [];
  if (options.approvedOnly !== false) conditions.push("i.status='approved'");
  if (options.query?.trim()) { const q = `%${options.query.trim()}%`; conditions.push("(i.title LIKE ? OR i.summary LIKE ? OR i.description LIKE ? OR i.cause LIKE ? OR i.location LIKE ? OR i.needs LIKE ?)"); args.push(q,q,q,q,q,q); }
  if (options.cause) { conditions.push("i.cause = ?"); args.push(options.cause); }
  if (options.location?.trim()) { conditions.push("i.location LIKE ?"); args.push(`%${options.location.trim()}%`); }
  if (options.remote === "remote") conditions.push("i.remote=1");
  if (options.remote === "in-person") conditions.push("i.remote=0");
  if (options.type) {
    const map: Record<string,string> = { financial: "i.funding_goal_minor > 0", skills: "i.needs LIKE '%mentor%' OR i.needs LIKE '%design%' OR i.needs LIKE '%review%'", goods: "i.needs LIKE '%laptop%' OR i.needs LIKE '%food%' OR i.needs LIKE '%tool%'", volunteer: "i.needs LIKE '%volunteer%'" };
    if (map[options.type]) conditions.push(`(${map[options.type]})`);
  }
  const order = options.sort === "newest" ? "i.created_at DESC" : options.sort === "remaining" ? "i.funding_goal_minor DESC" : options.sort === "title" ? "i.title ASC" : "i.demo ASC, i.title ASC";
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return d.prepare(`SELECT i.*, o.name AS organization_name, u.name AS organizer_name,
    COALESCE((SELECT SUM(amount_minor) FROM donations d WHERE d.initiative_id=i.id AND d.status='paid'),0) AS raised_minor,
    (SELECT COUNT(*) FROM milestones m WHERE m.initiative_id=i.id) AS milestone_count
    FROM initiatives i LEFT JOIN organizations o ON o.id=i.organization_id LEFT JOIN users u ON u.id=i.organizer_id
    ${where} ORDER BY ${order} LIMIT 48`).all(...args) as unknown as Initiative[];
}
export function getInitiative(slug: string) {
  return db().prepare(`SELECT i.*,o.name AS organization_name,o.description AS organization_description,o.verified AS organization_verified,
    u.name AS organizer_name,COALESCE((SELECT SUM(amount_minor) FROM donations d WHERE d.initiative_id=i.id AND d.status='paid'),0) AS raised_minor
    FROM initiatives i LEFT JOIN organizations o ON o.id=i.organization_id LEFT JOIN users u ON u.id=i.organizer_id WHERE i.slug=?`).get(slug) as (Initiative & {organization_description?:string; organization_verified?:number})|undefined;
}
export function audit(actorId: string | null, action: string, objectType: string, objectId: string, detail = "") {
  db().prepare("INSERT INTO audit_logs (id,actor_id,action,object_type,object_id,detail) VALUES (?,?,?,?,?,?)").run(newId(),actorId,action,objectType,objectId,detail);
}

export const causes = causeSeeds.map(([slug,name,description,icon])=>({slug,name,description,icon}));
