import type { Plugin } from "@opencode-ai/plugin"
import { execSync } from "node:child_process"

// Enforce "cannot" at the tool level instead of "please don't" in the prompt. Tune the patterns to your stack.
// Shell-level destructive patterns. Each is matched against the whole command line.
const BLOCKED_COMMANDS: RegExp[] = [
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\b[^|;&]*\s(-[a-zA-Z]*f[a-zA-Z]*|--force)\b/, // -f, -fd, -xf, --force
  /\bgit\s+(checkout|restore)\b[^|;&]*\s(--\s+)?\.(\s|$)/, // checkout -- . / checkout . / restore .
  /\bgit\s+branch\b[^|;&]*\s(-[a-zA-Z]*[Df][a-zA-Z]*|--force)\b/, // -D, -df, -d -f, --delete --force (plain -d stays allowed)
  /\bgit\s+switch\b[^|;&]*(\s-[a-zA-Z]*[Cf][a-zA-Z]*\b|--force(-create)?\b|--discard-changes\b)/, // the lead creates plan branches itself; never force-switch
  /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\b(kubectl|helm|terraform|aws|gcloud|az)\s+\S*\s*(apply|delete|destroy|rm)\b/i,
]
// rm / Remove-Item: recursive delete whose target is a root-like path (/, ~, .., $HOME, a drive root, . or *).
const ROOTISH = /^(\/|~|\.\.(\/|\\|$)|\.$|\*|\$HOME\b|\$\{HOME\}|\$env:USERPROFILE\b|\$env:HOMEPATH\b|[A-Za-z]:[\\/]?$|\\\\)/
function recursiveDeleteOfRoot(cmd: string): boolean {
  for (const seg of cmd.split(/\|\||&&|[|;\n]/)) {
    const m = /(^|\s)(sudo\s+)?(rm|Remove-Item|ri|rmdir|rd|del|erase)\s+(.*)$/i.exec(seg.trim())
    if (!m) continue
    const toks = m[4].split(/\s+/).map((t) => t.replace(/^["']|["']$/g, ""))
    const recursive = toks.some((t) => /^-[a-zA-Z]*[rR]/.test(t) || /^--recursive$/.test(t) || /^-rec/i.test(t))
    const targets = toks.filter((t) => !t.startsWith("-"))
    if (recursive && targets.some((t) => ROOTISH.test(t))) return true
  }
  return false
}
const SECRET_PATHS =
  /(^|[\\/])(\.env(\.(?!example$)[^/\\]*)?|[^/\\]*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^/\\]*)$/i
// The same files read through the shell: only commands that print file contents are blocked (cp/mv/ls/source stay allowed).
const READERS = /^(cat|head|tail|less|more|bat|type|strings|xxd|od|base64|Get-Content|gc|Select-String|sls|grep|rg|awk|sed|cut)\b/i
const SECRET_TOKEN = /(^|[\s"'=\/\\])(\.env(\.(?!example\b)[^\s\/\\"']*)?|[^\s\/\\"']*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^\s\/\\"']*)(?=$|[\s"';|&)])/i
function readsSecret(cmd: string): boolean {
  return cmd.split(/\|\||&&|[|;\n]/).some((seg) => READERS.test(seg.trim()) && SECRET_TOKEN.test(seg))
}

export const Guardrails: Plugin = async ({ directory }) => ({
  "tool.execute.before": async (input, output) => {
    if (input.tool === "bash") {
      const cmd = String(output.args?.command ?? "")
      if (BLOCKED_COMMANDS.some((re) => re.test(cmd)) || recursiveDeleteOfRoot(cmd)) throw new Error(`[guardrail] blocked command: ${cmd}`)
      if (readsSecret(cmd)) throw new Error(`[guardrail] blocked: command reads a secret file: ${cmd}`)

      // Push policy: feature-branch pushes allowed; force push and direct push to main/master blocked (merge via PR only)
      if (/\bgit\s+push\b/.test(cmd)) {
        const force = /(--force\b|--force-with-lease\b|--force-if-includes\b|\s-[a-zA-Z]*f[a-zA-Z]*\b|\s\+\S)/.test(cmd)
        const toMain = /(\s|:)(refs\/heads\/)?(main|master)(\s|$)/.test(cmd)
        // Positional words after `git push`: [remote, refspec...]. No refspec, or a bare HEAD, pushes the current branch.
        const seg = cmd.slice(cmd.search(/\bgit\s+push\b/)).split(/\|\||&&|[|;\n]/)[0]
        const positional = seg.replace(/^git\s+push\s*/, "").split(/\s+/).filter((w) => w && !w.startsWith("-"))
        const refspecs = positional.slice(1)
        let onMain = false
        if (refspecs.length === 0 || refspecs.includes("HEAD")) {
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
  },
})
