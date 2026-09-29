// guard — opencode 플러그인. 규칙은 .garagiste/scripts/guard-rules.mjs 하나(Claude 훅과 공유). task가 끝나면 더러운 worktree를 wip로 커밋한다.
import type { Plugin } from "@opencode-ai/plugin"
import fs from "node:fs"
import path from "node:path"
// @ts-ignore — 팀 정본은 JS 모듈이다
import { decide, makeCtx } from "../../.garagiste/scripts/guard-rules.mjs"
// @ts-ignore
import { checkpoint } from "../../.garagiste/scripts/checkpoint.mjs"

const TOOL: Record<string, string> = { bash: "Bash", edit: "Edit", write: "Write", patch: "Edit", multiedit: "MultiEdit" }

export const Guard: Plugin = async ({ directory }) => ({
  "tool.execute.before": async (input, output) => {
    const tool = TOOL[input.tool]
    if (!tool) return
    const args = (output.args ?? {}) as Record<string, unknown>
    const cwd = typeof args.workdir === "string" && args.workdir ? path.resolve(directory, args.workdir) : directory
    const ti = tool === "Bash" ? { command: String(args.command ?? "") } : { file_path: String(args.filePath ?? args.path ?? "") }
    const reason = decide({ tool_name: tool, tool_input: ti, cwd }, makeCtx(directory, { cwd, env: process.env, fs }))
    if (reason) throw new Error(`[guard] ${reason}`)
  },
  "tool.execute.after": async (input) => {
    if (input.tool === "task") checkpoint(directory)
  },
})
