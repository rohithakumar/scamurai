import type { BrowserCapture, Finding } from "@/lib/yokai/types";
import { summarizeEvidence } from "@/lib/yokai/plain-summary";

export function EvidenceSummary({
  captures,
  findings,
}: {
  captures: BrowserCapture[];
  findings: Finding[];
}) {
  const summary = summarizeEvidence(captures, findings);
  return (
    <section
      className={`yk-evidence-summary yk-summary-${summary.tone}`}
      aria-label="Investigation evidence summary"
    >
      <div>
        <span className="yk-eyebrow">YOUR RESULT, SIMPLY</span>
        <h3>{summary.title}</h3>
        <p>{summary.description}</p>
      </div>
      <dl>
        <div>
          <dt>Visits completed</dt>
          <dd>
            {summary.complete} / {summary.total}
          </dd>
        </div>
        <div>
          <dt>Warnings to review</dt>
          <dd>{summary.warningCount}</dd>
        </div>
      </dl>
    </section>
  );
}
