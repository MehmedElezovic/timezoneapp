// Noon · the Claude connector. A remote MCP server (streamable HTTP, JSON responses) that lets Claude read a project's
// pages and comments, upload the next version, and resolve or answer comments, all as the person whose key it holds.
// Keys are made in Noon › Settings › Claude; only their SHA-256 lives in public.api_tokens. Claude sends the key as
// "Authorization: Bearer noon_…", or as the last part of the address for clients that cannot set headers.
// Deployed with verify_jwt off: this function checks the key itself, then works with the service role, and every
// query is limited to the teams that person sits in.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

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
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
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
  if (!r) throw new Oops("Say which project: its name, its id, or a Noon link to it.");
  const id = r.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const share = r.match(/[?&]share=([A-Za-z0-9_-]{20,64})/);
  let sel = db.from("projects").select("*").in("team_id", teams);
  if (id) sel = sel.eq("id", id[0].toLowerCase());
  else if (share) { // a client link opens one version; find the project it belongs to
    const sv = await q<any[]>(db.from("versions").select("project_id").eq("share_token", share[1]).in("team_id", teams));
    sel = sel.eq("id", sv[0]?.project_id ?? "00000000-0000-0000-0000-000000000000");
  }
  else sel = sel.ilike("name", `%${r.replace(/[\\%_]/g, (c) => "\\" + c)}%`);
  const found = await q<any[]>(sel);
  if (!found.length) throw new Oops(`No project matches "${r}". Call list_projects to see them all.`);
  if (found.length > 1) {
    const exact = found.filter((p) => p.name.toLowerCase() === r.toLowerCase());
    if (exact.length === 1) return exact[0];
    throw new Oops(`"${r}" matches ${found.length} projects: ${found.map((p) => `"${p.name}" (${p.id})`).join(", ")}. Pass the exact name or the id.`);
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
  row.guest_name ? `${row.guest_name} (client)` : (row.author_id && people[row.author_id]) || "Someone";
function commentText(c: any, people: Record<string, string>) {
  const lines = [
    `${tag(c)} · ${c.status} · ${author(people, c)}${c.layer === "client" ? " · on the client link" : ""} · left at ${WIDTH[c.dev] || "desktop (1280px)"} · ${ago(c.created_at)}${c.from_version ? ` · carried over from ${c.from_version}` : ""}`,
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

// ---------------------------------------------------------------- tools
const TOOLS = [
  {
    name: "list_projects",
    description: "List the Noon projects this person can see, newest change first: name, team, current version, open comments, deadline and when it last changed. Use it to find a project before reading it.",
    inputSchema: { type: "object", properties: { search: { type: "string", description: "Optional: only projects whose name contains this." } } },
  },
  {
    name: "get_project",
    description: "One project's overview: every version with its comment counts, the deadline, who it is assigned to, and whether a client link is on.",
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
        layer: { type: "string", enum: ["all", "team", "client"], description: "Team comments (left in Noon, numbered #1, #2…), client-link comments (C1, C2…), or both. Default: all." },
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
        resolve: { type: "array", items: { anyOf: [{ type: "number" }, { type: "string" }] }, description: "Comments to mark resolved on the version this one answers (the previous latest): team comments as numbers or \"#3\", client-link comments as \"C2\"." },
        reply: { type: "string", description: "Optional note posted as a reply on every comment you resolve, e.g. 'Done in v3: shortened the headline.'" },
      },
      required: ["project", "html"],
    },
  },
  {
    name: "resolve_comments",
    description: "Mark comments on a version as resolved (or reopen them), with an optional reply on each.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        version: { type: "number", description: "Leave out for the latest." },
        numbers: { type: "array", items: { anyOf: [{ type: "number" }, { type: "string" }] }, description: "Comments as shown in get_version: team comments as numbers or \"#3\", client-link comments as \"C2\"." },
        reopen: { type: "boolean", description: "Reopen instead of resolve. Default: false." },
        reply: { type: "string", description: "Optional reply posted on each of them." },
      },
      required: ["project", "numbers"],
    },
  },
  {
    name: "reply_to_comment",
    description: "Post a reply on one comment, as this person. Use it to ask a question or explain what changed.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        version: { type: "number", description: "Leave out for the latest." },
        number: { anyOf: [{ type: "number" }, { type: "string" }], description: "The comment: a number or \"#3\" for a team comment, \"C2\" for a client-link comment. Replies on client-link comments are visible to the client." },
        text: { type: "string" },
      },
      required: ["project", "number", "text"],
    },
  },
];

const INSTRUCTIONS = `Noon is a team planner with a Projects area where people review HTML pages. A project is a stack of versions (v1, v2, …); comments are pinned to elements of one version's page.
To apply feedback: get_version (latest version, open comments, full HTML) → edit the page so every open comment is handled → upload_version with the full new HTML, the comment numbers you handled in "resolve", and a short "reply" saying what you did. Comments come in two layers: the team's, left in Noon and numbered #1, #2…, and the client link's, numbered C1, C2…, which is the conversation the client sees on their review link. Treat both as feedback to apply. Anything you post on a client-link comment (a reply, or the reply note when resolving it) is visible to the client, so keep it client-friendly; team comments are internal. If a comment is unclear, ask with reply_to_comment instead of guessing.`;

