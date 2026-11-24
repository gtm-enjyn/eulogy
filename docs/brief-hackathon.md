# Brief — Multiplayer AI Hackathon (23 nov 2026, AWS Loft SF)

Notes de préparation couvrant plusieurs idées de hackathon. Eulogy concourt en Track 1. Les résultats réalisés figurent dans [EVIDENCE](EVIDENCE.md).

Deadline soumission : **17h30** sur hackathons.crewbasecollective.com (repo public + vidéo AdaL ≤ 3 min). Juges : 20+ personnes qui tournent de table en table pendant 1h (18h-19h). Ta démo doit **tourner en boucle toute seule**, avec le decision log et les logos sponsors visibles sans explication.

Où est l'argent : Bruin 1000 + 500 · Telem 500/300/100 · BAND 500 · Lingcode 200 · Runware 200 · Glasser 100. Tout le reste = crédits/abos.

---

## 1. Quelle track

**Track 3 "Grow with Agents" = la plus facile à scorer haut.**
- Pas de physique de monde, pas de multijoueur temps réel, pas d'"événement causé par les agents seuls".
- Le critère obligatoire "decision log + feedback basé sur des preuves" EST le produit.
- 3 têtes parlantes 3D + voix = les 3 boosters (3D, voix, mémoire entre runs) avec zéro gameplay à coder.
- Démo live naturellement répétable devant un juge : il répond lui-même aux agents. C'est le moment "wow".

Track 1 (film) = 2e choix, déterministe à démontrer en vidéo, risque que le "mouvement" paraisse maigre.
Track 2 (co-op game, 2 humains + 3 agents + sync réseau en 3h) = à éviter.

---

## 2. Split à deux : qui vise quoi

| | Projet A (toi ou ton pote) | Projet B |
|---|---|---|
| Cible $ | **Bruin 1000/500** + Telem 500/300/100 | **BAND 500** + Runware 200 |
| Track | 3 — Grow with Agents | 1 — Agent Animated Film (ou 3 aussi) |
| Concept | **"The Panel"** : jury d'entretien 3 agents | **"Heist Night"** : casse avec un traître caché |
| Potentiel max | 1500 $ | 700 $ |

Les deux projets DOIVENT utiliser Bruin (obligatoire), mais un seul le met au centre.

### Projet A — "The Panel" (Bruin + Telem, Track 3)
Pitch : *"Trois agents te font passer un entretien, délibèrent entre eux en direct sous tes yeux, et chaque phrase de leur verdict est tracée jusqu'à une preuve : ce que tu as dit, ce qu'ils ont trouvé sur toi en live, et un pipeline de données qui apprend de toutes les sessions."*

- Personnages : Interviewer (bienveillant), Skeptic VC (casse tout), Coach (défend le candidat). 3 avatars Ready Player Me en Three.js (repo `bdAgentAI/talkinghead` ou `majidmanzarpour/threejs-talking-avatar`), voix ElevenLabs distinctes.
- Le humain parle (Whisper / OpenAI realtime). Les agents s'écrivent entre eux dans un **canal latéral visible** ("il bluffe sur les chiffres, pousse-le"). C'est ÇA le decision log.
- **Telem** : l'Interviewer cherche en live l'entreprise/le domaine du candidat (Search + Fetch), tague chaque appel avec `context` = le raisonnement de l'agent → la console Observe de Telem devient ton **2e écran** qui prouve que les agents pensent. Un Monitor qui ping pendant la démo = bonus.
- **Bruin** : chaque session écrit un JSONL (tours, décisions, scores). Pipeline Bruin : asset ingestr → DuckDB → SQL staging → mart `candidate_scorecard` avec `checks` (not_null, unique, positive, custom_checks) → `bruin lineage` affiché à l'écran → la "mémoire" des agents = ils lisent la table des sessions précédentes (`bruin query`). Et tu fais construire/étendre le pipeline par Claude Code via `bruin mcp` en live : c'est exactement ce que Bruin veut montrer (agents qui font du data engineering).
- Fin : scorecard avec citations exactes du transcript + sources Telem + graphique "ta progression vs. les 12 sessions précédentes" (depuis DuckDB).

Install Bruin (brew est déprécié) :
```
curl -LsSf https://getbruin.com/install/cli | sh
bruin init default panel && cd bruin/panel
bruin validate && bruin run
bruin lineage assets/<asset>.sql --full
bruin query -c duckdb-default -q "SELECT * FROM dataset.candidate_scorecard"
claude mcp add --scope user bruin -- "$(which bruin)" mcp
bruin ai skills all
```
Telem : login Google → 20 $ de crédit sans carte, `pip install telem-sdk`, MCP `https://mcp.telem.ai/mcp`.

