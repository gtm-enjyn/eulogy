import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { Run } from '@eulogy/shared';
const addressed = z.object({
  run_id: z.string(),
  year_index: z.number(),
  channel: z.string(),
  from: z.string(),
  to: z.string().nullable().optional(),
  text: z.string(),
  mode: z.enum(['dry-run', 'live']),
});
type Addressed = z.infer<typeof addressed>;
export default function PrivateFeed({ run, chapter = 5 }: { run: Run; chapter?: number }) {
  const [transcript, setTranscript] = useState<Addressed[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/data/band.jsonl', { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) return;
        const rows = (await r.text())
          .trim()
          .split('\n')
          .flatMap((line) => {
            const result = addressed.safeParse(JSON.parse(line));
            return result.success ? [result.data] : [];
          });
        setTranscript(rows);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const year = run.years[chapter];
  const scoped = transcript.filter(
    (row) => row.run_id === run.run_id && row.year_index === chapter && row.channel === 'private',
  );
  const messages = scoped.length ? scoped : (year?.private_messages ?? []);
  return (
    <section className="private-feed">
      <h2>Private feed</h2>
      {scoped.length > 0 && <small>BAND · {scoped[0]!.mode} transcript</small>}
      {messages.map((m, i) => (
        <p key={i}>
          <small>
            {m.from} → {m.to}
          </small>
          {m.text}
        </p>
      ))}
      {chapter === run.years.length - 1 &&
        run.eulogies
          .filter((e) => !e.speaks)
          .map((e) => (
            <p key={e.relative_id}>
              <small>{e.relative_id} · unspoken</small>
              {e.text}
            </p>
          ))}
    </section>
  );
}
