Generate a commit message for all staged and unstaged changes, commit them, and push to the remote.

## Steps

1. Run `git status` and `git diff` (including untracked files) to understand every change.
2. Run `git log --oneline -5` to match the existing commit message style in this repo.
3. Stage all changes: `git add -A`
4. Write a commit message that:
   - Follows Conventional Commits: `type(scope): short summary` on the first line
   - Types in use: `feat`, `fix`, `refactor`, `chore`
   - Keep the subject line under 72 characters
   - Add a short body (2–5 bullet points) if multiple distinct things changed
   - End with: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
5. Commit using a HEREDOC so formatting is preserved.
6. Push to the current branch's remote: `git push`
7. Report the commit hash and the GitHub push result.
