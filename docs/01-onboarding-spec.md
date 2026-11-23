# Bloc G — Intro + Onboarding (Jules)

## Intro "naissance" (route `/`)
Écran noir total. Après 800 ms, un battement de cœur (audio déclenché au premier clic/tap, sinon muet). Au centre, une seule lumière chaude qui pulse au rythme du cœur (sphère émissive R3F ou simple CSS radial-gradient, au choix du temps dispo). Texte qui apparaît lettre par lettre, blanc cassé, serif :
1. "You were born." (2 s)
2. "You don't remember it." (2 s)
3. "Let's skip to now." (2 s)
Puis un bouton unique : **"Tell us where you are"** → `/you`.
Durée totale ≤ 8 s. Skippable au clic. `prefers-reduced-motion` : pas de pulse, fondu simple.

## Formulaire (route `/you`)
Un seul écran, long, défilable, fond noir, champ actif en lumière. Chaque champ a une ligne d'aide "why we ask" en petit. Aucune question vague. Les réponses doivent permettre à un agent de jouer la personne.

### Section 1 — Now
- `name` (texte, requis) — "What people call you."
- `age` (nombre 16-70, requis)
- `city` (texte, requis) — "Where you wake up."
- `currentActivity` (textarea, 1-2 phrases, requis) — "What you actually do all day. Be specific: 'founding a B2B sales tool, pre-revenue, 14h/day', not 'entrepreneur'."

### Section 2 — Who you are (the part that hurts)
- `traits` (3 chips à choisir parmi : ambitious, disciplined, generous, loyal, curious, charismatic, stubborn, anxious, competitive, calm, impulsive, workaholic) — exactement 3.
- `flaw` (select, requis) — "The thing people close to you complain about." Options : short-tempered, avoids conflict, never present, controlling, jealous, drinks too much, lies to protect himself/herself, puts work before everyone, can't apologize, spends recklessly. Plus "other" avec texte.
- `fear` (texte, requis) — "Your biggest fear, one sentence. 'Ending up like my father.'"
- `ambition10y` (texte, requis) — "Where you want to be at age {age+10}. Numbers if you have them."

### Section 3 — The people who will be at your funeral
Répéteur 1 à 4 cartes `Relative` :
- `name`, `relation` (select : partner, child, parent, sibling, friend, cofounder, other), `age`
- `relationshipState` (texte, requis) — "Where you two stand today. 'We talk every Sunday but never about anything real.'"
- `grievance` (texte, requis) — "What they'd say you do wrong, in their words."
Un bouton "+ Add someone" jusqu'à 4. Aide : "Add the one you're avoiding."

### Section 4 — Body
Trois sliders 0-10 : `habits.sport` ("Hours of sport per week, roughly"), `habits.alcohol` ("Drinks per week"), `habits.sleep` ("Nights a week you sleep 7h+"). Ces valeurs calibrent les chocs santé de Destin.

### Section 5 — Your face (optional, strongly suggested)
- Bouton **"Take a photo"** (webcam via `getUserMedia`, capture en canvas → dataURL) et **"Upload"** (file input). Preview ronde.
- Si photo : upload vers Vercel Blob (`POST /api/upload` → `photoUrl`), puis Runware génère 3 portraits (now, +25 ans, +45 ans) → `portraits: string[]` (voir docs/05). Afficher les 3 en fondu dès qu'ils arrivent, c'est le premier petit wow.
- Si pas de photo : Runware génère un portrait depuis la description (`name`, `age`, `traits`).

### Soumission
Bouton **"Live my life 1,000 times"**. Valide avec le zod `Profile` de `packages/shared`. Sauvegarde dans zustand + localStorage (`eulogy.profile`). Appelle `POST /api/simulate` (bloc F) avec le profil ; si l'API répond 501 ou est absente, charge `sampleRun` ×20 depuis shared (fallback dev). Navigue vers `/lives`.

## Critères d'acceptation
- [ ] `/` joue l'intro et mène à `/you` en ≤ 8 s ou au clic.
- [ ] `/you` ne laisse pas soumettre un profil invalide ; les erreurs sont inline.
- [ ] Un profil complet est sérialisé exactement au schéma `Profile`.
- [ ] Photo webcam ET upload fonctionnent en local (Chrome).
- [ ] Sans réseau/API, le fallback mène quand même à `/lives` avec des données.