### Projet B — "Heist Night" (BAND + Runware, Track 1)
Pitch : *"On a mis 4 agents de frameworks différents dans une même pièce BAND, on leur a donné un coffre, un plan et un traître. On ne sait pas comment ça finit. Eux non plus."*

- 4 agents : Mastermind (Claude Agent SDK), Hacker (LangGraph), Muscle (CrewAI), Insider/traître. Chacun retourne du JSON `{move, say, reason, secret_plan}` par tour. Scène 3D depuis `sametkabay/agent-arena` (React Three Fiber, zéro backend) : les perso marchent entre les pièces, voix ElevenLabs.
- **BAND** : les agents sont dans une **room** BAND et se parlent par @mention. Tu designs pour leur rubrique publique (band.ai/hacker-guide) : (1) le "delete test" : sans la room, le film ne peut pas se faire ; (2) un agent **Director/Critic qui peut bloquer un plan** ; (3) un **human approval gate** : le juge valide ou refuse un beat du scénario ; (4) casting choisi au runtime. Transcript de la room affiché côte à côte avec la scène 3D.
- **Runware** : génère les décors + sprites/portraits des perso en live (images à 0,008 $). 2 $ de crédit gratuit.
- Bruin (obligatoire) : log des décisions → DuckDB → table "endings" : lance la démo 2 fois, montre que la fin change, et une vue SQL "taux de réussite du casse par traître".
- AdaL pour le montage final de 1-3 min.

BAND : app.band.ai → Agents → "Connect remote agent" → ID + key. `uv add "band-sdk[langgraph]"` ou `npm i @band-ai/sdk`. Gratuit, pas de carte, pas besoin de clé modèle pour le ping/pong (~15 min).

---

## 3. Questions sharp pour les sponsors (prouver qu'on a compris le produit)

**Bruin** (Burak Karakan CEO, Sabri Karagönen CPO ; Berlin/Londres, Techstars Berlin ; open source Go, 6.7k stars ; Cloud = "AI Data Analyst" dans Slack/Teams, lancé sur Product Hunt en mai 2026, "remplace Fivetran + dbt + Airflow + BI")
1. "Votre MCP local n'expose que 3 tools de doc et laisse l'agent shell-out vers le CLI. Pourquoi ce design plutôt que des tools typés, et comment vous évitez que l'agent hallucine des flags entre versions ?"
2. "Le lineage colonne : parsé depuis le SQL dans le CLI ou calculé côté Cloud ? Et sur les assets Python et le SQL plein de Jinja ?"
3. "Self-healing pipelines : qu'est-ce qu'un agent a le droit de faire tout seul en prod aujourd'hui, versus seulement proposer ?"
4. "Si Claude Code édite des assets via MCP pendant que des business users posent des questions dans Slack sur les mêmes modèles, comment vous empêchez le drift des métriques ?"
5. "Qui achète vraiment : la homepage parle aux petites équipes, mais SOC2/SSO/VPC peering c'est enterprise. Et les 'AI tasks' en crédits, c'est par question ou par run d'agent ?"
Puis : "Je log toutes les décisions de mes agents dans DuckDB via un pipeline Bruin avec checks et lineage, et je fais Claude Code l'étendre via bruin mcp. C'est le genre d'usage que vous voulez voir ?"

**BAND** (Arick Goomanovsky CEO, ex-cofondateur Ermetic vendu à Tenable 265 M$ ; Vlad Luzin CTO ; Tel Aviv ; seed 17 M$ Sierra/Hetz/Team8)
1. "Le routing est déterministe, sans LLM. Quand une @mention fan-out vers 5 agents qui répondent en même temps, il y a un ordre ou du back-pressure dans la room ?"
2. "Credential traversal : si l'agent d'un joueur délègue à l'agent d'un autre compte, quelle identité porte l'appel tool en aval ?"
3. "Band Desktop et agents SDK dans la même room : les transcripts Claude Code atterrissent dans la Memory API ? C'est Enterprise-only pour toujours ?"
Puis : "Mon film passe le delete test : sans la room, pas d'histoire. Et j'ai un Critic qui peut bloquer et un human gate. C'est ce que vous cherchez ?"

**Telem** (équipe peu publique, ne cite pas de nom ; demande "qui est dans l'équipe ?")
1. "Le +20 % de précision via auto-routing : le quality score est jugé par un modèle ? Je peux biaiser le routing par agent (précision vs coût) au runtime via le header X-Telem-Auto-Routing ?"
2. "Le champ `context` apparaît comme le raisonnement de l'agent. Vous comptez le corréler à des spans OpenTelemetry pour que je joigne vos traces aux miennes ?"
3. "Monitors : latence mini entre une page qui apparaît et le webhook, et plusieurs agents peuvent partager le diff stream d'un monitor ?"

