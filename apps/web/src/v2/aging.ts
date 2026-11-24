/** Age a portrait. Real path: Runware FLUX.1 Kontext when VITE_RUNWARE_API_KEY is set. Fallback: canvas look-dev so the demo never blocks. */
export async function agePortrait(dataUrl: string, age: number): Promise<string[]> {
  const key = import.meta.env.VITE_RUNWARE_API_KEY as string | undefined;
  if (key) {
    try {
      const prompts = [`Same person, same identity and features, natural soft studio light, slight smile, photographic, ${age} years old`, `Make this person look ${age + 25} years old: grey at the temples, lines around the eyes, same identity, same pose and lighting`, `Make this person look ${age + 50} years old: thin white hair, deep wrinkles, age spots, kind expression, same identity, framed portrait photograph`];
      const body = prompts.map((positivePrompt) => ({ taskType: 'imageInference', taskUUID: crypto.randomUUID(), model: 'bfl:3@1', positivePrompt, inputs: { referenceImages: [dataUrl] }, width: 1024, height: 1024, outputType: 'URL', outputFormat: 'JPG' }));
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
      const res = await fetch('https://api.runware.ai/v1', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(body), signal: ctl.signal });
      clearTimeout(to);
      const json = (await res.json()) as { data?: { imageURL?: string }[] };
      const urls = (json.data ?? []).map((d) => d.imageURL).filter((u): u is string => !!u);
      if (urls.length === 3) return urls;
    } catch { /* fall through to local look-dev */ }
  }
  return [dataUrl, await filterImage(dataUrl, 1), await filterImage(dataUrl, 2)];
}

function filterImage(src: string, stage: 1 | 2): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); const s = 768; c.width = s; c.height = s; const ctx = c.getContext('2d')!;
      const r = Math.min(img.width, img.height); const sx = (img.width - r) / 2, sy = (img.height - r) / 2;
      ctx.filter = stage === 1 ? 'saturate(0.7) contrast(1.08) brightness(0.96) sepia(0.15)' : 'saturate(0.4) contrast(1.15) brightness(0.9) sepia(0.3) blur(0.4px)';
      ctx.drawImage(img, sx, sy, r, r, 0, 0, s, s); ctx.filter = 'none';
      // grain + vignette
      const id = ctx.getImageData(0, 0, s, s); const d = id.data; const g = stage === 1 ? 10 : 22;
      for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * g; d[i] = (d[i] ?? 0) + n; d[i + 1] = (d[i + 1] ?? 0) + n; d[i + 2] = (d[i + 2] ?? 0) + n; }
      ctx.putImageData(id, 0, 0);
      const v = ctx.createRadialGradient(s / 2, s / 2, s * 0.35, s / 2, s / 2, s * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${stage === 1 ? 0.35 : 0.55})`); ctx.fillStyle = v; ctx.fillRect(0, 0, s, s);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(src); img.src = src;
  });
}
