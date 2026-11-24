# Nigerian School Website and Management System

A reusable website and school management system for Nigerian secondary schools, built with Next.js and Supabase. School-specific branding, academic settings, and content are configured through `config/school.config.ts`.

**Status:** Phase 1  
**Live demo:** https://sch-website-template.vercel.app/ ]  
**Author and prompt engineer:** Tokoni Kunoun  
**AI-assisted development:** Vercel v0

## About the project

I developed the product concept, requirements, and phased prompt pack for this project, then used Vercel v0 to build and refine it through iterative prompts.

The goal is to give schools a configurable starting point for a public website and management system. Each school can use its own code deployment and Supabase project. This repository is a reusable template, not a shared hosted service for multiple schools.

The project is designed for Nigerian secondary schools. Schools in other countries may need changes to grading, currency, terminology, and local requirements.

## Phase 1 features

- Config-driven public website with pages for the school, academics, admissions, student life, news, events, gallery, staff, careers, results, and contact
- School identity, branding, academic settings, and page content managed through `config/school.config.ts`
- Supabase email and password authentication
- Forced password change on first login and password-reset flow
- Role-based routing for staff, parents, and students
- Admin dashboard shell with permission-aware navigation, live figures, and placeholder pages for later modules
- Initial database schema with 48 tables, migrations, seed data, row-level security, permission checks, and audit logging

Some pages and workflows may be scaffolds or demonstrations. Check the implementation before relying on features such as application processing, result checking, payments, or parent and student services with real school data.

## Roadmap

The prompt pack describes these later phases. They are planned work unless implemented in the current code.

| Phase | Planned work |
|---|---|
| 2 | Academic structure, classes, subjects, and student management |
| 3 | Assessments, results, and report cards |
| 4 | Fees, payments, receipts, and accounting |
| 5 | Staff, payroll, and leave |
| 6 | Parent and student portals, communication, and admissions workflows |
| 7 | CMS, optional modules, settings, and final polish |

## Set up for a school

1. Edit `config/school.config.ts` with the school’s name, motto, contact details, colours, classes, subjects, fees, grading rules, and page content.
2. Replace the sample images in `public/images/`, including the logo, hero image, principal image, and gallery images.
3. Create a **new Supabase project** for the school.
4. Configure the environment variables listed below in your local environment and Vercel project.
5. Apply the database migrations and sync the configuration:

   ```bash
   pnpm db:setup
   ```

6. To load sample data for development, run:

   ```bash
   pnpm db:seed
   ```

7. Create the first Super Admin account:

   ```bash
   pnpm user:create --email head@school.ng --password "<temporary-password>" --role super_admin --name "Head Teacher" --force-change
   ```

   Use a unique temporary password. Do not commit a real password to GitHub. The account should change it at first login.

8. Deploy to Vercel and add the production URL to Supabase Auth’s redirect URLs.

Use a separate Supabase project and deployment for each school.

## Environment variables

Add these variables to your local environment and Vercel project. Do not commit secret values.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key for trusted server-side scripts |
| `POSTGRES_URL_NON_POOLING` | Direct database connection for setup scripts |

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or publish its value.

## Demo data

Demo accounts and sample records are for development only. Change or remove demo accounts before using a deployment with real school data. Do not publish working demo credentials for a live site.

## Project structure

```text
config/school.config.ts   School identity, academic settings, and content
db/migrations/            Database schema, functions, triggers, and policies
db/seed/                  Core roles, permissions, and sample data
scripts/                  Database setup and user-management scripts
app/(site)/               Public website
app/admin/                Staff dashboard
app/parent/               Parent portal routes
app/student/              Student portal routes
proxy.ts                  Session refresh and role-based routing
```

## Prompt engineering and authorship

The product concept, requirements, reusable configuration approach, and phased prompt pack were authored by **Tokoni Kunoun**. Vercel v0 was used to generate and refine the implementation through prompts that guided the project from its initial structure toward the planned modules.

The prompt pack can be included in this repository under `prompts/` so readers can review the project brief and development process.

## Licence

No licence for reuse has been selected yet. Please contact the author for permission to use or adapt this project.
