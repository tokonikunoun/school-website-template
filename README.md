# Nigerian School Website and Management System

A reusable website and school management system for Nigerian secondary schools, built with Next.js and Supabase. School-specific branding, academic settings, and content are configured in `config/school.config.ts`.

**Status:** Phase 1  
**Live demo:** (https://sch-website-template.vercel.app/) 
**Author and prompt engineer:** Tokoni Kunoun  
**AI-assisted development:** Vercel v0

## About the project

I developed the product concept, requirements, and phased prompt pack for this project, then used Vercel v0 to build and refine it in stages.

The aim is to give schools a configurable starting point for a public website and school management system. Each school can use its own code deployment and Supabase project. This is a template, not a hosted multi-school service.

The project is designed for Nigerian secondary schools. Using it in another country may require changes to grading, currency, terminology, and local requirements.

## Phase 1 features

- Public school website with pages for the school, academics, admissions, student life, news, events, gallery, staff, careers, results, and contact
- School branding and content configured through `config/school.config.ts`
- Supabase email and password authentication
- Role-based routing and permission-aware dashboard navigation
- Database schema, migrations, seed data, and row-level security
- Admin dashboard shell with live overview figures and placeholder pages for later modules

Some pages or workflows may be demonstrations or placeholders. Verify each feature in the code before using it with real school data.

## Roadmap

The prompt pack describes these later phases. They are planned work unless implemented in the current code.

| Phase | Planned work |
|---|---|
| 2 | Academic structure, classes, subjects, and student management |
| 3 | Assessments, results, and report cards |
| 4 | Fees, payments, receipts, and accounting |
| 5 | Staff, payroll, and leave |
| 6 | Parent and student portals, communication, and admissions workflows |
| 7 | CMS, optional modules, settings, and polish |

## Set up for a school

1. Edit `config/school.config.ts` with the school’s identity, contact details, colours, classes, subjects, fees, grading rules, and page content.
2. Replace the sample images in `public/images/`.
3. Create a **new Supabase project** for the school.
4. Configure the environment variables listed below.
5. Run the database setup:

   ```bash
   pnpm db:setup
