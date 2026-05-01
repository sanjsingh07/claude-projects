# Workflow Rules

## After Every Task
1. Update `report/changes.md` with:
   - What was changed and why
   - Summary of changes
   - Files modified
   - Date/time (use `date` command)
   - Keep formatting consistent (markdown)
   - Do NOT overwrite previous entries, always append
2. Stage all changes: `git add -A`
3. Write a descriptive commit message summarizing the task
4. Commit: `git commit -m "feat: <summary of what was done>"`

## Commit Message Format
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code restructuring
- `docs:` for documentation updates