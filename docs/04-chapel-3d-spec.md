# Bloc H — La chapelle 3D (Jules). C'est le plan le plus long de la vidéo.

Route `/chapel`. React Three Fiber + drei. Objectif : une chapelle gothique sombre, un cercueil, un pupitre, 4 proches assis au premier rang, le portrait vieilli du protagoniste sur un chevalet. Un proche se lève, marche au pupitre, parle (voix), retourne s'asseoir. Les autres réagissent (tête baissée / regard). Ledger à droite, canal privé en bas.

## Décor, dans l'ordre de ce qui donne le plus de wow par minute de travail
1. **Lumière avant géométrie.** Fond noir, `fog` dense (#05060a, near 8, far 40). Un `SpotLight` chaud (2600 K, intensité forte, `angle 0.35`, `penumbra 1`) qui tombe du haut sur le cercueil + pupitre. Des `pointLight` orangées faibles = bougies (6 à 10), avec un petit `Sprite` lumineux chacune. drei `<SpotLight volumetric>` ou `<Sparkles>` pour la poussière dans le faisceau. C'est 80 % de l'ambiance.
2. **Rosace.** Un plan vertical derrière l'autel avec une texture de vitrail générée par Runware (prompt : "gothic cathedral stained glass rose window, deep blue and crimson, backlit, symmetrical, 1:1") en `emissiveMap`, intensité 2, qui éclaire légèrement la scène en bleu froid. Contraste chaud/froid = cinéma.
3. **Architecture.** Deux options, dans l'ordre :
   a. **GLB CC0** : chercher sur Sketchfab "gothic church interior" / "cathedral interior" filtre Downloadable + CC0/CC-BY, formats glTF ; aussi Poly Haven n'a pas de cathédrale, mais a des HDRI d'église pour l'éclairage (`church` / `cathedral` HDRI, drei `<Environment files=... />`). Si un GLB < 30 MB existe : `useGLTF`, le poser, ne rien modéliser. Budget : 20 min de recherche max.
   b. **Procédural** : sol dallé (`planeGeometry` + texture Runware "worn stone floor tiles, dark, top view, seamless"), 2 rangées de 6 colonnes (`cylinderGeometry` r=0.5 h=9), arcs en `TorusGeometry` demi (`thetaLength: Math.PI`) entre colonnes, murs en `boxGeometry` sombres. Avec la fog et la lumière, ça suffit.
   c. **Runware 3D** (voir docs/05 section Runware) : si l'image-vers-3D est disponible et rend un GLB texturé en < 2 min, générer la chapelle depuis l'image Runware du vitrail/autel. Tester une fois ; si le résultat est moche, retour à b.
4. **Mobilier.** Cercueil : `boxGeometry 2×0.6×0.7` bois sombre + reflets (`meshStandardMaterial metalness 0.3 roughness 0.4`). Pupitre : box fin. 3 rangées de bancs : box longs. Chevalet avec le portrait vieilli (plane 0.6×0.8, texture = `portraits[2]` du profil). 
5. **Caméra.** Trois positions nommées : `wide` (fond de nef, légèrement en hauteur), `pulpit` (3/4 face sur l'orateur), `front_row` (sur les proches). Transitions en `lerp` 1,5 s. Pas d'OrbitControls en démo (dev only).

## Personnages
- Avatars : Ready Player Me GLB (`https://models.readyplayer.me/<id>.glb?quality=low`), 4 avatars pré-créés (homme/femme × 2 âges) dans `apps/web/public/avatars/`. Choix par `relation` + `age`. Bonus si temps : créer l'avatar du proche depuis une description via l'API RPM.
- Animations : Mixamo (export FBX "Without Skin", convertir en GLB avec le convertisseur FBX2glTF ou le script Blender fourni par RPM) : `idle_sitting`, `stand_up`, `walking`, `talking`, `sit_down`, `sad_idle`. drei `useAnimations` ; les clips sont partagés entre avatars (même squelette RPM/Mixamo). Séquence orateur : stand_up → walking (jusqu'au pupitre, 3 s, position lerp synchronisée) → talking (durée de l'audio) → walking retour → sit_down. 
- **Fallback animation** (si Mixamo pas prêt à 16h30) : l'avatar se téléporte au pupitre avec un fondu, oscille légèrement (`sin(t)`) pendant la voix, retour par fondu. Le critère "mouvement" est coché.
- Lip-sync : non. Un léger hochement de tête rythmé par le volume de l'audio (AnalyserNode) suffit.
- Les proches qui ne parlent pas (`speaks=false`) restent assis, tête baissée (rotation x +0.4), et leur texte apparaît dans le canal privé en gris.

## UI autour de la scène
- Droite : `<Ledger>` : chapitres du run (âge, choc, décisions avec raison), en défilement synchronisé avec la narration.
- Bas : `<PrivateFeed>` : `private_messages` du run + les pensées non dites des proches muets, style messagerie, logo BAND.
- Haut-gauche : "Life #847 of 1,000 · the one where Léa speaks" (depuis `summary.json`).
- Bouton `Next life` : charge `best_run_id` après `most_probable_run_id`.

## Audio
- ElevenLabs TTS par proche (voix fixes par relation/genre, ids dans `.env`), générées à l'avance par un script `scripts/voices.ts` depuis le JSONL → `public/audio/<run_id>/<relative_id>.mp3`. Le front ne génère rien en live.
- Nappe : un drone d'orgue très bas en boucle (fichier libre), volume 0,15.

## Critères d'acceptation
- [ ] 60 fps sur MacBook, scène lisible en plein écran, pas de z-fighting visible.
- [ ] Un run complet se joue sans clic : 4 éloges enchaînés avec déplacements et voix.
- [ ] Les deux runs (`most_probable`, `best`) se jouent et la différence est visible (qui se lève).
- [ ] Capture d'écran plein écran utilisable dans la vidéo (bloc K).
