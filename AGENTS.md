# EULOGY — règles pour les agents (Claude Code et Codex)

Tu es un agent de code sur le projet **Eulogy**, hackathon Multiplayer AI, 23 nov 2026, San Francisco.
Deadline : **17h15 soumission** (repo public + vidéo). Il n'y a pas de "plus tard". Tout ce qui n'est pas dans PLAN.md n'existe pas.

## Lis dans cet ordre, à chaque session
1. `PLAN.md` : le graphe de blocs, qui fait quoi, les interfaces entre blocs, les critères de "fini".
2. La spec du bloc qu'on t'a donné dans `docs/`.
3. `packages/shared/src/index.ts` : les schémas zod. **C'est le contrat.** Jules est responsable des modifications et de leur compatibilité.

## Rôles
Jules est le seul développeur et possède les blocs A–J, L et M, du schéma partagé à la soumission. Louis possède le bloc K, capture et montage de la vidéo AdaL, et transmet son lien à Jules.

## Workflow git, sans exception
- Jamais de commit sur `main`. `scripts/new-branch.sh <bloc>-<courte-description>`.
- Petits commits, PR dès qu'une sous-tâche marche. `scripts/ship.sh "<message>"` fait add, commit, push, PR, et active l'auto-merge.
- La PR merge seule quand le check `ci` est vert (lint, typecheck, tests, build, bruin validate). Si `ci` est rouge, tu répares, tu ne contournes pas.
- Avant de pousser : `npm run lint && npm run typecheck && npm test && npm run build` en local. Pousser du rouge coûte 4 minutes à tout le monde.
- Conflit sur `main` : `git fetch && git rebase origin/main`, jamais de merge commit.

## Définition de "fini" pour un bloc
Un bloc est fini quand (1) ses critères d'acceptation dans PLAN.md sont cochés, (2) la CI est verte, (3) la PR est mergée, (4) l'interface promise (fichier, fonction, route, table) existe au chemin exact annoncé dans PLAN.md. Rien d'autre ne compte. Pas de "presque".

## Règles de code
- TypeScript strict, zod à toutes les frontières (fichiers, API, LLM). Un JSON du LLM qui ne passe pas le schéma est rejeté et redemandé une fois, puis remplacé par un fallback déterministe. Jamais de crash sur une sortie LLM.
- Pas de nouvelle dépendance lourde sans raison écrite dans la PR. Three.js via `@react-three/fiber` + `@react-three/drei` uniquement.
- Secrets : `.env` local, jamais commités. Les clés sponsors sont dans `.env.example` avec leur nom exact.
- Tout ce qui est montré à l'écran vient des données (`data/runs/*.jsonl` ou des marts Bruin). Aucun chiffre hardcodé dans l'UI, sauf les fixtures de dev clairement nommées `sample*`.
- Fallbacks obligatoires, dans cet ordre de préférence : la vraie feature → la version dégradée décrite dans la spec → la fixture. Une démo qui tourne moche bat une démo qui ne tourne pas.

## Français / anglais
Code, commits, noms de fichiers en anglais. Textes à l'écran en anglais (les juges sont anglophones). README, architecture, preuves et décisions en anglais.

## Quand tu es bloqué
Tu ne demandes pas à l'humain. Tu prends la version dégradée de la spec, tu la livres, tu écris "DEGRADED: <quoi>" dans le titre de la PR. L'humain décidera s'il faut remonter.
