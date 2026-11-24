#!/usr/bin/env node
// Creates (or updates) a login and assigns its role. Use it to create the first Super Admin.
//
//   pnpm user:create --email you@school.ng --password 'S3cure!pass' --role super_admin --name "Dr. A. Bello"
//   Optional: --staff STF/004      link to a staff record (teachers, bursar)
//             --guardian-of SCH/2026/0001   link a parent to a student's primary guardian
//             --force-change      require a password change on first login
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Never expose the service key to the browser.
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const file of ['.env.development.local', '.env.local', '.env']) {
  const path = join(root, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]])
    return pairs
  }, []),
)

const ROLES = ['super_admin', 'admin', 'bursar', 'teacher', 'parent', 'student']
if (!args.email || !args.password || !ROLES.includes(args.role)) {
  console.error(`Usage: --email <email> --password <password> --role <${ROLES.join('|')}> [--name "Full Name"]`)
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
let user = list?.users.find((u) => u.email?.toLowerCase() === args.email.toLowerCase())

if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: args.email,
    password: args.password,
    email_confirm: true,
    user_metadata: { full_name: args.name ?? args.email.split('@')[0] },
  })
  if (error) throw error
  user = data.user
  console.log(`✓ Created ${args.email}`)
} else {
  await supabase.auth.admin.updateUserById(user.id, { password: args.password })
  console.log(`• ${args.email} already exists — password updated`)
}

const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    email: args.email,
    full_name: args.name ?? user.user_metadata?.full_name ?? null,
    role: args.role,
    must_change_password: Boolean(args['force-change']),
  })
if (profileError) throw profileError

if (args.staff) {
  const { error } = await supabase.from('staff').update({ profile_id: user.id }).eq('staff_no', args.staff)
  if (error) throw error
  console.log(`✓ Linked to staff ${args.staff}`)
}

if (args['guardian-of']) {
  const { data: student } = await supabase.from('students').select('id').eq('admission_no', args['guardian-of']).single()
  const { data: link } = await supabase
    .from('student_guardians')
    .select('guardian_id')
    .eq('student_id', student?.id)
    .eq('is_primary', true)
    .single()
  if (!link) throw new Error('No primary guardian found for that student')
  const { error } = await supabase.from('guardians').update({ profile_id: user.id }).eq('id', link.guardian_id)
  if (error) throw error
  console.log(`✓ Linked as guardian of ${args['guardian-of']}`)
}

console.log(`✓ Role set to ${args.role}`)
