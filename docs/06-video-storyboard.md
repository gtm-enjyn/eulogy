# La vidéo — montage final v2 (2 min 02, Remotion, 24 i/s, 1920×1080 letterboxé)

Protagoniste : Jules, 20 ans, Paris → Chicago, CS & data, tennis universitaire, colérique, beaucoup d'ego. Léa est la fille qu'il n'a pas encore. Fin joyeuse : il appelle son père le soir même.

Une seule voix off (Eleven v4, voix Arthur), intime, à la deuxième personne, phrases de moins de huit mots. Les sponsors ne sont jamais dits à la voix : ils apparaissent en légendes techniques monospace, bas gauche. Score ElevenLabs Music : drone d'orgue, cordes à 30 s, chute au silence à 45 s, violoncelle, une note de piano à la fin. Battement de cœur sur les 12 premières secondes. Silence total sous la phrase choc.

| Temps | Scène | Image | Son | Levier |
|---|---|---|---|---|
| 0:00–0:08 | Naissance | Noir, halo chaud qui pulse au rythme du cœur, main de nouveau-né qui serre un doigt (push-out) | Battement. VO : "You were born on a Tuesday. You don't remember it. Nobody asked you anything." | Pattern interrupt |
| 0:08–0:20 | Cinq lignes | Formulaire tapé en temps réel : 31 · San Francisco / Founder, pre-revenue. 14 hours a day. / Short-tempered. / Léa, 2. "I'm never there." / Admired by strangers. Unknown to my kid. | VO : "So we asked. Five lines. The ones you don't say out loud." Légende : Profile → zod contract → 4 relative agents + Protagonist + Destiny | Spécificité |
| 0:20–0:29 | Le visage | Même homme à 31, 56, 76 ans, fondus, push-in | VO : "This is you. This is you at fifty-six. This is you… the week before." Légende : Runware FLUX Kontext aging · TRELLIS.2 bust | Mortalité personnelle |
| 0:29–0:45 | Mille vies | 64 lignes de vie procédurales qui se tracent en parallèle, compteur réel jusqu'à 1 000, canal privé qui défile | VO : "We let the people who love you live your life with you. Year by year. Then we did it again. And again." Cordes. Légendes : Monte Carlo + état émotionnel · BAND rooms + veto · Telem priors tracés | Awe |
| 0:43–0:59 | Sous le capot | Plan dortoir + trois panneaux : room BAND (public + privés, veto de Destiny), terminal `bruin run` (12 assets, checks), traces Telem avec le raisonnement de l'agent. Données réelles du repo. | VO : "Four agents live your life with you… A thousand times." | Preuve |
| 0:59–1:07 | La phrase | Noir. "In 43 % of your lives, Léa, the daughter you don't have yet, does not speak at your funeral." Chiffre réel de mart_outcome_distribution. | Silence. Légende : mart_outcome_distribution · Bruin · 30 runs · 6 checks | Pic |
| 0:52–1:12 | Vie n° 001 | Chapelle (clip Kling, dolly), cofondateur au pupitre (clip), Léa assise tête baissée (clip), buste et portrait vieilli. Ledger à droite : 33, 36, 41, 51, 66. Ligne privée : "Léa → Anne: I don't know what to say about him." | J-cut : voix du cofondateur "He built something enormous. He never stopped. Not once." VO : "Life number one. The one you're building right now." | Empathie |
| 1:12–1:28 | Vie n° 212 | Carton "Life number 212." Léa debout au pupitre (clip 8 s). Ledger alternatif. Retour chapelle. Surimpression : "In 100 % of the lives where Léa speaks, you made one decision before 33. In 94 %, the same one." | Voix de Léa : "He closed his company when I was two. He said it was the best decision of his life. He was there. He was always there." | Résolution |
| 1:43–2:02 | Trois ans, l'appel | Noir, "You have three years." Toit de Chicago au couchant, Jules au téléphone : « Papa ? … C'est moi. » Carton "Built with" : une ligne concrète par sponsor. Titre. | VO : "Jules made the call that night." puis "Eulogy doesn't predict how you die. It shows you who shows up. A thousand lives. One decision. Yours." | Pic-fin, joie |

Règle : la vidéo finit sur la décision, jamais sur la tombe.

## Fabrication
- Stills : Higgsfield Cinema Studio 2.5 (2K, 16:9), identité du protagoniste conservée par image-to-image depuis le portrait de base.
- Clips : Kling 3.0 pro, image-to-video depuis les stills, 6 à 8 s, sans son.
- Voix : Eleven v4 (Arthur = protagoniste, Desmond = cofondateur, Isla = Léa).
- Score : ElevenLabs Music v2.5, 95 s, instrumental, prompt avec la chute au silence à 45 s.
- Montage : Remotion (`video/`), rendu `npm run render`.
