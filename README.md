# School website and management system — template

A reusable Next.js + Supabase template for secondary schools. It serves a public school website, an admin dashboard, and parent and student portals.

Every school-specific value (name, logo, colours, contacts, social links, term dates and page text) lives in **one file**: `config/school.config.ts`. The template ships with clear placeholder values. Change them and the whole site updates.

---

## Features

- **Public website**: home, about, academics, admissions (online application and status check), student life, news, events, gallery, staff directory, careers, result checker (scratch-card PIN) and contact.
- **Auth and roles**: Supabase email and password sign-in, a forced password change on first login, password reset and role-based routing (staff → `/admin`, parent → `/parent`, student → `/student`).
- **Admin dashboard**: academics (sessions, terms, classes, subjects, teacher assignments) and students (profiles, guardians, photos, electives, bulk Excel/CSV import, CSV export, promotion and class history). Remaining modules show permission-gated placeholders.
- **Database**: row-level security on every table, permission checks through `has_permission()`, trigger-generated receipt, invoice and admission numbers, and an audit log for sensitive tables.

---

## Customising for your school

### 1. Edit the config file

Open `config/school.config.ts` and search for **`REPLACE`**. Each marked value needs your school's details.

| Section | What to change |
| --- | --- |
| **1. Identity** | `name`, `shortName`, `initials`, `motto`, `foundedYear`, `description`, `locale`, `address`, `phones`, `whatsapp`, `emails`, `social`, `mapEmbedUrl`, `officeHours` |
| **2. Branding** | `logo`, `favicon`, `heroImage`, `ogImage` and `colors` (`primary`, `secondary`, `accent`) |
| **3. Academics** | class levels, term names, curricula and departments |
| **4. Assessment** | CA and exam weights (must total 100), pass mark, promotion rules and grading scale |
| **5. Money and numbering** | currency, number prefixes (`SCH/2026/0001` etc.) and bank account details |
| **6. Features** | switch modules on or off (boarding, blog, gallery, online payments, portals and more) |
| **7. Website content** | hero text, principal's message, history, vision, mission, values, "why choose us", programmes, facilities, testimonials, admissions steps, fees overview and **term dates** (`website.calendar`) |

Tips:

- Keep the keys the same; only change the values.
- Money is written in **kobo** (the smallest currency unit): `₦10,000` = `1000000`.
- Set a social link to `''` to hide that icon.
- Set `website.stats.passRate` to `false` if you don't have a verified figure to publish.
- Reorder or remove entries in `website.homeSections` to change the home page.
- Never put secrets (API keys, database URLs) in this file. They belong in environment variables.

### 2. Replace the images

The template uses neutral placeholder images in `public/images/`. Replace them with your own photos, keeping the same filenames, or point the config at new paths.

| File | Used for | Recommended size |
| --- | --- | --- |
| `logo.png` | Header, footer, favicon, report cards | Square, 512×512, transparent PNG or SVG |
| `hero.png` | Home page banner and social preview | 1920×1080 landscape |
| `principal.png` | Principal's welcome | 800×1000 portrait |
| `gallery-*.png`, `news-*.png` | Gallery, news and inner-page banners | 1600×1067 landscape |

Use photos you own or have permission to publish, especially photos of students. Write meaningful alt text in the CMS for gallery and news images.

### 3. Check the colours

`branding.colors.primary` is used behind white text on buttons, so pick a colour dark enough for good contrast (a WCAG AA ratio of at least 4.5:1). `secondary` is the dark colour for the header, footer and admin sidebar. `accent` is used for highlights.

---

## Setting up and deploying

### Requirements

- Node.js 20+ and pnpm
- A Supabase project (free tier works for testing)
- A Vercel account

### Steps

1. **Create a Supabase project** and note its URL, anon key, service-role key and direct Postgres connection string.

2. **Set environment variables** (in Vercel under Project → Settings → Environment Variables, and in `.env.local` for local work):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   POSTGRES_URL_NON_POOLING=
   ```

   Connecting Supabase through the Vercel integration adds these automatically.

3. **Install and set up the database**:

   ```bash
   pnpm install
   pnpm db:setup     # migrations + syncs the config into settings, classes and subjects
   # or
   pnpm db:seed      # same, plus sample students, staff and news for a demo
   ```

   Run `pnpm db:setup` again whenever you change the name, prefixes, classes or grading in the config.

4. **Create the first Super Admin**:

   ```bash
   pnpm user:create --email head@yourschool.example --password 'Strong!Pass1' \
     --role super_admin --name "Head Teacher" --force-change
   ```

   Other roles: `admin`, `bursar`, `teacher`, `parent` (add `--guardian-of SCH/2026/0001`) and `student`.

5. **Run locally**: `pnpm dev`, then open `http://localhost:3000`.

6. **Deploy to Vercel**: push the repository to GitHub, import it in Vercel and add the environment variables. Then go to Supabase → Authentication → URL Configuration and add your production URL to the **Site URL** and **Redirect URLs** so password-reset emails work.

7. **Before going live**: remove any demo accounts and demo data, replace every `REPLACE` value, swap the placeholder images and check the site on a phone.

---

## Project layout

```
config/school.config.ts   school identity, branding and content (edit this)
public/images/            logo and photos (replace these)
db/migrations/            schema, functions, triggers and RLS
db/seed/                  core roles and permissions, optional demo data
scripts/                  db-setup, create-user
app/(site)/               public website
app/admin/                staff dashboard
app/parent, app/student   portals
proxy.ts                  session refresh and role routing
```

The service-role key is only used on the server and by the CLI scripts. It is never sent to the browser.
