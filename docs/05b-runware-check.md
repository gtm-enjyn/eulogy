# Runware — fiche technique vérifiée (23 nov 2026)

Endpoint unique : `POST https://api.runware.ai/v1`, Bearer `RUNWARE_API_KEY`, corps = tableau de tâches. Signup : 2 $ de crédit, clé instantanée après vérification email. Docs : https://runware.ai/docs/models-api/introduction

## 3D : `taskType: "3dInference"` (image → GLB texturé). Sortie GLB uniquement, par URL (`outputs.files[].url`).
- **TRELLIS.2** `microsoft:trellis-2@4b` : le plus rapide (~32 s) et le moins cher (~0,02 $). `inputs.image`, `settings: { resolution: 1024, textureSize: 2048, textureFormat: "PNG", decimationTarget: 100000 }`. **C'est celui qu'on utilise par défaut.** https://runware.ai/docs/models/microsoft-trellis-2
- **Hunyuan 3D 3.1 Rapid** `tencent:hunyuan-3d@3.1-rapid` : ~1 min, 0,225 $ (PBR 0,375 $). `inputs.image`, `settings: { geometryOnly: false, pbr: true }`. Qualité supérieure pour un buste. https://runware.ai/docs/models/tencent-hunyuan-3d-3-1-rapid
- Hunyuan 3D 3.1 Pro `tencent:hunyuan-3d@3.1-pro` : multi-vues (`inputs.images[]`), ~2 min 17, 0,525 $ PBR. Trop lent pour nous.
- Exemple :
```json
[{"taskType":"3dInference","taskUUID":"<uuid4>","model":"microsoft:trellis-2@4b",
  "inputs":{"image":"<URL ou dataURI>"},
  "settings":{"resolution":1024,"textureSize":2048,"textureFormat":"PNG","decimationTarget":100000},
  "outputType":"URL","outputFormat":"GLB","deliveryMethod":"async"}]
```
- `deliveryMethod: "sync"` bascule en async après 120 s → poller `getResponse` avec le `taskUUID`. Le GLB se charge dans Three.js avec `useGLTF(url)` (vérifier CORS depuis assets.runware.ai ; sinon proxy via `/api/proxy?url=` ou téléchargement dans `public/models/`).
- Portraits humains acceptés (buste depuis une photo), **pas de rig** : mesh statique. Donc : bustes 3D pour les proches assis dans les plans larges et pour le "monument" du protagoniste ; l'orateur qui marche reste un avatar Ready Player Me animé.

## Ce qu'on génère en 3D avec Runware (bloc J, Jules), dans l'ordre
1. Le **buste du protagoniste vieilli** (depuis `portraits[2]`), posé sur un socle à côté du cercueil, éclairé par le spot. 1 appel, 32 s. C'est le plan qui dit "c'est TOI dans ce cercueil".
2. **4 bustes des proches** depuis leurs portraits générés, sur les bancs du premier rang, plans larges.
3. **L'autel / le mobilier** : une image Runware "gothic stone altar with candles, front view, dark" → TRELLIS → GLB. Si moche, retour au procédural (docs/04 option b).
4. Ne pas tenter la chapelle entière en un seul GLB : la 3D image→mesh fait un objet, pas un intérieur.

## Portraits vieillis : `taskType: "imageInference"` avec image de référence
- **FLUX.1 Kontext pro** `bfl:3@1` (0,04 $/image), `inputs: { referenceImages: ["<photoUrl>"] }`, 1024×1024, `outputFormat: "JPG"`. https://runware.ai/docs/models/bfl-flux-1-kontext-pro/examples
- Alternative : Qwen-Image-Edit `runware:108@20`.
- Prompts (3 tâches dans le même appel) :
  - now : "Same person, same identity and features, natural soft studio light, neutral background, slight smile, photographic."
  - +25 : "Make this person look {age+25} years old: grey hair, laugh lines, same eyes and identity, same pose and lighting."
  - +45 : "Make this person look {age+45} years old: deep wrinkles, thin white hair, age spots, kind expression, same identity, framed portrait photograph."
- Sans photo : `imageInference` texte→image, modèle rapide (`runware:101@1` FLUX schnell), prompt depuis `name, age, traits, city`.
- Textures de décor (vitrail, dalles, bois) : même appel, `width/height 1024`, préciser "seamless, tileable" pour sol et bois.
