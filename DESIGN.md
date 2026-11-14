# Noon design system (redesign, round 2)

This file is the spec that every later round and the port into the real app follow.

Three sources feed it:
- **Look:** Remote by Modula (remotebymodula.framer.website). The values below were measured from the site's computed styles on 2026-11-13.
- **Highlight colour:** StrikeFunnels (strikefunnels.com), `#c6f23e` with dark text. It replaces the template's lime and is the only accent colour.
- **Flow:** Attio, mapped to Noon's own objects: clients, folders, pages, copy, design, ads, tasks, people.

Light theme only for now. Dark mode gets its own round.

---

## 1. Tokens

### Colour
| Token | Value | Use |
|---|---|---|
| `--ink` | `#22242a` | Text, primary buttons, dark tags, checkboxes, client tiles, "online" blocks |
| `--slate` | `#415762` | Secondary text, labels inside filter pills, icons at rest |
| `--muted` | `#b3bdbd` | Placeholder, disabled, separators in text ("·") |
| `--line` | `#e5e6e6` | Hairlines between areas, outline buttons, inputs |
| `--surface` | `#f2f3f3` | Chips, pills, hover fill, card ring |
| `--soft` | `#f7f8f8` | Selected rows, panels, the app canvas behind cards |
| `--white` | `#ffffff` | Cards, main working area |
| `--hi` | `#c6f23e` | **The StrikeFunnels highlight.** The only accent. Rare on purpose (see §3). Text on it is always ink |
| `--red` / `--red-bg` | `#ee4444` / `#ee44441a` | Overdue, high priority, destructive actions, the "now" line |
| `--green` | `#37955b` | Done status, resolved, "Final" check glyph |

Never use purple or lavender (the old Noon accent), the template's lime `#e3ff8f`, or any colour outside this table.
Client artwork (design versions, ad creatives) keeps its own colours; it is content, not Noon UI.

### Type
- **Onest** 400 / 500 / 600 (Google Fonts) for everything. 500 is the default UI weight.
- **Numbers use Onest too**, with even-width figures (`font-variant-numeric: tabular-nums`): versions, counts, clock times, key hints. No monospace face anywhere in the UI (it read as retro and hard to read). The one exception is a terminal command shown as code.

| Role | Size / line | Tracking | Weight |
|---|---|---|---|
| Display (greeting, empty states, sign-in) | 32 / 35 | -0.02em | 500 |
| Page title | 23 / 30 | -0.01em | 500 |
| Body / UI | 14 / 20 | 0 | 400–500 |
| Copy documents | 16 / 28 | 0 | 400 (h1 30/36, h2 21/28 at 600) |
| Meta | 12 / 17 | 0 | 400–500 |
| Label (column heads, section heads) | 11–12, UPPERCASE | 0.06em | 500, slate |

### Shape and depth
- **Radius:** 50px for pills, chips and avatars; 16px for cards and panels; 12px for rows, menus and the peek's inner cards; 8px for buttons and inputs; 4px for tiny tags inside rows.
- **Ring:** `0 0 0 1px` at 6–8% ink on cards. No heavier borders on cards.
- **Pop shadow:** popovers, the palette and the peek use the reference's layered soft shadow:
  `0 0.6px 1.6px -1.5px rgba(0,0,0,.17), 0 2.3px 6px -3px rgba(0,0,0,.14), 0 10px 26px -4.5px rgba(0,0,0,.08)`, plus the 1px ring.
- **Spacing:** 4px base. Rows are 44–46px tall, with 2px of air between rows instead of gridlines.

### Icons
- Inline SVG line icons, 16–18px, 1.75 stroke, `currentColor`.
- No emoji. No icon fonts.

---

## 2. Components

- **Buttons.** Primary is an ink fill with white text and 8px radius, 34px tall. Secondary is white with a 1px `--line` border. Ghost is text only, with a surface fill on hover. Icon buttons are 32px squares.
- **Filter pill.** A surface pill reading `Label  Value ⌄`: the label in slate, the value in ink at 500. An active filter adds a ×, which is always visible. A selected quick filter (Tasks: Open, Due this week…) is an ink pill.
- **Status pill.** A surface pill with slate text: "2 open", "Rejected".
- **Tags.**
  - Ink tag (white text) = **Final**, **Approved**, **Owner**.
  - Highlight tag = **Needs you / For you / Draft** and open counts on your pages.
  - Red tag = overdue date, high priority.
  - Surface tag = categories, "Current", "Page task".
- **Page status icon** (16px circle): empty slate ring = **Scheduled**, half-filled ink = **In progress**, green disc with a tick = **Done**. See §4.
- **Avatar.** A 24px circle (28px large). Initials on a surface fill with a 1px `--line` ring; you are ink with white initials. Stacks sit 3px apart, as in the reference, with no overlap.
- **Client tile.** A 20–52px ink square with the client's initial in the highlight colour.
- **Checkbox.** 16px, 4px radius; checked is an ink fill with a white tick. Task checks are 18px circles that turn into the green Done disc.
- **Table row.** No gridlines. Hover = `--soft` fill, 12px radius. Selected = `--surface` fill. The checkbox shows on hover and stays once checked.
- **Panels.** White cards on the `--soft` canvas. The static dot texture (radial 1px `--line` dots every 16px) is only for stages (design viewer, copy paper, ads, sign-in art).
- **Side peek.** A floating card on the right (pages, tasks): ↑↓ to step, Esc to close, primary action at the top.
- **Comment card.** Number badge, avatar, name, time; the quoted text for copy comments; Reply on the left, Resolve / Accept / Decline on the right, always visible.

