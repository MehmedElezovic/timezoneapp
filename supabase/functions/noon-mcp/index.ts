// Noon · the Claude connector. A remote MCP server (streamable HTTP, JSON responses) that lets Claude find pages by
// client and category, read a page's copy (as Markdown) and design (HTML) with their comments and history, upload the
// next copy or design version, and resolve or answer comments, all as the person whose key it holds.
// Keys are made in Noon › Settings › Claude; only their SHA-256 lives in public.api_tokens. Claude sends the key as
// "Authorization: Bearer noon_…", or as the last part of the address for clients that cannot set headers.
// Deployed with verify_jwt off: this function checks the key itself, then works with the service role, and every
// query is limited to the teams that person sits in.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { marked } from "npm:marked@12.0.2";
import { parseHTML } from "npm:linkedom@0.18.5";
import { htmlToMarkdown, htmlToText } from "./markdown.js";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const BUCKET = "project-files";
const APP_URL = (Deno.env.get("NOON_APP_URL") || "").replace(/\/+$/, ""); // optional: links back into the app
const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, accept, mcp-session-id, mcp-protocol-version, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
  "Access-Control-Expose-Headers": "mcp-session-id",
};
const WIDTH: Record<string, string> = { desktop: "desktop (1280px)", tablet: "tablet (820px)", phone: "phone (390px)" };
const EXT: Record<string, string> = {
  css: "text/css", js: "text/javascript", mjs: "text/javascript", html: "text/html", htm: "text/html", json: "application/json",
  svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif",
  ico: "image/x-icon", mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
  otf: "font/otf", txt: "text/plain", md: "text/markdown", xml: "application/xml",
};
const typeOf = (p: string) => EXT[(p.split(".").pop() || "").toLowerCase()] || "application/octet-stream";
const isText = (t: string) => /^text\/|json|xml|svg|javascript/.test(t);

class Oops extends Error {}
const { document: DOC } = parseHTML("<!doctype html><html><head></head><body></body></html>"); // to read copy versions with
type Seat = { team_id: string; member_id: string; team: string };
type Ctx = { userId: string; seats: Seat[] };

