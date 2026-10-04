// guard — opencode 플러그인. 규칙은 .garagiste/scripts/guard-rules.mjs 하나(Claude 훅과 공유). task가 끝나면 더러운 worktree를 wip로 커밋한다.
import type { Plugin } from "@opencode-ai/plugin"
import fs from "node:fs"
import path from "node:path"
// @ts-ignore — 팀 정본은 JS 모듈이다
import { decide, makeCtx } from "../../.garagiste/scripts/guard-rules.mjs"
// @ts-ignore
import { spawnStop } from "../../.garagiste/scripts/checkpoint.mjs"

const TOOL: Record<string, string> = { bash: "Bash", edit: "Edit", write: "Write", patch: "Edit", multiedit: "MultiEdit" }

export const Guard: Plugin = async ({ directory }) => {
  // task의 after엔 인자가 없다 — before에서 callID로 subagent_type을 적어 두고 after에서 Claude SubagentStop의 agent_type과 같은 꼴로 넘긴다(5라운드 2026-10-04, Q9 패리티: 원장 spawn_stop에 팩 이름)
  const spawned = new Map<string, string>()
  return {
    "tool.execute.before": async (input, output) => {
      const args = (output.args ?? {}) as Record<string, unknown>
      if (input.tool === "task") { if (typeof args.subagent_type === "string") spawned.set(input.callID, args.subagent_type); return }
      const tool = TOOL[input.tool]
      if (!tool) return
      const cwd = typeof args.workdir === "string" && args.workdir ? path.resolve(directory, args.workdir) : directory
      const ti = tool === "Bash" ? { command: String(args.command ?? "") } : { file_path: String(args.filePath ?? args.path ?? "") }
      const reason = decide({ tool_name: tool, tool_input: ti, cwd }, makeCtx(directory, { cwd, env: process.env, fs }))
      if (reason) {
        // 가드 거부를 원장에 남긴다(Claude 훅과 같다 — 최선 노력)
        try {
          const team = JSON.parse(fs.readFileSync(path.join(directory, ".garagiste", "team.json"), "utf8").replace(/^﻿/, ""))
          const p = path.join(directory, team.paths?.ledger ?? ".garagiste/ledger/evidence.jsonl")
          fs.mkdirSync(path.dirname(p), { recursive: true })
          fs.appendFileSync(p, JSON.stringify({ ts: new Date().toISOString(), kind: "guard", tool, target: String((ti as Record<string, string>).file_path ?? (ti as Record<string, string>).command ?? "").slice(0, 1000), reason }) + "\n")
        } catch { /* 원장 없음 */ }
        throw new Error(`[guard] ${reason}`)
      }
    },
    "tool.execute.after": async (input) => {
      if (input.tool !== "task") return
      const agent_type = spawned.get(input.callID) ?? ""
      spawned.delete(input.callID)
      spawnStop(directory, { agent_type }) // 팩이면 원장 spawn_stop에 pack이 붙는다 — next의 「띄움」 셈이 Claude와 같다
    },
  }
}
