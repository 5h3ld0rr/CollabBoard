# Git Backdate Commit Guide (PowerShell)

### 1. Commit with a Custom / Old Date

```powershell
$env:GIT_AUTHOR_DATE="2024-01-15 14:30:00"; $env:GIT_COMMITTER_DATE="2024-01-15 14:30:00"; git commit -m "Your commit message"
```

---

### 2. Reset Environment Variables

After committing, clear the environment variables so subsequent commits use the current date/time:

```powershell
$env:GIT_AUTHOR_DATE=$null; $env:GIT_COMMITTER_DATE=$null
```

*(Alternative)*
```powershell
Remove-Item Env:\GIT_AUTHOR_DATE, Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue
```

---

### 3. Verify the Commit Date

Check both the **AuthorDate** and **CommitDate**:

```powershell
git log -1 --format=fuller
```
