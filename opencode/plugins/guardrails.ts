import type { Plugin } from "@opencode-ai/plugin"
import { execSync } from "node:child_process"

// Enforce "cannot" at the tool level instead of "please don't" in the prompt. Tune the patterns to your stack.
// Role scoping (lead, planner, reviewer, verifier) lives in each agent's permission block; this plugin holds the rules that
// hold for every role: destructive commands, secret files, gh api mutations and the push policy.
const CHAIN_SEP = /;|&&|\|\||\n/ // independent commands
const unq = (t: string) => t.replace(/^["'`]+|["'`]+$/g, "") // strip surrounding quotes
const words = (seg: string) => seg.trim().split(/\s+/).map(unq).filter(Boolean)
const stripEnv = (s: string) => s.trim().replace(/^(\w+=\S*\s+)+/, "") // VAR=value prefixes
const pipeline = (chain: string) => chain.split("|").map((s) => stripEnv(s)).filter(Boolean)

// Shell-level destructive patterns. Each is matched against the whole command line.
const BLOCKED_COMMANDS: RegExp[] = [
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\b[^|;&]*\s(-[a-zA-Z]*f[a-zA-Z]*|--force)\b/, // -f, -fd, -xf, --force
  /\bgit\s+(checkout|restore)\b[^|;&]*\s(--\s+)?["']?(\.|\.\/|:\/)["']?(\s|$)/, // checkout -- . / ./ / :/ (quoted too)
  /\bgit\s+branch\b[^|;&]*\s(-[a-zA-Z]*[Df][a-zA-Z]*|--force)\b/, // -D, -df, -d -f, --delete --force (plain -d stays allowed)
  /\bgit\s+switch\b[^|;&]*(\s-[a-zA-Z]*[Cf][a-zA-Z]*\b|--force(-create)?\b|--discard-changes\b)/, // the lead creates plan branches itself; never force-switch
  /\bgit\s+stash\s+(drop|clear)\b/,
  /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\b(kubectl|helm|terraform|aws|gcloud|az)\s+\S*\s*(apply|delete|destroy|rm)\b/i,
]
// rm / Remove-Item / rd: recursive delete whose target is a root-like path (/, ~, .., $HOME, $PWD, a drive root, ., ./, ./*, :/, .git or *).
const ROOTISH = /^(\/|~|\.\.(\/|\\|$)|\.(\/\*?|\\\*?)?$|:\/$|\.git$|\*|\$HOME\b|\$\{HOME\}|\$PWD\b|\$\{PWD\}|\$env:USERPROFILE\b|\$env:HOMEPATH\b|[A-Za-z]:[\\/]?$|\\\\)/
function recursiveDeleteOfRoot(cmd: string): boolean {
  for (const seg of cmd.split(/\|\||&&|[|;\n]/)) {
    const m = /(^|\s)(sudo\s+)?(rm|Remove-Item|ri|rmdir|rd|del|erase)\s+(.*)$/i.exec(seg.trim())
    if (!m) continue
    const toks = m[4].split(/\s+/).map(unq)
    const recursive = toks.some((t) => /^-[a-zA-Z]*[rR]/.test(t) || /^--recursive$/.test(t) || /^-rec/i.test(t) || /^\/s$/i.test(t))
    const targets = toks.filter((t) => !t.startsWith("-") && !/^\/[sq]$/i.test(t))
    if (recursive && targets.some((t) => ROOTISH.test(t))) return true
  }
  return false
}
const SECRET_PATHS =
  /(^|[\\/])(\.env(rc|\.(?!example$)[^/\\]*)?|[^/\\]*\.(pem|key|p12|pfx|jks|keystore|ppk|gpg|asc)|id_(rsa|dsa|ecdsa|ed25519)[^/\\]*|credentials(\.json)?|\.netrc|\.npmrc|\.pypirc|\.git-credentials)$/i
// The same files named in a shell command. A command is blocked when, within one pipeline, a program that prints or evaluates
// files appears anywhere (also behind sudo, xargs, find -exec, $( ) or a path like /bin/cat) and a secret file is named.
// cp/mv/ls/source stay allowed (worktrees copy .env on purpose); a program that opens the file without naming it is not caught.
const READER_WORDS = /^(cat|tac|head|tail|less|more|bat|type|strings|xxd|od|base64|sort|uniq|nl|Get-Content|gc|Select-String|sls|grep|rg|awk|sed|cut|tee|openssl|git)$/i
const EVAL_FLAGS = /^(-e|--eval|-p|--print|-c)$/
const INTERPRETERS = /^(node|deno|bun|python|python3|ruby|perl|php)$/i
const SECRET_TOKEN = /(^|[\s"'`=\/\\:<(])(\.env(rc|\.(?!example\b)[^\s\/\\"'`]*|\*)?|[^\s\/\\"'`]*\.(pem|key|p12|pfx|jks|keystore|ppk|gpg|asc)|id_(rsa|dsa|ecdsa|ed25519)[^\s\/\\"'`]*|credentials(\.json)?|\.netrc|\.npmrc|\.pypirc|\.git-credentials)(?=$|[\s"'`;|&)*])/i
function readsSecret(cmd: string): boolean {
  for (const chain of cmd.split(CHAIN_SEP)) {
    const segs = pipeline(chain)
    if (!segs.some((s) => SECRET_TOKEN.test(s))) continue
    const reader = segs.some((s) => {
      const w = words(s).map((t) => t.replace(/^\$?\(|^\{|^`/, "").replace(/^.*[\\/](?=[^\\/]+$)/, ""))
      return w.some((t, i) => READER_WORDS.test(t) || (INTERPRETERS.test(t) && w.slice(i + 1).some((f) => EVAL_FLAGS.test(f))))
    })
    if (reader) return true
  }
  return false
}
const GH_API_MUTATION = /\bgh\s+api\b[^|;&]*(\s(-X|--method)\s+(?!GET\b)\S+|\s(-f|-F|--field|--raw-field|--input)\b)/

export const Guardrails: Plugin = async ({ directory }) => ({
  "tool.execute.before": async (input, output) => {
    if (input.tool === "bash") {
      const cmd = String(output.args?.command ?? "")
      if (BLOCKED_COMMANDS.some((re) => re.test(cmd)) || recursiveDeleteOfRoot(cmd)) throw new Error(`[guardrail] blocked command: ${cmd}`)
      if (readsSecret(cmd)) throw new Error(`[guardrail] blocked: command reads a secret file: ${cmd}`)
      if (GH_API_MUTATION.test(cmd)) throw new Error(`[guardrail] blocked: gh api may only read (merges, branch protection and refs are changed by the CEO on GitHub): ${cmd}`)

      // Push policy: feature-branch pushes allowed; force push, mirror/all/delete pushes and any push to main/master blocked
      // (merge via PR only). Each `git push` segment is tokenised with quotes stripped.
      for (const chain of cmd.split(CHAIN_SEP))
        for (const seg of pipeline(chain)) {
          const w = words(seg)
          const gi = w.indexOf("git")
          if (gi < 0) continue
          let pi = gi + 1
          while (pi < w.length && w[pi].startsWith("-")) pi += /^-[cC]$/.test(w[pi]) ? 2 : 1 // global options: -c k=v, -C dir, --no-pager
          if (w[pi] !== "push") continue
          const args = w.slice(pi + 1)
          const flags = args.filter((a) => a.startsWith("-"))
          const pos = args.filter((a) => !a.startsWith("-"))
          const refspecs = pos.slice(1)
          const force =
            flags.some((f) => /^(--force|--force-with-lease(=.*)?|--force-if-includes|--mirror|--all|--delete|-d|--prune)$/.test(f) || /^-[a-zA-Z]*[fd][a-zA-Z]*$/.test(f)) ||
            refspecs.some((r) => r.startsWith("+"))
          const toMain = refspecs.some((r) => /^(main|master)$/i.test((r.includes(":") ? r.split(":").pop()! : r).replace(/^refs\/heads\//, "")))
          let onMain = false
          if (refspecs.length === 0 || refspecs.some((r) => /^HEAD$/.test(r))) {
            try {
              onMain = /^(main|master)$/.test(
                execSync("git rev-parse --abbrev-ref HEAD", { cwd: directory, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(),
              )
            } catch {}
          }
          if (force || toMain || onMain) throw new Error(`[guardrail] blocked push (force push and direct push to main are not allowed; merge via PR): ${cmd}`)
        }
    }
    if (input.tool === "read" || input.tool === "edit" || input.tool === "write") {
      const p = String(output.args?.filePath ?? "")
      if (SECRET_PATHS.test(p)) throw new Error(`[guardrail] blocked secret path: ${p}`)
    }
    if (input.tool === "grep") {
      const p = String(output.args?.path ?? "")
      const g = String(output.args?.include ?? "")
      if (SECRET_PATHS.test(p) || (g && SECRET_TOKEN.test(g))) throw new Error(`[guardrail] blocked: search inside a secret file: ${p || g}`)
    }
  },
})
