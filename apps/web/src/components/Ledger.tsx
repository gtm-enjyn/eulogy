import type { Run } from '@eulogy/shared';

export default function Ledger({ run }: { run: Run }) {
  return (
    <section>
      <h2>Ledger</h2>
      {run.years.map((y) => (
        <div className="ledger-year" key={y.year_index}>
          <div>
            <span className="age">{y.protagonist_age}</span>{' '}
            <span className="shock">{y.shock}</span>
          </div>
          <ul>
            {y.decisions.map((d, i) => (
              <li key={i}>
                <strong>{d.actor}</strong> {d.action} <span className="reason">— {d.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
