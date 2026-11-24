import { randomUUID } from 'node:crypto';
import type { Profile } from '@eulogy/shared';
import { z } from 'zod';
export const RUNWARE_URL = 'https://api.runware.ai/v1';
const RequestSchema = z
  .object({
    taskUUID: z.string().uuid(),
    taskType: z.enum(['imageInference', '3dInference', 'getResponse']),
  })
  .passthrough();
type Task = z.infer<typeof RequestSchema>;
const Result = z.object({
  taskUUID: z.string().uuid(),
  status: z.string().optional(),
  imageURL: z.string().url().optional(),
  outputs: z.object({ files: z.array(z.object({ url: z.string().url() })) }).optional(),
});
const ResponseSchema = z.object({
  data: z.array(Result).default([]),
  errors: z.array(z.unknown()).optional(),
});
function image(prompt: string, model: string, photo?: string, format = 'JPG'): Task {
  return {
    taskType: 'imageInference',
    taskUUID: randomUUID(),
    model,
    positivePrompt: prompt,
    width: 1024,
    height: 1024,
    outputType: 'URL',
    outputFormat: format,
    numberResults: 1,
    ...(photo ? { inputs: { referenceImages: [photo] } } : {}),
  };
}
export function portraits(profile: Profile) {
  return [0, 25, 45].map((offset) =>
    image(
      'Photographic portrait of ' +
        (profile.photoUrl
          ? 'the same person, preserving eyes and identity'
          : profile.name + ', ' + profile.traits.join(', ') + ' in ' + profile.city) +
        ', age ' +
        (profile.age + offset) +
        '. Natural soft window light, neutral background, similar pose.',
      profile.photoUrl ? 'bfl:3@1' : 'runware:101@1',
      profile.photoUrl,
    ),
  );
}
export function textures() {
  return [
    'Gothic stained glass rose window, crimson and deep blue, backlit, centered, circular, black background',
    'Seamless worn limestone floor tiles, top down, repeatable',
    'Seamless carved walnut wood, warm straight grain, repeatable',
  ].map((prompt) => image(prompt, 'runware:101@1', undefined, 'PNG'));
}
export function bust(imageUrl: string): Task {
  return {
    taskType: '3dInference',
    taskUUID: randomUUID(),
    model: 'microsoft:trellis-2@4b',
    inputs: { image: imageUrl },
    settings: {
      resolution: 1024,
      textureSize: 2048,
      textureFormat: 'PNG',
      decimationTarget: 100000,
    },
    outputType: 'URL',
    outputFormat: 'GLB',
    deliveryMethod: 'async',
  };
}
async function send(tasks: Task[], key: string, timeoutMs: number) {
  const result = await fetch(RUNWARE_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(z.array(RequestSchema).parse(tasks)),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!result.ok) throw Error('Runware HTTP ' + result.status);
  const response = ResponseSchema.parse(await result.json());
  if (response.errors?.length) throw Error('Runware returned a task error');
  return response.data;
}
export async function renderTasks(tasks: Task[], key: string): Promise<string[]> {
  // HTTP sync may switch to async after 120 seconds. Leave time to receive its acknowledgement.
  let rows = await send(tasks, key, 130_000);
  const outputs = new Map<string, string>();
  const deadline = Date.now() + 120_000;
  let interval = 1500;
  while (true) {
    for (const row of rows) {
      if (row.status === 'error' || row.status === 'failed') throw Error('Runware task failed');
      const url = row.imageURL ?? row.outputs?.files[0]?.url;
      if (url) outputs.set(row.taskUUID, url);
    }
    const pending = tasks.filter((task) => !outputs.has(task.taskUUID));
    if (!pending.length) return tasks.map((task) => outputs.get(task.taskUUID)!);
    const remaining = deadline - Date.now();
    if (remaining <= interval) throw Error('Runware task timed out');
    await new Promise((resolve) => setTimeout(resolve, interval));
    const poll = pending.map((task) => ({
      taskType: 'getResponse' as const,
      taskUUID: task.taskUUID,
    }));
    rows = await send(poll, key, Math.max(1, Math.min(15_000, deadline - Date.now())));
    interval = Math.min(8000, interval * 2);
  }
}
export async function generatePortraits(profile: Profile, key: string) {
  const images = await renderTasks(portraits(profile), key);
  const [bustUrl] = await renderTasks([bust(images[2]!)], key);
  return { portraits: images, bustUrl };
}
