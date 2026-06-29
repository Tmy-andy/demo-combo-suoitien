---
name: no-auto-open-files
description: Do NOT auto-open files in the browser/IDE — user keeps a live preview running
metadata:
  type: feedback
---

Do not run commands that open files (e.g. `start "" file.html`, `open`, launching a browser) after edits.

**Why:** The user already keeps a live preview open (Live Server), so auto-opening spawns redundant windows.

**How to apply:** Just edit/save the files and tell the user to refresh. Never call `start`/`open` on project files in this workspace.
