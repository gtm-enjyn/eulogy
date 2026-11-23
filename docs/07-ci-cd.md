# CI/CD

- GitHub Actions `.github/workflows/ci.yml`, job unique requis `ci` : `npm ci`, lint, typecheck, vitest, build, puis `bruin validate bruin/eulogy` si le pipeline existe.
- Protection de `main` posée par `scripts/setup-github.sh` : PR obligatoire, check `ci` requis, auto-merge activé, suppression de branche après merge.
- Les agents livrent avec `scripts/ship.sh "<msg>"` : commit, push, PR, `gh pr merge --auto --squash`. Quand `ci` est vert, ça merge seul.
- Vercel : `vercel link` une fois sur le repo (Louis), intégration GitHub → preview par PR, production sur `main`. Variables d'env posées dans le dashboard Vercel (mêmes noms que `.env.example`).
- Interdit : `--no-verify`, `git push --force` sur main, commit direct sur main.
