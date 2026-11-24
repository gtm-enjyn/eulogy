import type { Run } from '@eulogy/shared';

export default function Ledger({
  run,
  active,
  onlyActive = false,
}: {
  run: Run;
  active?: number;
  onlyActive?: boolean;
}) {
  return (
    <section>
      <h2>Decision ledger</h2>
      {run.years
        .filter((y) => !onlyActive || y.year_index === active)
        .map((y) => (
          <div
            className={'ledger-year' + (y.year_index === active ? ' active' : '')}
            key={y.year_index}
          >
            <small className="ledger-origin">
              {y.generation ?? 'Archived chapter'}
              {y.shock_source ? ' · ' + y.shock_source : ''}
            </small>
            <div>
              <span className="age">{y.protagonist_age}</span>{' '}
              <span className="shock">{y.shock}</span>
              {y.source_url && (
                <a href={y.source_url} target="_blank" rel="noreferrer">
                  {' '}
                  Telem source ↗
                </a>
              )}
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