---

## 3. Highlighter rules (`--hi`, the StrikeFunnels highlight)

The highlight only means something if it stays rare. It has four jobs:
1. **Marker behind one word of a display heading.** A flat band over the lower part of the word, slightly rotated, with a little overhang. A hand-drawn underline stroke (SVG path) is the variant for empty states.
2. **"Needs you."** Open comments on pages assigned to you, your unread inbox count and dot, comments addressed to you ("For you").
3. **Changes and anchors in copy.** Text other people commented on (light tint; full colour when selected), the inserted words of a suggestion, and "added" words in See changes. Removed words are slate with a strike-through.
4. **Search matches** in ⌘K and the table search, and the "everyone online" band on the Team view.

Selected navigation is a white chip with a hairline ring on the soft sidebar, never highlighted.

---

## 4. Flow (Attio patterns, Noon objects)

| Attio | Noon |
|---|---|
| Workspace switcher | Team switcher (top of the sidebar) |
| Quick actions ⌘K | Palette: jump to a client, page or person; New page, New task, Upload, Share for review, go to any screen |
| Objects (Companies, People, Deals) | **Pages** (main), **Clients**, **Tasks**, **People** (Team) |
| Favorites in the sidebar | **Your pages**: pages assigned to you, In progress first (by deadline), then Scheduled; Done folds behind "Show done". Open counts in the highlight. Shows 8, then "All n of your pages" |
| Lists in the sidebar | **Projects** (one per client; the section header also opens the overview). One client row, same everywhere (sidebar and Projects table): the arrow expands it, the name opens the **client page** (`#client/<id>`, folders `#client/<id>/<folder>`), and an open client always ends with a **+ New page** row. The sidebar shows the 8 most recently active clients, then "All n projects" |
| Object table + saved views | **Projects** (the overview of every client and its pages, formerly "Pages"); main button **New project** (a new client folder). Views All pages / My pages / Needs you / Due soon; status icon in front of each name. With more than 12 clients the groups start collapsed; Group menu has Expand all / Collapse all |
| Filter and sort chips | Filter pills: Project, Page type, Assigned, + Status, Style, Audience; Sort: Last change / Deadline / Name |
| Group by | Group by project. Client pages show their own header, folder chips and a **New page** button instead |
| Bulk action bar | Floating ink bar: Move to…, Assign, Mark final, Delete |
| Record peek | Side peek: summary of a page; ↑↓ steps rows; Open page |
| Record page | Page: breadcrumb, title, quick actions; tabs Copy / Design / Ads / Activity; right rail **Details** (inline edit) |
| Comment threads | When a version is open, the right rail becomes **Comments** (Team / Review link layers) |
| Notifications | **Inbox**: For you / Everything / Done; list on the left, reply / accept / open on the right |
| Tasks | **Tasks**: one list, people on each row, grouped by due; filters; page tasks; Who sees it (Everyone / Only me and them / Everyone except…) |
| Settings | Its own section nav: Profile, Preferences, Notifications, Members, Categories, Claude connector |
| Toast + Undo | Every reversible action |

**Page status** is worked out, never set by hand: **Scheduled** = nothing uploaded yet; **Done** = every part that exists is marked final and no ad comments are open; everything else is **In progress**.

**Not taken from Attio:** spreadsheet gridlines, custom attributes or "add column", kanban, workflows and sequences, footer calculations.

---

## 5. Screens in the mockup

| Screen | Route |
|---|---|
| Projects (table, peek, bulk bar) | `#projects` |
| Client page / folder | `#client/dandy`, `#client/dandy/Advertorials` |
| Page · Design list / viewer / compare | `#page/<id>/design`, `…/design/v2` |
| Page · Copy list / reader / compare / editor | `#page/<id>/copy`, `…/copy/v3`, `…/copy/edit` |
| Page · Ads grid / viewer | `#page/<id>/ads`, `…/ads/15` |
| Page · Activity | `#page/<id>/activity` |
| Review link (what clients see) | `#review/<id>/design/v2`, `#review/<id>/copy/v3` |
| Inbox | `#inbox` |
| Tasks | `#tasks` |
| Team | `#team` |
| Settings | `#settings/<profile·prefs·notify·members·cats·claude>` |
| Sign in / first-run setup | `#signin`, `#welcome` |

---

## 6. Standing Noon rules
- **No horizontal scrolling, ever.** Tables pick the columns that fit the window and drop the least important first (Pages: Ads, Type, Client, Last change, Assigned; Tasks: Page, Assigned, Priority). Toolbars wrap to a second line instead of scrolling or clipping. Long names end in "…".
- No coloured left bars or edges on rows and cards. No dashed boxes. No emoji icons. No purple.
- Remove, ×, Approve/Reject and close buttons are always visible, never hover-only.
- Columns line up across rows and groups.
- Readable at a glance by a first-timer. Add concepts only when asked; flag anything new.
- Custom dropdowns (avatar + name where people are listed), never native `<select>`. Any dropdown with more than 10 choices gets a search box.
- One control per job, the same in every place it appears (client rows, New page). Built for ~100 clients: try `?clients=100`.

**Naming:** a client folder is called a **project** everywhere in the interface (sidebar section, filter, column, Details field, dialogs, Settings › Categories). "Client" only stays where it means the people outside the team (clients commenting on a review link).
