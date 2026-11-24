import type { Run } from '@eulogy/shared';
export default function PrivateFeed({ run, chapter = 5 }: { run: Run; chapter?: number }) {
  const year = run.years[chapter];
  return (
    <section className="private-feed">
      <h2>Private feed</h2>
      {year?.private_messages.map((m, i) => (
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
