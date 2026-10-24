"use client";
import { useState } from "react";
import { Copy, Plus } from "lucide-react";
import { EvidenceSummary } from "./evidence-summary";
import { simpleReportText, summarizeEvidence } from "@/lib/yokai/plain-summary";
import {
  profileLabels,
  statusLabels,
  type Investigation,
} from "@/lib/yokai/types";

export function InvestigationReport({
  job,
  onEvidence,
  onNew,
}: {
  job: Investigation;
  onEvidence: (ids: string[]) => void;
  onNew: () => void;
}) {
  const [copyState, setCopyState] = useState("");
  const result = job.result;
  if (!result) return null;
  const summary = summarizeEvidence(result.captures, result.findings);
  async function copy() {
    try {
      await navigator.clipboard.writeText(simpleReportText(job));
      setCopyState("Simple result copied.");
    } catch {
      setCopyState(
        "Could not copy automatically. You can select and copy the text below.",
      );
    }
  }
  return (
    <article className="yk-panel yk-report">
      <div className="yk-panel-heading">
        <div>
          <span className="yk-eyebrow">YŌKAI / WEBSITE CHECK</span>
          <h2>Your result</h2>
        </div>
        <button className="yk-secondary" onClick={copy}>
          <Copy size={15} /> Copy result
        </button>
      </div>
      {copyState && (
        <p role="status" className="yk-field-note">
          {copyState}
        </p>
      )}
      <div className="yk-simple-address">
        <span className="yk-tag">
          {job.demo ? "FICTIONAL DEMO" : "LIVE CHECK"}
        </span>
        <p className="yk-break">{job.targetUrl}</p>
      </div>
      <EvidenceSummary captures={result.captures} findings={result.findings} />
      <section className="yk-simple-section" aria-label="What we found">
        <h3>What we found</h3>
        {summary.points.length ? (
          <ul className="yk-simple-findings">
            {summary.points.map((point) => (
              <li key={point.title}>
                <h4>{point.title}</h4>
                <p>{point.detail}</p>
                {!!point.evidenceIds.length && (
                  <button
                    className="yk-inline-link"
                    onClick={() => onEvidence(point.evidenceIds)}
                  >
                    See the saved pages ↗
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="yk-simple-copy">
            {summary.complete < 2
              ? "We don’t have enough completed visits to explain what changed."
              : "We did not find a major warning in the pages we compared."}
          </p>
        )}
      </section>
      {summary.disclosure && (
        <p className="yk-simple-disclosure">{summary.disclosure}</p>
      )}
      <section className="yk-simple-action" aria-label="What you should do">
        <span className="yk-eyebrow">YOUR NEXT STEP</span>
        <h3>What you should do</h3>
        <p>{summary.action}</p>
      </section>
      <p className="yk-simple-limit">{summary.limitation}</p>
      <details className="yk-technical-details">
        <summary>Show detailed evidence</summary>
        <div className="yk-technical-body">
          {summary.disclosureEvidence && (
            <section>
              <h3>Website notice, as recorded</h3>
              <p className="yk-field-note">{summary.disclosureEvidence}</p>
            </section>
          )}
          <div className="yk-report-meta">
            <strong>{statusLabels[job.status]}</strong>
            <small>
              {job.profiles.map((p) => profileLabels[p]).join(" / ")} ·{" "}
              {new Date(job.updatedAt).toLocaleString()}
            </small>
          </div>
          <h3>Original findings</h3>
          {result.findings.map((f) => (
            <details className={`yk-finding tone-${f.tone}`} key={f.id}>
              <summary>{f.title}</summary>
              {f.severity && (
                <p className="yk-field-note">Review priority: {f.severity}</p>
              )}
              <p>{f.explanation}</p>
              {f.confidence && <p className="yk-field-note">{f.confidence}</p>}
              <button
                className="yk-inline-link"
                onClick={() => onEvidence(f.evidenceIds)}
              >
                View evidence ({f.evidenceIds.length}) ↗
              </button>
            </details>
          ))}
          <div className="yk-report-columns">
            <section>
              <h3>Risk indicators</h3>
              {result.riskIndicators.length ? (
                <ul>
                  {result.riskIndicators.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  No risk indicators were supplied. This is not a safety
                  guarantee.
                </p>
              )}
            </section>
            <section>
              <h3>Saved pages</h3>
              {result.captures.map((c) => (
                <button
                  className="yk-evidence-link"
                  key={c.id}
                  onClick={() => onEvidence([c.id])}
                >
                  {c.label}
                  <span>{c.availability} ↗</span>
                </button>
              ))}
            </section>
          </div>
          <h3>Full limitations</h3>
          <ul>
            {result.limitations.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3>All recommendations</h3>
          <ol>
            {result.recommendations.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </div>
      </details>
      <button className="yk-primary" onClick={onNew}>
        <Plus size={16} /> Check another website
      </button>
    </article>
  );
}