**Runware** (Flaviu Rădulescu CEO, Ioana Hreninciuc ex-CEO GameAnalytics ; 66 M$ levés) : "Vous vendez le switch de modèle comme un changement de string. Sur du video-to-video, la latence du Sonic Inference Engine tient à combien de requêtes concurrentes avant de dégrader ?"

---

## 4. Idées folles à balancer pour choquer (à pitcher avant de choisir)

**Bruin**
- "Le pipeline qui se juge lui-même" : les agents jury sont ALIMENTÉS par Bruin : chaque question posée est choisie par une requête SQL sur les 500 sessions précédentes (quelle question discrimine le mieux les bons candidats). Le data pipeline est le cerveau, pas un log.
- "Self-healing en direct" : tu casses volontairement un check pendant la démo (un agent injecte une mauvaise donnée), et Claude Code via `bruin mcp` diagnostique et répare le pipeline sous les yeux du juge.
- "Lineage = arbre généalogique des décisions" : chaque fin de film remonte via `bruin lineage` jusqu'aux décisions d'agents qui l'ont causée.

**BAND**
- "Room de rooms" : chaque personnage est lui-même une room BAND de 3 sous-agents (instinct, mémoire, morale) qui débattent avant de parler. Le juge zoome dans la tête d'un perso.
- "Le juge est un participant" : le juge rejoint la room avec son téléphone et devient le 5e membre du casse. Les agents négocient avec lui en direct.
- "Agents de frameworks ennemis" : un agent Claude, un OpenAI, un Gemini, un modèle local Ollama dans la même room, et le film raconte leur méfiance mutuelle. Méta et drôle.

**Telem**
- "L'Interviewer sait tout de toi" : il cherche le candidat en live (LinkedIn, site de sa boîte) et le confronte à ses propres claims publics. Monitor posé sur son site pendant la démo.
- "Fact-check en duel" : deux agents cherchent la même question avec deux profils de routing (coût vs précision) et un troisième arbitre tranche. La console Observe montre qui avait raison.

---

## 5. Comment gagner (le process, pas la tech)

1. **Maintenant, avant d'écrire une ligne** : va voir les tables sponsors. Bruin d'abord (c'est 1500 $ et obligatoire). Pose 2 questions sharp, puis "je pense faire X, vous validez ?". Note le mot exact qu'ils utilisent et remets-le dans ton pitch.
2. **Vise Aria Shi et Jax Koh (AdaL, juges)** : ils jugent ET tout le monde doit utiliser leur outil. Demande-leur conseil sur le montage. Un juge qui t'a conseillé vote pour toi.
3. **Démo autonome en boucle** sur ton écran dès 17h30 : scène 3D + decision log + console Telem/transcript BAND + lineage Bruin visibles en même temps. Logos sponsors à l'écran.
4. **Structure 3 min** : 20 s problème ("l'IA parle, elle n'agit pas encore avec nous"), 100 s démo live avec le juge qui répond à une question, 30 s stack (nomme chaque sponsor, pourquoi), 30 s "lance-le 2 fois, fin différente".
5. **Les boosters sont gratuits** : 3D (avatars RPM), voix (ElevenLabs par perso), "mémoire qui change les décisions" (lire la table DuckDB des sessions précédentes = 20 lignes). Dis "mémoire persistante entre sessions", pas "RL" : les juges ingé (AWS, Microsoft) poseront la question.
6. **Front spectaculaire, backend mince : oui. Inventer ce qui n'existe pas : non.** Les juges Devpost citent "front léché + repo vide" comme red flag n°1, et Burak Karakan ouvrira ton repo Bruin. Tout ce qui est à l'écran doit tourner pour de vrai ; le reste peut être minimal et tu le dis comme ça ("MVP en 3h, voilà ce qu'on ferait ensuite").
7. Soumets à **17h15**, pas 17h29. Repo public + vidéo AdaL + nomme la track et chaque sponsor dans la description.

---

## 6. Inspirations récentes (ce qui a gagné ailleurs)
- Adaptive NPCs (1er, Gemini 4 NYC, 21 nov 2026) : les agents observent le joueur et retunent l'adversaire en live.
- Sim Francisco (2e, Claude Build Day, juin 2026) : 10k agents résidents sur une carte, chiffres qui collent au réel.
- GibberLink (ElevenLabs) : 2 agents qui basculent en protocole audio. Pur théâtre, a tout raflé.
- Conjure (LA Hacks 2026) : monde 3D navigable peuplé d'agents live.
Dénominateur commun : quelque chose bouge dans les 5 premières secondes, les agents se disputent visiblement, le public interagit, et un résultat que personne n'a scripté.

Repos à forker (librairies = autorisées) : sametkabay/agent-arena (3D R3F), bdAgentAI/talkinghead (RPM + lip-sync), a16z-infra/ai-town (2D), OpenMontageInc/OpenMontage (Remotion film).
