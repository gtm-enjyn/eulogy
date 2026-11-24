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
async function send(tasks: Task[], key: string) {
  const result = await fetch(RUNWARE_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(z.array(RequestSchema).parse(tasks)),
    signal: AbortSignal.timeout(120000),
  });
  if (!result.ok) throw Error('Runware HTTP ' + result.status);
  const response = ResponseSchema.parse(await result.json());
  if (response.errors?.length) throw Error('Runware returned a task error');
  return response.data;
}
export async function renderTasks(tasks: Task[], key: string): Promise<string[]> {
  const first = await send(tasks, key);
  return Promise.all(
    tasks.map(async (task) => {
      let result = first.find((r) => r.taskUUID === task.taskUUID);
      for (let i = 0; i < 40; i++) {
        const url = result?.imageURL ?? result?.outputs?.files[0]?.url;
        if (url) return url;
        if (result?.status === 'error' || result?.status === 'failed')
          throw Error('Runware task failed');
        await new Promise((r) => setTimeout(r, 1500));
        result = (await send([{ taskType: 'getResponse', taskUUID: task.taskUUID }], key)).find(
          (r) => r.taskUUID === task.taskUUID,
        );
      }
      throw Error('Runware task timed out');
    }),
  );
}
export async function generatePortraits(profile: Profile, key: string) {
  const images = await renderTasks(portraits(profile), key);
  const [bustUrl] = await renderTasks([bust(images[2]!)], key);
  return { portraits: images, bustUrl };
}
