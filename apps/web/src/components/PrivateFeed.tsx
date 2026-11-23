import type { Run } from '@eulogy/shared';

export default function PrivateFeed({ run }: { run: Run }) {
  const messages = run.years.flatMap((y) =>
    y.private_messages.map((m) => ({ ...m, age: y.protagonist_age })),
  );
  return (
    <section>
      <h2>Private feed</h2>
      {messages.map((m, i) => (
        <div className="feed-msg" key={i}>
          <div className="who">
            {m.from} → {m.to} · {m.age}
          </div>
          <div>{m.text}</div>
        </div>
      ))}
    </section>
  );
}
