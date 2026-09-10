import type { Plugin } from "@opencode-ai/plugin"
import { execSync } from "node:child_process"

// Enforce "cannot" at the tool level instead of "please don't" in the prompt. Tune the patterns to your stack.
const BLOCKED_COMMANDS: RegExp[] = [
  /\bgit\s+(reset\s+--hard\b|clean\s+-\w*f\w*|checkout\s+--\s+\.(\s|$)|branch\s+(-D\b|-f\b|--force\b))/,
  /\bgit\s+switch\b[^|;&]*(\s-[a-zA-Z]*[Cf][a-zA-Z]*\b|--force(-create)?\b|--discard-changes\b)/, // the lead creates plan branches itself; never force-switch
  /\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(\/|~|\.\.)/i,
  /\bRemove-Item\b[^|;]*-Recurse/i,
  /\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\b(kubectl|helm|terraform|aws|gcloud|az)\s+\S*\s*(apply|delete|destroy|rm)\b/i,
]
const SECRET_PATHS =
  /(^|[\\/])(\.env(\.(?!example$)[^/\\]*)?|[^/\\]*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^/\\]*)$/i

export const Guardrails: Plugin = async ({ directory }) => ({
  "tool.execute.before": async (input, output) => {
    if (input.tool === "bash") {
      const cmd = String(output.args?.command ?? "")
      if (BLOCKED_COMMANDS.some((re) => re.test(cmd))) throw new Error(`[guardrail] blocked command: ${cmd}`)

      // Push policy: feature-branch pushes allowed; force push and direct push to main/master blocked (merge via PR only)
      if (/\bgit\s+push\b/.test(cmd)) {
        const force = /(--force\b|--force-with-lease\b|\s-f\b|\s\+\S)/.test(cmd)
        const toMain = /(\s|:)(main|master)(\s|$)/.test(cmd)
        let onMain = false
        if (!/\bgit\s+push\b[^|;&]*\s\S+\s+\S+/.test(cmd)) {
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
