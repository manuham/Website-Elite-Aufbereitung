// `npm audit` with explicit, dated, justified exceptions.
//
//   node scripts/audit-gate.mjs
//
// Copied from HMMR's Agency-web (scripts/audit-gate.mjs) on 2026-10-22, after the php2shell
// alert: every live site HMMR runs gets the same weekly check. Only ACCEPTED differs.
//
// WHY NOT PLAIN `npm audit`: npm offers no way to say an advisory does not apply. A check
// that is always red is a check nobody reads — which is worse than no check, because the
// day a real advisory lands it looks exactly the same as the noise.
//
// So: every accepted advisory needs an ID, a reason, and a review date. Past the review
// date it fails again, on purpose — an exception nobody revisits is just a silenced alarm.
import { execSync } from 'node:child_process'

/**
 * @type {{ id: string, package: string, reason: string, reviewBy: string }[]}
 */
// 2026-10-22: GHSA-qwww-vcr4-c8h2 (react-router) left this list — fixed by 7.18.4.
const ACCEPTED = []

const today = new Date().toISOString().slice(0, 10)

let report
try {
  // --omit=dev: a lighthouse/puppeteer advisory cannot reach production. Non-zero exit is
  // normal when findings exist, so the output is parsed rather than the status trusted.
  // A fixed command string through the shell. execFileSync cannot spawn npm.cmd on
  // Windows without one (EINVAL on modern Node), and the usual objection to shells —
  // argument injection — does not apply to a constant with no interpolation.
  // maxBuffer: the JSON report is large on a big tree and the 1 MB default truncates it.
  report = JSON.parse(execSync('npm audit --omit=dev --json', { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }))
} catch (err) {
  const stdout = /** @type {any} */ (err).stdout
  if (!stdout) {
    console.error('✗ audit-gate: could not run npm audit')
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
  report = JSON.parse(stdout)
}

const SEVERITIES = ['high', 'critical']
const vulns = report.vulnerabilities ?? {}

/**
 * Resolve a package to the advisory IDs actually behind it.
 *
 * npm reports a transitive victim with `via: ['react-router']` — a package NAME, not an
 * advisory object — so a naive read finds no id and flags it as new. react-router-dom is
 * exactly that case: it is listed only because it depends on react-router. Following the
 * chain means one accepted advisory covers every package it propagates through, instead of
 * needing a second entry that says the same thing.
 *
 * @param {string} name
 * @param {Set<string>} [seen] cycle guard — npm's graph can be circular
 * @returns {{ids: Set<string>, title: string}}
 */
function rootAdvisories(name, seen = new Set()) {
  const ids = new Set()
  let title = ''
  if (seen.has(name)) return { ids, title }
  seen.add(name)
  for (const entry of vulns[name]?.via ?? []) {
    if (typeof entry === 'string') {
      const deeper = rootAdvisories(entry, seen)
      deeper.ids.forEach((id) => ids.add(id))
      title ||= deeper.title
    } else if (entry?.url) {
      ids.add(String(entry.url).split('/').pop())
      title ||= entry.title ?? ''
    }
  }
  return { ids, title }
}

/** @type {{name: string, severity: string, ids: string[], title: string}[]} */
const findings = []
for (const [name, v] of Object.entries(vulns)) {
  const vuln = /** @type {any} */ (v)
  if (!SEVERITIES.includes(vuln.severity)) continue
  const { ids, title } = rootAdvisories(name)
  findings.push({ name, severity: vuln.severity, ids: [...ids], title })
}

// An exception whose review date has passed stops being an exception.
const stale = ACCEPTED.filter((a) => a.reviewBy < today)
for (const a of stale) {
  console.error(`✗ accepted advisory ${a.id} (${a.package}) was due for review on ${a.reviewBy}`)
  console.error('  Re-check whether it still does not apply, then move the date or fix it.')
}

const acceptedIds = new Set(ACCEPTED.filter((a) => a.reviewBy >= today).map((a) => a.id))
const unexpected = findings.filter((f) => !f.ids.some((id) => acceptedIds.has(id)))

for (const f of findings) {
  const known = f.ids.some((id) => acceptedIds.has(id))
  console.log(`${known ? 'accepted' : 'NEW     '}  ${f.severity.padEnd(8)} ${f.name}  ${f.ids.join(', ')}`)
  if (!known && f.title) console.log(`          ${f.title}`)
}

if (stale.length || unexpected.length) {
  console.error('')
  if (unexpected.length) {
    console.error(`✗ audit-gate: ${unexpected.length} unreviewed high/critical advisory(ies) in production dependencies`)
    console.error('  Fix it, or add it to ACCEPTED in this file with a reason and a review date.')
  }
  process.exit(1)
}

console.log('')
console.log(
  `✓ audit-gate: no unreviewed high/critical advisories (${ACCEPTED.length} accepted, next review ${
    ACCEPTED.map((a) => a.reviewBy).sort()[0] ?? 'n/a'
  })`,
)
