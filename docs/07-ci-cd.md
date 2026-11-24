# Livraison et CI

Le check GitHub requis s’appelle `ci`. Il installe les dépendances avec `npm ci`, exécute lint, TypeScript, Vitest et le build, puis installe Bruin v0.11.832 après vérification SHA-256. Il valide et exécute le pipeline, réexporte les marts et compare le résultat au JSON versionné. [Workflow](../.github/workflows/ci.yml)

Chaque bloc est publié sur sa branche avec `scripts/new-branch.sh` et `scripts/ship.sh`. Le merge automatique par squash attend le check requis. Les quatre contrôles npm sont exécutés localement avant chaque push. [Guide de contribution](../AGENTS.md)

La démo de production est déployée depuis le contenu Git vérifié du projet. Les fonctions Node servent les routes API et le front Vite utilise les réécritures du SPA. Les accès fournisseurs restent dans l’environnement d’exécution. [Configuration](../vercel.json) · [Vérifications publiques](EVIDENCE.md#public-deployment)