async function callTool(ctx: Ctx, name: string, a: any): Promise<string | { type: string; text: string }[]> {
  if (name === "list_projects") {
    const teams = ctx.seats.map((s) => s.team_id);
    let sel = db.from("projects").select("id,name,team_id,due_day,changed_at,changed_by,changed_guest").in("team_id", teams).order("changed_at", { ascending: false });
    if (a?.search) sel = sel.ilike("name", `%${String(a.search).replace(/[\\%_]/g, (c) => "\\" + c)}%`);
    const ps = await q<any[]>(sel);
    if (!ps.length) return a?.search ? `No project name contains "${a.search}".` : "No projects yet.";
    const vs = await q<any[]>(db.from("versions").select("id,project_id,n,share_on").in("project_id", ps.map((p) => p.id)));
    const open = vs.length ? await q<any[]>(db.from("version_comments").select("version_id,layer").eq("status", "open").in("version_id", vs.map((v) => v.id))) : [];
    const team = Object.fromEntries(ctx.seats.map((s) => [s.team_id, s.team]));
    return ps.map((p) => {
      const mine = vs.filter((v) => v.project_id === p.id), cur = mine.reduce((m, v) => Math.max(m, v.n), 0);
      const curId = mine.find((v) => v.n === cur)?.id, here = open.filter((o) => o.version_id === curId), openCur = here.filter((o) => o.layer !== "client").length, openCl = here.length - openCur;
      return `• ${p.name} (${team[p.team_id]})\n  id ${p.id} · ${cur ? `v${cur} is current, ${openCur} open team comment${openCur === 1 ? "" : "s"}${openCl ? ` and ${openCl} from the client link` : ""} on it` : "no versions yet"} · changed ${ago(p.changed_at)}${p.due_day ? ` · deadline ${p.due_day}` : ""}${mine.some((v) => v.share_on) ? ` · client link on for ${mine.filter((v) => v.share_on).sort((x, y) => x.n - y.n).map((v) => "v" + v.n).join(", ")}` : ""}`;
    }).join("\n");
  }

  const p = await findProject(ctx, a?.project);
  const seat = seatFor(ctx, p.team_id);

  if (name === "get_project") {
    const vs = await versionsOf(p.id), people = await peopleOf(p.team_id);
    const cms = vs.length ? await q<any[]>(db.from("version_comments").select("version_id,status,layer").in("version_id", vs.map((v) => v.id))) : [];
    const who = await q<any[]>(db.from("project_assignees").select("member_id").eq("project_id", p.id));
    return [
      `Project: ${p.name} (team ${seat.team})`,
      `id ${p.id}${projLink(p.id) ? ` · ${projLink(p.id)}` : ""}`,
      `Deadline: ${p.due_day || "none"} · Assigned to: ${who.map((w) => people[w.member_id]).filter(Boolean).join(", ") || "nobody"} · Client links: ${vs.filter((v) => v.share_on).map((v) => "v" + v.n).join(", ") || "none"}`,
      `Last change ${ago(p.changed_at)}${p.changed_guest ? ` by ${p.changed_guest} (client)` : p.changed_by && people[p.changed_by] ? ` by ${people[p.changed_by]}` : ""}`,
      "",
      vs.length ? "Versions (newest last):" : "No versions yet.",
      ...vs.map((v) => {
        const mine = cms.filter((c) => c.version_id === v.id), o = mine.filter((c) => c.status === "open" && c.layer !== "client").length, oc = mine.filter((c) => c.status === "open" && c.layer === "client").length;
        return `  v${v.n} · ${v.name} · ${size(v.size || 0)} · ${(v.assets || []).length} files alongside · ${ago(v.created_at)} by ${people[v.created_by] || "someone"} · ${o} open team, ${oc} open client link, ${mine.length - o - oc} resolved`;
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
      a?.layer !== "team" ? group(`Client link ${word}comments on v${v.n}, visible to the client`, client) : "",
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

  if (name === "resolve_comments") {
    const vs = await versionsOf(p.id), v = pickVersion(vs, a?.version);
    return await resolve(p, v, a?.numbers || [], !!a?.reopen, a?.reply, seat);
  }

  if (name === "reply_to_comment") {
    const vs = await versionsOf(p.id), v = pickVersion(vs, a?.version);
    const text = String(a?.text || "").trim();
    if (!text || text.length > 1000) throw new Oops("A reply is 1 to 1000 characters.");
    const ref = refOf(a?.number);
    if (!ref) throw new Oops("Say which comment: a number like 3 or #3 for a team comment, C2 for a client-link comment.");
    const c = (await q<any[]>(db.from("version_comments").select("id,n,layer").eq("version_id", v.id).eq("layer", ref.layer).eq("n", ref.n)))[0];
    if (!c) throw new Oops(`There is no comment ${ref.layer === "client" ? "C" : "#"}${ref.n} on v${v.n}.`);
    await q(db.from("version_replies").insert({ id: crypto.randomUUID(), comment_id: c.id, team_id: p.team_id, author_id: seat.member_id, body: text }));
    await q(db.from("projects").update({ changed_at: new Date().toISOString(), changed_by: seat.member_id, changed_guest: null }).eq("id", p.id));
    return `Replied on ${tag(c)} of v${v.n}${c.layer === "client" ? ". The client sees it on their link" : ""}.`;
  }

  throw new Oops(`Unknown tool ${name}.`);
}

async function resolve(p: any, v: any, numbers: unknown[], reopen: boolean, reply: unknown, seat: Seat) {
  const refs = (numbers || []).map(refOf).filter(Boolean) as Ref[];
  if (!refs.length) throw new Oops("Say which comments: numbers or #3 for team comments, C2 for client-link comments.");
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
      return ok({ protocolVersion: VERSIONS.includes(want) ? want : VERSIONS[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: "noon", title: "Noon", version: "1.0.0" }, instructions: INSTRUCTIONS });
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
