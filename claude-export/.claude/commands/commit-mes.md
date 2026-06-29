---
description: Return exactly one commit message line based on chat history and edits — do not commit
---

Based on the recent chat history and the edits made in this session, output **exactly one** commit message line for the user to copy and run manually.

Rules:
- Output ONLY the single commit message line — no code fence is required, no explanation, no extra text before or after.
- Do NOT run `git add`, `git commit`, or any git command. The user runs it themselves.
- Use a concise Conventional Commits style (e.g. `feat(scope): ...`, `fix: ...`) describing the actual changes made.
