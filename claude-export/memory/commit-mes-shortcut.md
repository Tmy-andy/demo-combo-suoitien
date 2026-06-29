---
name: commit-mes-shortcut
description: When user types '/commit mes', return exactly one commit message line — do not auto-commit
metadata:
  type: feedback
---

When the user sends `/commit mes`, reply with exactly ONE commit message line based on the chat history and the edits made — so they can copy and run the commit manually.

**Why:** The user wants to review and run the commit themselves, not have Claude execute it.

**How to apply:** Output a single commit message line only. Do NOT run `git commit`, `git add`, or any git command. Just the message text for them to copy.
