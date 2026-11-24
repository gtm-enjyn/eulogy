# Démarrage du projet Eulogy

Jules possède le dépôt, les blocs A–J, l’intégration et la soumission. Louis prépare le film et son lien de visionnage. [Plan](../PLAN.md)

Depuis la racine du dépôt, Node 22 et npm suffisent pour lancer la démo.

```sh
npm ci
npm run demo
```

Les quatre routes sont `/`, `/you`, `/lives` et `/chapel`. Le lien **Watch Louis’s lives** ouvre les données publiées. [Guide public](../README.md) · [Preuves](EVIDENCE.md)

Les clients réseau utilisent les noms définis dans `.env.example`. Les clés se configurent dans un fichier local ignoré par Git ou dans l’environnement du projet déployé. La simulation, les marts et les enregistrements audio de la démo sont lisibles sans clé. [Contrats sponsors](SPONSOR-CONTRACTS.md)
