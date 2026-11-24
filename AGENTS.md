# Eulogy · contribution au dépôt

## Responsabilités

Jules porte les blocs A–J, L et M, du contrat partagé à la soumission. Louis porte le bloc K, la capture et le montage de la vidéo. Le jalon du 23 novembre est fixé à 17h15 à San Francisco. Le gel des fonctionnalités est fixé à 16h30. [Plan](PLAN.md)

## Contrats

Le TypeScript est strict et les entrées HTTP, profils, runs et réponses du modèle sont validés avec Zod. Une réponse de chapitre invalide déclenche une relance, puis un repli déterministe. La provenance reste visible sur chaque chapitre. Les textes du produit et les documents publics sont en anglais. [Schémas](packages/shared/src/schemas.ts) · [Architecture](docs/ARCHITECTURE.md)

## Livraison

Une branche et une PR couvrent un bloc identifié. `scripts/new-branch.sh` crée la branche depuis `origin/main`. Avant chaque push, les contrôles locaux sont `npm run lint && npm run typecheck && npm test && npm run build`. `scripts/ship.sh` publie la branche, ouvre la PR et active son squash-merge à la réussite du check requis `ci`. Les conflits sont résolus par rebase sur `origin/main`. La branche principale reçoit les changements par PR.

Une intégration dégradée porte `DEGRADED` dans le titre de sa PR. Les valeurs affichées viennent d’un run, de son résumé ou des marts exportés. Les secrets locaux restent dans `.env`, exclu de Git. [Preuves](docs/EVIDENCE.md) · [CI](.github/workflows/ci.yml)

## Front officiel (décision de Louis, 23 nov 2026, 18h20)
Le front démo est `apps/web/src/v2/` (landing → /face → /voice → /simulate → /result), route `/` incluse. **Il ne se supprime pas et ne se remplace pas.** Les anciennes pages (`Intro`, `Onboarding`, `LivesGrid`) restent dans le repo mais ne sont plus routées, sauf `/chapel`. Toute PR qui retire `apps/web/src/v2` ou change la route `/` est refusée.
