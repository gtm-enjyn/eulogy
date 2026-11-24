import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sampleProfile } from '@eulogy/shared';
import { bust, generatePortraits, portraits, renderTasks, RUNWARE_URL, textures } from './runware';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('Runware HTTP contract', () => {
  it('sends three Kontext edits and a TRELLIS task using the aged image returned by the edit', async () => {
    const profile = { ...sampleProfile, photoUrl: 'https://fixture.example/face.jpg' };
    const taskBodies: Record<string, unknown>[][] = [];
    const fetcher: typeof fetch = async (url, init) => {
      expect(url).toBe(RUNWARE_URL);
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer example' });
      const tasks = JSON.parse(String(init?.body)) as { taskUUID: string; taskType: string }[];
      taskBodies.push(tasks);
      if (tasks[0]?.taskType === 'imageInference')
        return Response.json({
          data: tasks
            .map((t, i) => ({
              taskUUID: t.taskUUID,
              imageURL: 'https://fixture.example/' + i + '.jpg',
            }))
            .reverse(),
        });
      return Response.json({
        data: [
          {
            taskUUID: tasks[0]!.taskUUID,
            outputs: { files: [{ url: 'https://fixture.example/bust.glb' }] },
          },
        ],
      });
    };
    vi.stubGlobal('fetch', fetcher);
    const result = await generatePortraits(profile, 'example');
    expect(result).toEqual({
      portraits: [0, 1, 2].map((i) => 'https://fixture.example/' + i + '.jpg'),
      bustUrl: 'https://fixture.example/bust.glb',
    });
    expect(taskBodies[0]).toHaveLength(3);
    for (const task of taskBodies[0]!)
      expect(task).toMatchObject({
        model: 'bfl:3@1',
        inputs: { referenceImages: [profile.photoUrl] },
      });
    expect(taskBodies[1]?.[0]).toMatchObject({
      model: 'microsoft:trellis-2@4b',
      inputs: { image: result.portraits[2] },
      deliveryMethod: 'async',
      outputFormat: 'GLB',
    });
    expect(portraits(sampleProfile)[0]).toMatchObject({ model: 'runware:101@1' });
    expect(textures().every((task) => task.outputFormat === 'PNG')).toBe(true);
  });
  it('uses the completed result when a polling response contains both processing and final rows', async () => {
    vi.useFakeTimers();
    const task = bust('https://fixture.example/aged.jpg');
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ data: [{ taskUUID: task.taskUUID, status: 'processing' }] }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: [
            { taskUUID: task.taskUUID, status: 'processing' },
            {
              taskUUID: task.taskUUID,
              status: 'success',
              outputs: { files: [{ url: 'https://fixture.example/done.glb' }] },
            },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetcher);
    const result = renderTasks([task], 'example');
    await vi.advanceTimersByTimeAsync(1500);
    expect(await result).toEqual(['https://fixture.example/done.glb']);
    expect(JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body))).toEqual([
      { taskType: 'getResponse', taskUUID: task.taskUUID },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('stops on a provider error without starting another paid generation', async () => {
    const task = bust('https://fixture.example/aged.jpg');
    const fetcher = vi.fn(async () =>
      Response.json({
        data: [],
        errors: [{ taskUUID: randomUUID(), code: 'timeoutProvider', status: 'error' }],
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    await expect(renderTasks([task], 'test')).rejects.toThrow('task error');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