// ---------------------------------------------------------------- small helpers
async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const dirOf = (p: string) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "");
function normPath(path: string) {
  const out: string[] = [];
  for (const s of path.replace(/\\/g, "/").split("/")) { if (s === "..") out.pop(); else if (s && s !== ".") out.push(s); }
  return out.join("/");
}
const relTo = (dir: string, full: string) => (dir && full.startsWith(dir) ? full.slice(dir.length) : full);
const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  const d = Math.round(m / 1440);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${d} day${d === 1 ? "" : "s"} ago`;
};
const size = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);
async function q<T = any>(p: PromiseLike<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message || String(error));
  return data as T;
}
function b64(s: string) { const bin = atob(s.replace(/\s+/g, "")); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
const projLink = (id: string) => (APP_URL ? `${APP_URL}/?view=projects&proj=${id}` : "");

// ---------------------------------------------------------------- who is asking
function keyOf(req: Request, url: URL) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(noon_[A-Za-z0-9_-]{20,})\s*$/);
  if (m) return m[1];
  const seg = url.pathname.split("/").find((s) => /^noon_[A-Za-z0-9_-]{20,}$/.test(s));
  if (seg) return seg;
  const k = url.searchParams.get("key");
  return k && /^noon_[A-Za-z0-9_-]{20,}$/.test(k) ? k : null;
}
async function whoIs(key: string): Promise<Ctx | null> {
  const hash = await sha256(key);
  const rows = await q<any[]>(db.from("api_tokens").select("id,user_id,last_used_at").eq("token_hash", hash).limit(1));
  const t = rows[0];
  if (!t) return null;
  if (!t.last_used_at || Date.now() - new Date(t.last_used_at).getTime() > 3600000) {
    db.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", t.id).then(() => {});
  }
  const seats = await q<any[]>(db.from("members").select("id,team_id,teams(name)").eq("user_id", t.user_id));
  return { userId: t.user_id, seats: seats.map((s) => ({ team_id: s.team_id, member_id: s.id, team: s.teams?.name || "Team" })) };
}

// ---------------------------------------------------------------- reading projects
async function findProject(ctx: Ctx, ref: unknown) {
  const teams = ctx.seats.map((s) => s.team_id);
  if (!teams.length) throw new Oops("This account is not in any team yet.");
  const r = String(ref ?? "").trim();
  if (!r) throw new Oops("Say which page: its name, its id, or a Noon link to it.");
  const id = r.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const share = r.match(/[?&]share=([A-Za-z0-9_-]{20,64})/);
  let sel = db.from("projects").select("*").in("team_id", teams);
  if (id) sel = sel.eq("id", id[0].toLowerCase());
  else if (share) { // a client link opens one version; find the project it belongs to
    const sv = await q<any[]>(db.from("versions").select("project_id").eq("share_token", share[1]).in("team_id", teams));
    const cv = sv.length ? [] : await q<any[]>(db.from("copy_versions").select("project_id").eq("share_token", share[1]).in("team_id", teams));
    sel = sel.eq("id", sv[0]?.project_id ?? cv[0]?.project_id ?? "00000000-0000-0000-0000-000000000000");
  }
  else sel = sel.ilike("name", `%${r.replace(/[\\%_]/g, (c) => "\\" + c)}%`);
  const found = await q<any[]>(sel);
  if (!found.length) throw new Oops(`No page matches "${r}". Call find_pages or list_projects to see them.`);
  if (found.length > 1) {
    const exact = found.filter((p) => p.name.toLowerCase() === r.toLowerCase());
    if (exact.length === 1) return exact[0];
    throw new Oops(`"${r}" matches ${found.length} pages: ${found.map((p) => `"${p.name}" (${p.id})`).join(", ")}. Pass the exact name or the id.`);
  }
  return found[0];
}
const seatFor = (ctx: Ctx, teamId: string) => ctx.seats.find((s) => s.team_id === teamId)!;
async function versionsOf(projectId: string) {
  return await q<any[]>(db.from("versions").select("*").eq("project_id", projectId).order("n"));
}
function pickVersion(vs: any[], n: unknown) {
  if (!vs.length) throw new Oops("This project has no versions yet. Upload one with upload_version.");
  if (n == null || n === "" || n === "latest") return vs[vs.length - 1];
  const want = Number(String(n).replace(/^v/i, ""));
  const v = vs.find((x) => x.n === want);
  if (!v) throw new Oops(`There is no v${want}. This project has ${vs.map((x) => "v" + x.n).join(", ")}.`);
  return v;
}
async function peopleOf(teamId: string) {
  const rows = await q<any[]>(db.from("v_members").select("id,name").eq("team_id", teamId));
  return Object.fromEntries(rows.map((m) => [m.id, m.name || "Someone"]));
}
const tag = (c: any) => (c.layer === "client" ? "C" : "#") + c.n;
type Ref = { layer: "team" | "client"; n: number };
// "#3", "3" or 3 is team comment 3; "C2" is the client link's comment 2
function refOf(x: unknown): Ref | null {
  if (typeof x === "number" && Number.isInteger(x)) return { layer: "team", n: x };
  const m = String(x ?? "").trim().match(/^(c|#)?\s*(\d+)$/i);
  return m ? { layer: m[1] && m[1].toLowerCase() === "c" ? "client" : "team", n: Number(m[2]) } : null;
}
async function commentsOf(versionId: string, status: string, layer = "all") {
  let sel = db.from("version_comments").select("*").eq("version_id", versionId).order("n");
  if (layer === "team" || layer === "client") sel = sel.eq("layer", layer);
  if (status === "open" || status === "resolved") sel = sel.eq("status", status);
  const cms = await q<any[]>(sel);
  const res = cms.length ? await q<any[]>(db.from("version_replies").select("*").in("comment_id", cms.map((c) => c.id)).order("created_at")) : [];
  return cms.map((c) => ({ ...c, replies: res.filter((r) => r.comment_id === c.id) }));
}
const author = (people: Record<string, string>, row: any) =>
  row.guest_name ? `${row.guest_name} (guest)` : (row.author_id && people[row.author_id]) || "Someone";
function commentText(c: any, people: Record<string, string>) {
  const lines = [
    `${tag(c)} · ${c.status} · ${author(people, c)}${c.layer === "client" ? " · on the review link" : ""} · left at ${WIDTH[c.dev] || "desktop (1280px)"} · ${ago(c.created_at)}${c.from_version ? ` · carried over from ${c.from_version}` : ""}`,
    `  "${c.body}"`,
  ];
  if (c.sel) lines.push(`  Pinned to the element: ${c.sel}`);
  if (c.snippet) lines.push(`  That element looked like: ${c.snippet.replace(/\s+/g, " ").slice(0, 600)}`);
  if (c.rx != null) lines.push(`  Spot on it: ${Math.round(c.rx * 100)}% across, ${Math.round(c.ry * 100)}% down${c.px ? ` (page position x ${Math.round(c.px)}, y ${Math.round(c.py)})` : ""}`);
  for (const r of c.replies || []) lines.push(`  ↳ ${author(people, r)}: "${r.body}"`);
  return lines.join("\n");
}
async function download(path: string | null) {
  if (!path) return null;
  const { data, error } = await db.storage.from(BUCKET).download(path);
  return error ? null : data;
}

// ---------------------------------------------------------------- clients, folders and categories
type Tree = { folders: Record<string, any>; group: Record<string, any>; item: Record<string, any>; lists: any[] };
async function treeOf(teams: string[]): Promise<Tree> {
  const [fs, cs] = await Promise.all([
    q<any[]>(db.from("folders").select("id,team_id,parent_id,name,cats").in("team_id", teams)),
    q<any[]>(db.from("categories").select("id,team_id,parent_id,level,name,sort").in("team_id", teams).order("sort")),
  ]);
  return {
    folders: Object.fromEntries(fs.map((f) => [f.id, f])),
    group: Object.fromEntries(cs.filter((c) => !c.parent_id).map((c) => [c.id, c])),
    item: Object.fromEntries(cs.filter((c) => c.parent_id).map((c) => [c.id, c])),
    lists: cs,
  };
}
// the folders from the client down to this one
function pathOf(t: Tree, folderId: string | null) {
  const out: any[] = [];
  let f = folderId ? t.folders[folderId] : null, n = 0;
  while (f && n++ < 40) { out.unshift(f); f = f.parent_id ? t.folders[f.parent_id] : null; }
  return out;
}
const placeOf = (t: Tree, p: any) => { const path = pathOf(t, p.folder_id); return path.length ? path.map((f) => f.name).join(" › ") : "not in a client yet"; };
const catList = (t: Tree, ids: string[]) => (ids || []).map((id) => t.item[id]).filter(Boolean).map((c: any) => ({ list: t.group[c.parent_id]?.name || "Category", name: c.name as string }));
// a page's categories: its client's (audience, industry…) count for it, then its own (page type, style…)
const catsOf = (t: Tree, p: any) => [...catList(t, pathOf(t, p.folder_id)[0]?.cats || []), ...catList(t, p.cats || [])];
const catsText = (cs: { list: string; name: string }[]) => (cs.length ? cs.map((c) => `${c.list}: ${c.name}`).join(" · ") : "no categories");

// ---------------------------------------------------------------- copy
async function copyOf(projectId: string) {
  return await q<any[]>(db.from("copy_versions").select("*").eq("project_id", projectId).order("n"));
}
function pickCopy(p: any, cs: any[], n: unknown) {
  if (!cs.length) throw new Oops(`${p.name} has no copy yet. Add it with upload_copy_version.`);
  if (n == null || n === "" || n === "latest") return cs[cs.length - 1];
  if (n === "final") {
    const f = cs.find((c) => c.id === p.final_copy);
    if (!f) throw new Oops(`${p.name} has no copy marked final. Its copy versions: ${cs.map((c) => "v" + c.n).join(", ")}.`);
    return f;
  }
  const want = Number(String(n).replace(/^v/i, "")), v = cs.find((c) => c.n === want);
  if (!v) throw new Oops(`There is no copy v${want}. ${p.name} has ${cs.map((c) => "v" + c.n).join(", ")}.`);
  return v;
}
async function copyCommentsOf(versionIds: string[]) {
  if (!versionIds.length) return [];
  const cms = await q<any[]>(db.from("copy_comments").select("*").in("copy_version_id", versionIds).order("n"));
  const res = cms.length ? await q<any[]>(db.from("copy_replies").select("*").in("comment_id", cms.map((c) => c.id)).order("created_at")) : [];
  return cms.map((c) => ({ ...c, replies: res.filter((r) => r.comment_id === c.id) }));
}
const clipQ = (s: string, n = 300) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const copyState = (c: any) => (c.status === "accepted" ? (c.applied_in ? `accepted, went into v${c.applied_in}` : "accepted, waiting for the next version") : c.status);
function copyCommentText(c: any, people: Record<string, string>) {
  const where = c.layer === "client" ? " · on the review link" : "";
  const lines = c.kind === "suggest"
    ? [`${tag(c)} · suggestion · ${copyState(c)} · ${author(people, c)}${where} · ${ago(c.created_at)}`, `  Change "${clipQ(c.quote)}" to ${c.replacement ? `"${clipQ(c.replacement, 600)}"` : "nothing (remove it)"}`]
    : [`${tag(c)} · ${c.status} · ${author(people, c)}${where} · ${ago(c.created_at)}`, `  On the words "${clipQ(c.quote)}"`];
  if (c.body) lines.push(`  "${c.body}"`);
  for (const r of c.replies || []) lines.push(`  ↳ ${author(people, r)}: "${r.body}"`);
  return lines.join("\n");
}
const wordsIn = (html: string) => (htmlToText(DOC, html).match(/\S+/g) || []).length;
const srcText = (v: any) => (!v.src || v.src === "written" ? "written in Noon" : v.src === "Claude" ? "uploaded by Claude" : `from ${v.src}`);
const verText = (list: any[], fin: string | null) => {
  if (!list.length) return "none";
  const top = Math.max(...list.map((v) => v.n)), f = fin ? list.find((v) => v.id === fin) : null;
  return `v${top}${f ? ` (v${f.n} final)` : ""}`;
};

// ---------------------------------------------------------------- tools
const TOOLS = [
  {
    name: "list_clients",
    description: "How the work is organised: the clients (top-level folders) with their categories (audience, industry…), the folders inside each, how many pages each holds, and the team's category lists (for clients: Audience, Industry…; for pages: Page type, Style…). Start here to learn the category names to search with.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "find_pages",
    description: "Find pages across every client by category, client and name, e.g. every B2B listicle, or all Scrappy advertorials for one client. A page (called a project in the other tools) has a copy, read as Markdown with get_copy, and a design, an HTML page read with get_version; one version of each can be marked final. A client's categories count for all its pages. Then read the pages it returns with get_copy (version \"final\"), get_version and get_page_history.",
    inputSchema: {
      type: "object",
      properties: {
        category: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }], description: "Category choices the page must have, all of them: \"B2B\", or [\"B2B\", \"Listicle\"]. Matches the client's categories and the page's own. \"Page type: Listicle\" works too." },
        client: { type: "string", description: "Only pages under this client (part of its name is enough)." },
        search: { type: "string", description: "Only pages whose name contains this." },
        has: { type: "string", enum: ["final_copy", "final_design", "copy", "design"], description: "Only pages that have this." },
        limit: { type: "number", description: "Most pages to list, the most recently changed first. Default 50." },
      },
    },
  },
  {
    name: "get_copy",
    description: "Read a page's copy as Markdown, with the comments and suggestions on it. A comment sits on some words (quoted). A suggestion proposes new wording for some words; the team accepts or declines it, and accepted wording belongs in the next version. By default the latest copy version and what is still open on it; version \"final\" gives the copy marked final.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "The page: its name, its id, or a Noon link to it." },
        version: { anyOf: [{ type: "number" }, { type: "string" }], description: "1, 2, 3…, \"latest\" (default) or \"final\"." },
        comments: { type: "string", enum: ["open", "all", "none"], description: "Default: open (open comments and suggestions, and accepted wording not in a version yet)." },
      },
      required: ["project"],
    },
  },
  {
    name: "get_page_history",
    description: "Everything that happened on a page, oldest first: each copy version (where it came from, who, when, how long) with its comments and suggestions and what became of them (accepted into which version, declined, resolved), each design version with its comments and replies, and which copy and design are final. Use it to learn how a page was worked out, or to compare how similar pages went.",
    inputSchema: { type: "object", properties: { project: { type: "string", description: "The page: its name, its id, or a Noon link to it." } }, required: ["project"] },
  },
  {
    name: "upload_copy_version",
    description: "Add the next version of a page's copy, written in Markdown: # headings, **bold**, *italic*, <u>underline</u>, <mark>highlight</mark>, [links](https://…), lists, > quotes, --- lines. The team sees it in Noon right away and can compare it with the previous version. Accepted suggestions on the previous version whose wording is in it are marked as gone into this version. Optionally resolve the comments you handled on the previous version, with a reply on each.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "The page: its name, its id, or a Noon link to it." },
        markdown: { type: "string", description: "The whole copy, in Markdown." },
        resolve: { type: "array", items: { anyOf: [{ type: "number" }, { type: "string" }] }, description: "Comments to resolve on the previous copy version: team comments as numbers or \"#3\", review-link comments as \"C2\"." },
        reply: { type: "string", description: "Optional note posted as a reply on every comment you resolve." },
      },
      required: ["project", "markdown"],
    },
  },
  {
    name: "list_projects",
    description: "List every page (a project, in these tools) this person can see, newest change first: name, client and folder, categories, copy and design versions with which is final, open design comments, deadline and when it last changed. To filter by client or category, use find_pages.",
    inputSchema: { type: "object", properties: { search: { type: "string", description: "Optional: only projects whose name contains this." } } },
  },
  {
    name: "get_project",
    description: "One page's overview: its client and categories, every design version with its comment counts, its copy versions, which are final, the deadline, who it is assigned to, and which review links are on.",
    inputSchema: { type: "object", properties: { project: { type: "string", description: "Project name, its id, or a Noon link to it." } }, required: ["project"] },
  },
  {
    name: "get_version",
    description: "Read a version of a project to work on it: the full HTML source of the page, the list of files that came with it (images, styles, scripts) and the comments on it. By default the latest version and its open comments. Each comment says which element it is pinned to (a CSS selector inside the page), what that element looked like when the comment was left, and at which screen width. To apply the feedback, edit the HTML (and any styles), then call upload_version.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name, its id, or a Noon link to it." },
        version: { type: "number", description: "Version number (1, 2, 3…). Leave out for the latest." },
        comments: { type: "string", enum: ["open", "resolved", "all"], description: "Which comments to include. Default: open." },
        layer: { type: "string", enum: ["all", "team", "client"], description: "Team comments (left in Noon, numbered #1, #2…), review-link comments (\"client\", numbered C1, C2…), or both. Default: all." },
        include_files: { type: "boolean", description: "Also return the contents of text files that came with the page (CSS, JS, SVG, JSON up to 200 KB each), and download links for images. Default: false." },
      },
      required: ["project"],
    },
  },
  {
    name: "get_comments",
    description: "Only the comments on a version (with replies), without the page source. Default: open comments on the latest version.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        version: { type: "number", description: "Leave out for the latest." },
        status: { type: "string", enum: ["open", "resolved", "all"], description: "Default: open." },
        layer: { type: "string", enum: ["all", "team", "client"], description: "Default: all." },
      },
      required: ["project"],
    },
  },
  {
    name: "upload_version",
    description: "Upload a new version of a project's page. It becomes the next version (latest + 1) with no comments, and the team sees it in Noon right away, with Compare against the previous version. Files that came with the previous version (images, styles) carry over automatically; pass only files you changed or added. Optionally resolve the comments you addressed on the version you worked from, and leave a reply on each.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name, its id, or a Noon link to it." },
        html: { type: "string", description: "The complete HTML of the new page." },
        file_name: { type: "string", description: "File name for the page. Default: the same as the previous version (usually index.html)." },
        files: {
          type: "array",
          description: "Changed or new files, with paths relative to the HTML file (e.g. css/style.css, images/hero.jpg).",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string", description: "The file content: plain text, or base64 for images and other binary files." },
              encoding: { type: "string", enum: ["utf8", "base64"], description: "Default: utf8." },
            },
            required: ["path", "content"],
          },
        },
        resolve: { type: "array", items: { anyOf: [{ type: "number" }, { type: "string" }] }, description: "Comments to mark resolved on the version this one answers (the previous latest): team comments as numbers or \"#3\", review-link comments as \"C2\"." },
        reply: { type: "string", description: "Optional note posted as a reply on every comment you resolve, e.g. 'Done in v3: shortened the headline.'" },
      },
      required: ["project", "html"],
    },
  },
  {
    name: "resolve_comments",
    description: "Mark comments on a design or copy version as resolved (or reopen them), with an optional reply on each.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        part: { type: "string", enum: ["design", "copy"], description: "Comments on the design (default) or on the copy." },
        version: { type: "number", description: "Leave out for the latest." },
        numbers: { type: "array", items: { anyOf: [{ type: "number" }, { type: "string" }] }, description: "Comments as shown in get_version or get_copy: team comments as numbers or \"#3\", review-link comments as \"C2\"." },
        reopen: { type: "boolean", description: "Reopen instead of resolve. Default: false." },
        reply: { type: "string", description: "Optional reply posted on each of them." },
      },
      required: ["project", "numbers"],
    },
  },
  {
    name: "reply_to_comment",
    description: "Post a reply on one comment on a design or copy version, as this person. Use it to ask a question or explain what changed.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        part: { type: "string", enum: ["design", "copy"], description: "A comment on the design (default) or on the copy." },
        version: { type: "number", description: "Leave out for the latest." },
        number: { anyOf: [{ type: "number" }, { type: "string" }], description: "The comment: a number or \"#3\" for a team comment, \"C2\" for a review-link comment. Replies on review-link comments are visible on the link." },
        text: { type: "string" },
      },
      required: ["project", "number", "text"],
    },
  },
];

const INSTRUCTIONS = `Noon is where a team works on landing pages for its clients. Clients are top-level folders (they may hold more folders), and they hold pages. A page (called a project in these tools) has two parts, each a stack of versions: its copy, read as Markdown with get_copy, and its design, an HTML page read with get_version. One copy version and one design version can be marked final. Clients and pages carry categories: a client's (Audience: B2B, Industry: Dental…) count for all its pages, and a page's own say what it is (Page type: Listicle, Style: Scrappy…).
To learn from past work: list_clients for the layout and the category names, find_pages to filter (for example category ["B2B", "Listicle"]), then get_copy with version "final", get_version for the design, and get_page_history for how the page got there.
To apply design feedback: get_version (latest version, open comments, full HTML) → edit the page so every open comment is handled → upload_version with the full new HTML, the comment numbers you handled in "resolve", and a short "reply" saying what you did. To apply copy feedback: get_copy → rewrite so every open comment is handled and accepted suggestions are in → upload_copy_version with the whole copy in Markdown, resolving what you handled.
Comments come in two layers: the team's, left in Noon and numbered #1, #2…, and the review link's, numbered C1, C2…, which is the conversation people outside Noon (clients, sometimes teammates) see on their link. Treat both as feedback to apply. Anything you post on a review-link comment (a reply, or the reply note when resolving it) is visible on the link, so keep it client-friendly; team comments are internal. If a comment is unclear, ask with reply_to_comment instead of guessing.`;

async function callTool(ctx: Ctx, name: string, a: any): Promise<string | { type: string; text: string }[]> {
  if (name === "list_projects") {
    const teams = ctx.seats.map((s) => s.team_id);
    let sel = db.from("projects").select("id,name,team_id,folder_id,cats,final_copy,final_design,due_day,changed_at,changed_by,changed_guest").in("team_id", teams).order("changed_at", { ascending: false });
    if (a?.search) sel = sel.ilike("name", `%${String(a.search).replace(/[\\%_]/g, (c) => "\\" + c)}%`);
    const ps = await q<any[]>(sel);
    if (!ps.length) return a?.search ? `No page name contains "${a.search}".` : "No pages yet.";
    const vs = await q<any[]>(db.from("versions").select("id,project_id,n,share_on").in("project_id", ps.map((p) => p.id)));
    const cvs = await q<any[]>(db.from("copy_versions").select("id,project_id,n").in("project_id", ps.map((p) => p.id))), tree = await treeOf(teams);
    const open = vs.length ? await q<any[]>(db.from("version_comments").select("version_id,layer").eq("status", "open").in("version_id", vs.map((v) => v.id))) : [];
    const team = Object.fromEntries(ctx.seats.map((s) => [s.team_id, s.team]));
    return ps.map((p) => {
      const mine = vs.filter((v) => v.project_id === p.id), cur = mine.reduce((m, v) => Math.max(m, v.n), 0);
      const curId = mine.find((v) => v.n === cur)?.id, here = open.filter((o) => o.version_id === curId), openCur = here.filter((o) => o.layer !== "client").length, openCl = here.length - openCur;
      return `• ${p.name} (${team[p.team_id]}) — ${placeOf(tree, p)}\n  id ${p.id} · ${catsText(catsOf(tree, p))}\n  copy: ${verText(cvs.filter((v) => v.project_id === p.id), p.final_copy)} · design: ${cur ? `v${cur} is current${p.final_design && mine.some((v) => v.id === p.final_design) ? ` (v${mine.find((v) => v.id === p.final_design).n} final)` : ""}, ${openCur} open team comment${openCur === 1 ? "" : "s"}${openCl ? ` and ${openCl} from the review link` : ""} on it` : "none yet"} · changed ${ago(p.changed_at)}${p.due_day ? ` · deadline ${p.due_day}` : ""}${mine.some((v) => v.share_on) ? ` · review link on for design ${mine.filter((v) => v.share_on).sort((x, y) => x.n - y.n).map((v) => "v" + v.n).join(", ")}` : ""}`;
    }).join("\n");
  }

  if (name === "list_clients") {
    const teams = ctx.seats.map((s) => s.team_id), t = await treeOf(teams);
    const ps = await q<any[]>(db.from("projects").select("id,team_id,folder_id").in("team_id", teams));
    const fs = Object.values(t.folders) as any[], byName = (x: any, y: any) => x.name.localeCompare(y.name);
    const under = (id: string): number => ps.filter((p) => p.folder_id === id).length + fs.filter((f) => f.parent_id === id).reduce((n, f) => n + under(f.id), 0);
    const walk = (f: any, d: number): string[] => [
      `${"  ".repeat(d + 1)}${d ? "▸" : "•"} ${f.name}${d ? "" : ` — ${catsText(catList(t, f.cats || []))}`} — ${under(f.id)} page${under(f.id) === 1 ? "" : "s"}`,
      ...fs.filter((k) => k.parent_id === f.id).sort(byName).flatMap((k) => walk(k, d + 1)),
    ];
    const out: string[] = [];
    for (const s of ctx.seats) {
      const lists = t.lists.filter((c) => c.team_id === s.team_id && !c.parent_id), tops = fs.filter((f) => f.team_id === s.team_id && !f.parent_id).sort(byName);
      const loose = ps.filter((p) => p.team_id === s.team_id && !p.folder_id).length;
      out.push(`Team ${s.team}`,
        lists.length ? "Categories:\n" + lists.map((g) => `  ${g.name} (for ${g.level === "client" ? "clients" : "pages"}): ${t.lists.filter((c) => c.parent_id === g.id).map((c) => c.name).join(", ") || "no choices yet"}`).join("\n") : "Categories: none yet.",
        tops.length ? "Clients:\n" + tops.flatMap((f) => walk(f, 0)).join("\n") : "Clients: none yet.",
        ...(loose ? [`Pages not in a client yet: ${loose}`] : []), "");
    }
    return out.join("\n").trim();
  }

  if (name === "find_pages") {
    const teams = ctx.seats.map((s) => s.team_id), t = await treeOf(teams);
    const ps = await q<any[]>(db.from("projects").select("id,name,team_id,folder_id,cats,final_copy,final_design,changed_at").in("team_id", teams).order("changed_at", { ascending: false }));
    const ids = ps.map((p) => p.id);
    const [vs, cvs] = ids.length ? await Promise.all([
      q<any[]>(db.from("versions").select("id,project_id,n").in("project_id", ids)),
      q<any[]>(db.from("copy_versions").select("id,project_id,n").in("project_id", ids)),
    ]) : [[], []];
    const want = (Array.isArray(a?.category) ? a.category : a?.category ? [a.category] : []).map((x: unknown) => String(x).trim().toLowerCase()).filter(Boolean);
    const client = String(a?.client || "").trim().toLowerCase(), search = String(a?.search || "").trim().toLowerCase();
    const rows = ps.map((p) => ({ p, cats: catsOf(t, p), path: pathOf(t, p.folder_id), d: vs.filter((v) => v.project_id === p.id), c: cvs.filter((v) => v.project_id === p.id) }))
      .filter((r) => want.every((w: string) => r.cats.some((c) => c.name.toLowerCase() === w || `${c.list}: ${c.name}`.toLowerCase() === w)))
      .filter((r) => !client || (r.path[0] && r.path[0].name.toLowerCase().includes(client)))
      .filter((r) => !search || r.p.name.toLowerCase().includes(search))
      .filter((r) => a?.has === "final_copy" ? r.c.some((v) => v.id === r.p.final_copy) : a?.has === "final_design" ? r.d.some((v) => v.id === r.p.final_design) : a?.has === "copy" ? r.c.length > 0 : a?.has === "design" ? r.d.length > 0 : true);
    if (!rows.length) {
      const known = [...new Set((Object.values(t.item) as any[]).map((c) => c.name))];
      return `No pages match.${want.length && known.length ? ` The category choices in use are: ${known.join(", ")}.` : ""}`;
    }
    const lim = Math.max(1, Math.min(200, Math.round(Number(a?.limit)) || 50));
    return `${rows.length} page${rows.length === 1 ? "" : "s"}${rows.length > lim ? `, the ${lim} changed most recently` : ""}:\n` + rows.slice(0, lim).map((r) =>
      `• ${r.p.name} — ${placeOf(t, r.p)}\n  id ${r.p.id} · ${catsText(r.cats)}\n  copy: ${verText(r.c, r.p.final_copy)} · design: ${verText(r.d, r.p.final_design)} · changed ${ago(r.p.changed_at)}`).join("\n");
  }

  const p = await findProject(ctx, a?.project);
  const seat = seatFor(ctx, p.team_id);

  if (name === "get_copy") {
    const cs = await copyOf(p.id), v = pickCopy(p, cs, a?.version), people = await peopleOf(p.team_id), t = await treeOf([p.team_id]);
    const mode = a?.comments === "all" || a?.comments === "none" ? a.comments : "open";
    const cms = mode === "none" ? [] : (await copyCommentsOf([v.id])).filter((c) => mode === "all" || c.status === "open" || (c.status === "accepted" && !c.applied_in));
    const cur = cs[cs.length - 1], fin = cs.find((c) => c.id === p.final_copy);
    const head = [
      `Page: ${p.name} — ${placeOf(t, p)} · ${catsText(catsOf(t, p))}`,
      `Copy v${v.n} of ${cs.length}${v.id === cur.id ? " (latest)" : ` (older: v${cur.n} is the latest)`}${fin ? (fin.id === v.id ? " · marked final" : ` · v${fin.n} is marked final`) : ""} · ${srcText(v)} · ${ago(v.created_at)} by ${people[v.created_by] || "someone"} · ${wordsIn(v.body)} words${projLink(p.id) ? ` · ${projLink(p.id)}` : ""}`,
    ];
    const group = (label: string, list: any[]) => (list.length ? `${label} (${list.length}):\n\n${list.map((c) => copyCommentText(c, people)).join("\n\n")}` : "");
    const cmText = mode === "none" ? "" : !cms.length ? `Nothing ${mode === "all" ? "" : "open "}on copy v${v.n}.` : [
      group(`Team comments and suggestions on copy v${v.n}, internal`, cms.filter((c) => c.layer !== "client")),
      group(`Review link comments and suggestions on copy v${v.n}, visible on the link`, cms.filter((c) => c.layer === "client")),
    ].filter(Boolean).join("\n\n");
    return [{ type: "text", text: [...head, "", cmText].join("\n").trim() }, { type: "text", text: `=== Copy v${v.n} of ${p.name}, in Markdown ===\n${htmlToMarkdown(DOC, v.body)}` }];
  }

  if (name === "get_page_history") {
    const people = await peopleOf(p.team_id), t = await treeOf([p.team_id]);
    const [cs, vs] = await Promise.all([copyOf(p.id), versionsOf(p.id)]);
    const ccm = await copyCommentsOf(cs.map((c) => c.id));
    const dcm = vs.length ? await q<any[]>(db.from("version_comments").select("*").in("version_id", vs.map((v) => v.id)).order("n")) : [];
    const dre = dcm.length ? await q<any[]>(db.from("version_replies").select("*").in("comment_id", dcm.map((c) => c.id)).order("created_at")) : [];
    const fc = cs.find((c) => c.id === p.final_copy), fd = vs.find((v) => v.id === p.final_design);
    const out = [
      `Page: ${p.name} — ${placeOf(t, p)} · ${catsText(catsOf(t, p))}${projLink(p.id) ? ` · ${projLink(p.id)}` : ""}`,
      `Final copy: ${fc ? "v" + fc.n : "none marked"} · Final design: ${fd ? "v" + fd.n : "none marked"} · Last change ${ago(p.changed_at)}`,
      "", cs.length ? `Copy, ${cs.length} version${cs.length === 1 ? "" : "s"}:` : "Copy: none yet.",
    ];
    for (const v of cs) {
      out.push(`  v${v.n} · ${srcText(v)} · ${ago(v.created_at)} by ${people[v.created_by] || "someone"} · ${wordsIn(v.body)} words${v.id === p.final_copy ? " · final" : ""}`);
      for (const c of ccm.filter((x) => x.copy_version_id === v.id)) out.push(copyCommentText(c, people).split("\n").map((l) => "    " + l).join("\n"));
    }
    out.push("", vs.length ? `Design, ${vs.length} version${vs.length === 1 ? "" : "s"}:` : "Design: none yet.");
    for (const v of vs) {
      const mine = dcm.filter((c) => c.version_id === v.id);
      out.push(`  v${v.n} · ${v.name} · ${ago(v.created_at)} by ${people[v.created_by] || "someone"} · ${mine.length} comment${mine.length === 1 ? "" : "s"}, ${mine.filter((c) => c.status === "open").length} open${v.id === p.final_design ? " · final" : ""}`);
      for (const c of mine) {
        out.push(`    ${tag(c)} · ${c.status} · ${author(people, c)}${c.layer === "client" ? " · on the review link" : ""} · at ${WIDTH[c.dev] || "desktop (1280px)"}${c.from_version ? ` · carried over from ${c.from_version}` : ""}: "${c.body}"`);
        for (const r of dre.filter((x) => x.comment_id === c.id)) out.push(`      ↳ ${author(people, r)}: "${r.body}"`);
      }
    }
    return out.join("\n");
  }

  if (name === "upload_copy_version") {
    const md = String(a?.markdown ?? "");
    if (!md.trim()) throw new Oops("markdown is empty.");
    if (md.length > 400000) throw new Oops("That is over 400,000 characters. Send the copy on its own.");
    const body = String(await marked.parse(md, { gfm: true }));
    const cs = await copyOf(p.id), prev = cs[cs.length - 1] || null, n = (prev?.n || 0) + 1;
    await q(db.from("copy_versions").insert({ id: crypto.randomUUID(), project_id: p.id, team_id: p.team_id, n, body, src: "Claude", created_by: seat.member_id }));
    await q(db.from("projects").update({ changed_at: new Date().toISOString(), changed_by: seat.member_id, changed_guest: null }).eq("id", p.id));
    let note = "";
    if (prev) {
      // accepted wording that is now in the copy went into this version; a removal counts once its words are gone
      const text = htmlToText(DOC, body).toLowerCase(), norm = (x: string) => String(x || "").replace(/\s+/g, " ").trim().toLowerCase();
      const acc = await q<any[]>(db.from("copy_comments").select("id,n,layer,quote,replacement").eq("copy_version_id", prev.id).eq("status", "accepted").is("applied_in", null));
      const done = acc.filter((c) => (c.replacement ? text.includes(norm(c.replacement)) : !text.includes(norm(c.quote)))), left = acc.filter((c) => !done.includes(c));
      if (done.length) { await q(db.from("copy_comments").update({ applied_in: n }).in("id", done.map((c) => c.id))); note += ` Accepted suggestion${done.length === 1 ? "" : "s"} ${done.map(tag).join(", ")} marked as gone into v${n}.`; }
      if (left.length) note += ` Accepted wording not found in it, still waiting: ${left.map(tag).join(", ")}.`;
      if (Array.isArray(a?.resolve) && a.resolve.length) note += "\n" + (await resolveCopy(p, prev, a.resolve, false, a?.reply, seat));
    }
    return `Added copy v${n} of ${p.name} (${wordsIn(body)} words).${prev ? ` In Noon, the Copy tab's Compare shows it against v${prev.n}.` : ""}${note}${projLink(p.id) ? ` ${projLink(p.id)}` : ""}`;
  }

  if (name === "get_project") {
    const vs = await versionsOf(p.id), people = await peopleOf(p.team_id);
    const cms = vs.length ? await q<any[]>(db.from("version_comments").select("version_id,status,layer").in("version_id", vs.map((v) => v.id))) : [];
    const who = await q<any[]>(db.from("project_assignees").select("member_id").eq("project_id", p.id));
    const t = await treeOf([p.team_id]), cs = await copyOf(p.id);
    return [
      `Page: ${p.name} (team ${seat.team}) — ${placeOf(t, p)}`,
      `id ${p.id}${projLink(p.id) ? ` · ${projLink(p.id)}` : ""}`,
      `Categories: ${catsText(catsOf(t, p))}`,
      `Copy: ${cs.length ? cs.map((c) => `v${c.n}${c.id === p.final_copy ? " (final)" : ""}`).join(", ") + " · read it with get_copy" : "none yet"}`,
      `Deadline: ${p.due_day || "none"} · Assigned to: ${who.map((w) => people[w.member_id]).filter(Boolean).join(", ") || "nobody"} · Review links on: ${[...vs.filter((v) => v.share_on).map((v) => "design v" + v.n), ...cs.filter((c) => c.share_on).map((c) => "copy v" + c.n)].join(", ") || "none"}`,
      `Last change ${ago(p.changed_at)}${p.changed_guest ? ` by ${p.changed_guest} (client)` : p.changed_by && people[p.changed_by] ? ` by ${people[p.changed_by]}` : ""}`,
      "",
      vs.length ? "Design versions (newest last):" : "No design versions yet.",
      ...vs.map((v) => {
        const mine = cms.filter((c) => c.version_id === v.id), o = mine.filter((c) => c.status === "open" && c.layer !== "client").length, oc = mine.filter((c) => c.status === "open" && c.layer === "client").length;
        return `  v${v.n}${v.id === p.final_design ? " (final)" : ""} · ${v.name} · ${size(v.size || 0)} · ${(v.assets || []).length} files alongside · ${ago(v.created_at)} by ${people[v.created_by] || "someone"} · ${o} open team, ${oc} open review link, ${mine.length - o - oc} resolved`;
      }),
    ].join("\n");
  }

  if (name === "get_version" || name === "get_comments") {
    const vs = await versionsOf(p.id), v = pickVersion(vs, a?.version), people = await peopleOf(p.team_id);
    const status = (name === "get_comments" ? a?.status : a?.comments) || "open";
    const cms = await commentsOf(v.id, status, a?.layer || "all");
    const cur = vs[vs.length - 1];
    const head = [
      `Project: ${p.name} · v${v.n} of ${vs.length}${v.id === cur.id ? " (latest)" : ` (older: v${cur.n} is the latest)`} · ${v.name}`,
      `Uploaded ${ago(v.created_at)} by ${people[v.created_by] || "someone"}${projLink(p.id) ? ` · ${projLink(p.id)}` : ""}`,
    ];
    const word = status === "all" ? "" : status + " ", team = cms.filter((c) => c.layer !== "client"), client = cms.filter((c) => c.layer === "client");
    const group = (label: string, list: any[]) => list.length ? `${label} (${list.length}):\n\n${list.map((c) => commentText(c, people)).join("\n\n")}` : `${label}: none.`;
    const cmText = !cms.length ? `No ${word}comments on v${v.n}.` : [
      a?.layer !== "client" ? group(`Team ${word}comments on v${v.n}, internal`, team) : "",
      a?.layer !== "team" ? group(`Review link ${word}comments on v${v.n}, visible on the link`, client) : "",
    ].filter(Boolean).join("\n\n");
    if (name === "get_comments") return [...head, "", cmText].join("\n");

    const dir = dirOf(v.path), assets: any[] = v.assets || [];
    const fileLines: string[] = [], extra: { type: string; text: string }[] = [];
    for (const f of assets) {
      const t = f.type || typeOf(f.path), rel = relTo(dir, f.path);
      fileLines.push(`  ${rel} · ${t} · ${size(f.size || 0)}`);
      if (!a?.include_files || !f.file) continue;
      if (isText(t) && (f.size || 0) <= 200 * 1024) {
        const b = await download(f.file);
        if (b) extra.push({ type: "text", text: `=== ${rel} ===\n${await b.text()}` });
      } else {
        const { data } = await db.storage.from(BUCKET).createSignedUrl(f.file, 3600);
        if (data?.signedUrl) fileLines[fileLines.length - 1] += ` · download for the next hour: ${data.signedUrl}`;
      }
    }
    const page = await download(v.file);
    const html = page ? await page.text() : null;
    const info = [
      ...head,
      `Page path in the project: ${v.path}. File paths below are relative to it.`,
      assets.length ? `Files that came with it (${assets.length}):\n${fileLines.join("\n")}` : "No other files came with it.",
      "",
      cmText,
    ].join("\n");
    return [
      { type: "text", text: info },
      { type: "text", text: html == null ? "The page file could not be read from storage." : `=== ${v.name} (full HTML of v${v.n}) ===\n${html.length > 1500000 ? html.slice(0, 1500000) + "\n<!-- cut: the page is over 1.5 MB -->" : html}` },
      ...extra,
    ];
  }

  if (name === "upload_version") {
    const html = String(a?.html ?? "");
    if (!html.trim()) throw new Oops("html is empty.");
    if (!/<html|<body|<!doctype/i.test(html)) throw new Oops("That does not look like a full HTML page. Send the whole document, from <!doctype html> to </html>.");
    const vs = await versionsOf(p.id), prev = vs[vs.length - 1] || null;
    const vid = crypto.randomUUID(), n = (prev?.n || 0) + 1;
    const fileName = normPath(String(a?.file_name || prev?.name || "index.html")).split("/").pop() || "index.html";
    const dir = prev ? dirOf(prev.path) : "", path = dir + fileName;
    const enc = new TextEncoder(), bytes = enc.encode(html);
    let total = bytes.length;
    const base = `${p.team_id}/${p.id}/${vid}/`;
    const up = async (rel: string, body: Uint8Array | string, type: string) => {
      const { error } = await db.storage.from(BUCKET).upload(base + rel, body, { upsert: true, contentType: type });
      if (error) throw new Error(`Could not store ${rel}: ${error.message}`);
      return base + rel;
    };
    const added: any[] = [];
    for (const f of Array.isArray(a?.files) ? a.files : []) {
      const rel = normPath(String(f?.path || ""));
      if (!rel) continue;
      const data = f.encoding === "base64" ? b64(String(f.content || "")) : enc.encode(String(f.content ?? ""));
      total += data.length;
      if (total > 20 * 1048576) throw new Oops("That is over 20 MB in one upload. Send fewer or smaller files.");
      const full = normPath(dir + rel), type = typeOf(full);
      added.push({ id: crypto.randomUUID(), path: full, size: data.length, type, file: await up(full, data, type) });
    }
    const file = await up(path, bytes, "text/html; charset=utf-8");
    const inherited: any[] = prev?.assets || [];
    const kept = inherited.filter((x) => !added.some((y) => y.path === x.path)), carried = kept.length;
    const assets = [...kept, ...added];
    await q(db.from("versions").insert({ id: vid, project_id: p.id, team_id: p.team_id, n, name: fileName, path, size: bytes.length, file, assets, created_by: seat.member_id }));
    await q(db.from("projects").update({ changed_at: new Date().toISOString(), changed_by: seat.member_id, changed_guest: null }).eq("id", p.id));
    let note = "";
    if (prev && Array.isArray(a?.resolve) && a.resolve.length) note = "\n" + (await resolve(p, prev, a.resolve, false, a?.reply, seat));
    return `Uploaded as v${n} of ${p.name} (${fileName}, ${size(bytes.length)}). It starts with no comments.` +
      `${added.length ? ` ${added.length} file${added.length === 1 ? "" : "s"} added or replaced.` : ""}${carried ? ` ${carried} file${carried === 1 ? "" : "s"} carried over from v${prev?.n}.` : ""}` +
      `${prev ? ` In Noon, open v${n} and choose Compare to see it next to v${prev.n}.` : ""}${projLink(p.id) ? ` ${projLink(p.id)}` : ""}${note}`;
  }

  if (name === "resolve_comments" && a?.part === "copy") {
    const cs = await copyOf(p.id), v = pickCopy(p, cs, a?.version);
    return await resolveCopy(p, v, a?.numbers || [], !!a?.reopen, a?.reply, seat);
  }
  if (name === "reply_to_comment" && a?.part === "copy") {
    const cs = await copyOf(p.id), v = pickCopy(p, cs, a?.version);
    const text = String(a?.text || "").trim();
    if (!text || text.length > 1000) throw new Oops("A reply is 1 to 1000 characters.");
    const ref = refOf(a?.number);
    if (!ref) throw new Oops("Say which comment: a number like 3 or #3 for a team comment, C2 for a review-link comment.");
    const c = (await q<any[]>(db.from("copy_comments").select("id,n,layer").eq("copy_version_id", v.id).eq("layer", ref.layer).eq("n", ref.n)))[0];
    if (!c) throw new Oops(`There is no comment ${ref.layer === "client" ? "C" : "#"}${ref.n} on copy v${v.n}.`);
    await q(db.from("copy_replies").insert({ id: crypto.randomUUID(), comment_id: c.id, team_id: p.team_id, author_id: seat.member_id, body: text }));
    await q(db.from("projects").update({ changed_at: new Date().toISOString(), changed_by: seat.member_id, changed_guest: null }).eq("id", p.id));
    return `Replied on ${tag(c)} of copy v${v.n}${c.layer === "client" ? ". It shows on the review link" : ""}.`;
  }

  if (name === "resolve_comments") {
    const vs = await versionsOf(p.id), v = pickVersion(vs, a?.version);
    return await resolve(p, v, a?.numbers || [], !!a?.reopen, a?.reply, seat);
  }

  if (name === "reply_to_comment") {
    const vs = await versionsOf(p.id), v = pickVersion(vs, a?.version);
    const text = String(a?.text || "").trim();
    if (!text || text.length > 1000) throw new Oops("A reply is 1 to 1000 characters.");
    const ref = refOf(a?.number);
    if (!ref) throw new Oops("Say which comment: a number like 3 or #3 for a team comment, C2 for a review-link comment.");
    const c = (await q<any[]>(db.from("version_comments").select("id,n,layer").eq("version_id", v.id).eq("layer", ref.layer).eq("n", ref.n)))[0];
    if (!c) throw new Oops(`There is no comment ${ref.layer === "client" ? "C" : "#"}${ref.n} on v${v.n}.`);
    await q(db.from("version_replies").insert({ id: crypto.randomUUID(), comment_id: c.id, team_id: p.team_id, author_id: seat.member_id, body: text }));
    await q(db.from("projects").update({ changed_at: new Date().toISOString(), changed_by: seat.member_id, changed_guest: null }).eq("id", p.id));
    return `Replied on ${tag(c)} of v${v.n}${c.layer === "client" ? ". It shows on the review link" : ""}.`;
  }

  throw new Oops(`Unknown tool ${name}.`);
}

async function resolve(p: any, v: any, numbers: unknown[], reopen: boolean, reply: unknown, seat: Seat) {
  const refs = (numbers || []).map(refOf).filter(Boolean) as Ref[];
  if (!refs.length) throw new Oops("Say which comments: numbers or #3 for team comments, C2 for review-link comments.");
  const all = await q<any[]>(db.from("version_comments").select("id,n,layer").eq("version_id", v.id));
  const cms = all.filter((c) => refs.some((r) => r.n === c.n && r.layer === (c.layer === "client" ? "client" : "team")));
  const missing = refs.filter((r) => !cms.some((c) => c.n === r.n && (c.layer === "client" ? "client" : "team") === r.layer)).map((r) => (r.layer === "client" ? "C" : "#") + r.n);
  if (cms.length) {
    await q(db.from("version_comments").update({ status: reopen ? "open" : "resolved" }).in("id", cms.map((c) => c.id)));
    const text = String(reply || "").trim().slice(0, 1000);
    if (text) await q(db.from("version_replies").insert(cms.map((c) => ({ id: crypto.randomUUID(), comment_id: c.id, team_id: p.team_id, author_id: seat.member_id, body: text }))));
    await q(db.from("projects").update({ changed_at: new Date().toISOString(), changed_by: seat.member_id, changed_guest: null }).eq("id", p.id));
  }
  return `${cms.length ? `${reopen ? "Reopened" : "Resolved"} ${cms.map(tag).join(", ")} on v${v.n}${String(reply || "").trim() ? ", with your reply on each" : ""}.` : "Nothing changed."}${missing.length ? ` Not found on v${v.n}: ${missing.join(", ")}.` : ""}`;
}

// the same for comments and suggestions on a copy version
async function resolveCopy(p: any, v: any, numbers: unknown[], reopen: boolean, reply: unknown, seat: Seat) {
  const refs = (numbers || []).map(refOf).filter(Boolean) as Ref[];
  if (!refs.length) throw new Oops("Say which comments: numbers or #3 for team comments, C2 for review-link comments.");
  const all = await q<any[]>(db.from("copy_comments").select("id,n,layer").eq("copy_version_id", v.id));
  const cms = all.filter((c) => refs.some((r) => r.n === c.n && r.layer === (c.layer === "client" ? "client" : "team")));
  const missing = refs.filter((r) => !cms.some((c) => c.n === r.n && (c.layer === "client" ? "client" : "team") === r.layer)).map((r) => (r.layer === "client" ? "C" : "#") + r.n);
  if (cms.length) {
    await q(db.from("copy_comments").update({ status: reopen ? "open" : "resolved" }).in("id", cms.map((c) => c.id)));
    const text = String(reply || "").trim().slice(0, 1000);
    if (text) await q(db.from("copy_replies").insert(cms.map((c) => ({ id: crypto.randomUUID(), comment_id: c.id, team_id: p.team_id, author_id: seat.member_id, body: text }))));
    await q(db.from("projects").update({ changed_at: new Date().toISOString(), changed_by: seat.member_id, changed_guest: null }).eq("id", p.id));
  }
  return `${cms.length ? `${reopen ? "Reopened" : "Resolved"} ${cms.map(tag).join(", ")} on copy v${v.n}${String(reply || "").trim() ? ", with your reply on each" : ""}.` : "Nothing changed."}${missing.length ? ` Not found on copy v${v.n}: ${missing.join(", ")}.` : ""}`;
}

// ---------------------------------------------------------------- the MCP wire
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
async function handle(ctx: Ctx, m: any) {
  const id = m?.id ?? null, method = m?.method;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const bad = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });
  if (id === null || id === undefined) return null; // a notification: nothing to answer
  switch (method) {
    case "initialize": {
      const want = m.params?.protocolVersion;
      return ok({ protocolVersion: VERSIONS.includes(want) ? want : VERSIONS[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: "noon", title: "Noon", version: "1.1.0" }, instructions: INSTRUCTIONS });
    }
    case "ping": return ok({});
    case "tools/list": return ok({ tools: TOOLS });
    case "resources/list": return ok({ resources: [] });
    case "prompts/list": return ok({ prompts: [] });
    case "tools/call": {
      const name = m.params?.name, args = m.params?.arguments || {};
      if (!TOOLS.some((t) => t.name === name)) return bad(-32602, `Unknown tool ${name}`);
      try {
        const out = await callTool(ctx, name, args);
        return ok({ content: typeof out === "string" ? [{ type: "text", text: out }] : out });
      } catch (e) {
        const msg = e instanceof Oops ? e.message : `Something went wrong: ${(e as Error)?.message || e}`;
        if (!(e instanceof Oops)) console.error(name, e);
        return ok({ content: [{ type: "text", text: msg }], isError: true });
      }
    }
    default: return bad(-32601, `Method not found: ${method}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET") return new Response("Noon MCP server. Connect from Claude with your key from Noon › Settings › Claude.", { status: 405, headers: { ...CORS, Allow: "POST" } });
  if (req.method === "DELETE") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: CORS });
  const url = new URL(req.url), key = keyOf(req, url);
  const deny = (msg: string) => json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: msg } }, 401);
  if (!key) return deny("Missing key. Make one in Noon › Settings › Claude and send it as 'Authorization: Bearer noon_…'.");
  let ctx: Ctx | null;
  try { ctx = await whoIs(key); } catch (e) { console.error("auth", e); return json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Could not check the key right now." } }, 500); }
  if (!ctx) return deny("That key is not valid any more. Make a new one in Noon › Settings › Claude.");
  let body: any;
  try { body = await req.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handle(ctx!, m)))).filter(Boolean);
    return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
  }
  const out = await handle(ctx, body);
  return out ? json(out) : new Response(null, { status: 202, headers: CORS });
});
