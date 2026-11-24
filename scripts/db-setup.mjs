#!/usr/bin/env node
// Applies migrations in db/migrations, seeds roles/permissions, syncs grading and
// numbering from config/school.config.ts, and optionally loads demo data.
//
//   pnpm db:setup          # migrations + core seed + config sync
//   pnpm db:setup --demo   # ...plus the demo school
//
// Requires POSTGRES_URL_NON_POOLING (set automatically by the Supabase integration).
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

for (const file of ['.env.development.local', '.env.local', '.env']) {
  const path = join(root, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

const rawUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!rawUrl) {
  console.error('POSTGRES_URL_NON_POOLING is not set.')
  process.exit(1)
}
const url = new URL(rawUrl)
url.searchParams.delete('sslmode')
url.searchParams.delete('supa')

const { schoolConfig } = await import(join(root, 'config', 'school.config.ts'))
const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } })
await client.connect()

async function runFile(path) {
  await client.query(readFileSync(path, 'utf8'))
}

try {
  await client.query(`create schema if not exists app_private;
    revoke all on schema app_private from public;
    create table if not exists app_private.schema_migrations (name text primary key, applied_at timestamptz not null default now());`)

  const migrationsDir = join(root, 'db', 'migrations')
  const applied = new Set((await client.query('select name from app_private.schema_migrations')).rows.map((r) => r.name))
  for (const name of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(name)) continue
    console.log(`→ migration ${name}`)
    await runFile(join(migrationsDir, name))
    await client.query('insert into app_private.schema_migrations (name) values ($1)', [name])
  }

  console.log('→ core seed (roles & permissions)')
  await runFile(join(root, 'db', 'seed', 'core.sql'))

  console.log('→ syncing config/school.config.ts')
  await client.query('begin')
  const settings = {
    school_name: schoolConfig.name,
    admission_prefix: schoolConfig.numbering.admissionPrefix,
    receipt_prefix: schoolConfig.numbering.receiptPrefix,
    invoice_prefix: schoolConfig.numbering.invoicePrefix,
    application_prefix: schoolConfig.numbering.applicationPrefix,
    pass_mark: schoolConfig.assessment.passMark,
    currency: schoolConfig.currency.code,
  }
  for (const [key, value] of Object.entries(settings)) {
    await client.query(
      `insert into public.settings (key, value) values ($1, $2::jsonb)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [key, JSON.stringify(value)],
    )
  }

  const total = schoolConfig.assessment.components.reduce((sum, c) => sum + c.maxScore, 0)
  if (total !== 100) throw new Error(`Assessment components must total 100 (got ${total})`)
  for (const [index, c] of schoolConfig.assessment.components.entries()) {
    await client.query(
      `insert into public.assessment_components (key, name, max_score, is_exam, sort_order) values ($1,$2,$3,$4,$5)
       on conflict (key) do update set name = excluded.name, max_score = excluded.max_score,
         is_exam = excluded.is_exam, sort_order = excluded.sort_order`,
      [c.key, c.name, c.maxScore, c.isExam, index],
    )
  }

  await client.query('delete from public.grade_scales where not (grade = any($1::text[]))', [
    schoolConfig.gradingScale.map((g) => g.grade),
  ])
  for (const [index, g] of schoolConfig.gradingScale.entries()) {
    await client.query(
      `insert into public.grade_scales (grade, min_score, max_score, remark, is_pass, sort_order) values ($1,$2,$3,$4,$5,$6)
       on conflict (grade) do update set min_score = excluded.min_score, max_score = excluded.max_score,
         remark = excluded.remark, is_pass = excluded.is_pass, sort_order = excluded.sort_order`,
      [g.grade, g.min, g.max, g.remark, g.pass, index],
    )
  }
  await client.query('commit')

  if (process.argv.includes('--demo')) {
    console.log('→ demo school data')
    await runFile(join(root, 'db', 'seed', 'demo.sql'))
    await runFile(join(root, 'db', 'seed', 'demo_academics.sql'))
  }

  console.log('✓ Database ready')
} catch (error) {
  await client.query('rollback').catch(() => {})
  console.error('✗ Database setup failed:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
