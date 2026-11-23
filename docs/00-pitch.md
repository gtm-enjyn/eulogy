# Eulogy — le pitch (à lire aux juges et sponsors)

**Une phrase.** Décris-toi en cinq lignes. On simule le reste de ta vie des dizaines de fois avec tes proches en agents, et on te montre ton enterrement : qui se lève pour parler, et ce qu'ils disent. Puis la seule décision, cette année, qui change ce qu'ils diront.

**Track 1 : Agent Animated Film.** Le film de 2 minutes est écrit par les agents : ils décident chaque année de ta vie et chaque éloge. Même profil, fin différente à chaque run. La scène animée est la chapelle 3D où les personnages se lèvent, marchent au pupitre et parlent avec leur voix.

**Les boosters.** 3D (chapelle + avatars), voix (une par proche), mémoire qui change les décisions (chaque agent se souvient des années passées et des blessures).

**Les agents.**
- 4 proches (issus du formulaire) : partenaire, enfant, parent, ami ou cofondateur. Chacun a un état émotionnel continu (valence, activation), une mémoire épisodique de la relation, un score de relation 0-100 et une rancune de départ.
- Le Protagoniste : toi, piloté par tes traits, ton défaut et ton ambition. Il prend les décisions.
- Destin : injecte les chocs (santé, argent, ruptures) calibrés sur des taux de base réels cherchés en live via Telem. Il a un droit de veto sur une année incohérente.

**Les sponsors.**
- Bruin (cœur) : pipeline qui ingère les runs dans DuckDB, checks de qualité, lineage, et le mart `mart_decision_impact` qui répond : quelle décision de l'année 1 fait parler ta fille.
- BAND : chaque vie simulée est une room. Les proches parlent en public (la vie) et en privé (ce qu'ils disent de toi quand tu n'es pas là). Destin peut bloquer une année.
- Telem : les taux de base réels, chaque recherche taguée avec le raisonnement de Destin, visible dans la console Observe.
- Runware : les portraits générés et vieillis depuis ta photo ; option 3D (voir docs/04).
- AdaL : le montage de la vidéo.

**Les trois phrases.** "Le scénario n'est écrit par personne, il est vécu." "Dans 68 % de tes vies, ta fille ne parle pas." "Tu as deux ans pour changer ça."
