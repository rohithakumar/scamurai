import type { BrowserCapture, Finding, Investigation } from "./types";

export interface SimplePoint {
  title: string;
  detail: string;
  evidenceIds: string[];
}

function isWarning(finding: Finding) {
  return (
    finding.tone === "sensitive" ||
    finding.severity === "high" ||
    finding.severity === "medium"
  );
}

function simplify(finding: Finding, captures: BrowserCapture[]): SimplePoint {
  const id = finding.id;
  let title = "Something needs a closer look.";
  let detail =
    "Review the saved page before trusting the website. The full finding is available in the detailed evidence.";
  if (id === "secret-request") {
    title = "The site asks for wallet recovery secrets.";
    detail =
      "These details can give someone control of your wallet. Do not enter your recovery phrase or private key.";
  } else if (id === "unsafe-sensitive-form") {
    title = "A form could expose sensitive information.";
    detail =
      "The form uses an unencrypted connection or puts information in a web address. Do not enter passwords, card details, or login codes.";
  } else if (id === "guaranteed-returns") {
    title = "The site claims guaranteed investment returns.";
    detail =
      "We recorded this claim, but did not verify it. Check the company through a trusted, independent source before sending money.";
  } else if (id.startsWith("forms-") || id === "payment-only") {
    title =
      finding.tone === "sensitive"
        ? "The site asks for sensitive information differently between visits."
        : "The forms changed between visits.";
    detail =
      finding.tone === "sensitive"
        ? "The fields or destination of a form changed. Confirm why before entering personal or payment details. We did not fill in or send the form."
        : "A form showed different fields or a different destination. This can be normal, but it is worth checking.";
  } else if (id.startsWith("content-") && finding.tone === "sensitive") {
    title = "Some visitors see different payment-related content.";
    detail =
      "A deposit, payment, or financial offer appeared differently between visits. Check the offer independently before paying. This alone does not prove a scam.";
    const captured = captures
      .filter(
        (c) =>
          finding.evidenceIds.includes(c.id) && c.availability === "complete",
      )
      .sort(
        (a, b) =>
          Number(b.profileId === "mobile") - Number(a.profileId === "mobile"),
      );
    const example = captured.flatMap((c) =>
      (c.structure?.headings || [])
        .filter(
          (text) =>
            /deposit|payment/i.test(text) && !/absent|no real/i.test(text),
        )
        .map((text) => ({
          text,
          visit:
            c.profileId === "mobile"
              ? "phone"
              : c.profileId === "desktop"
                ? "computer"
                : "return-visit test",
        })),
    )[0];
    if (example)
      detail = `On the ${example.visit} visit, we recorded “${example.text.slice(0, 180)}”. Check the offer independently before paying. This alone does not prove a scam.`;
  } else if (id.startsWith("redirect-") || id.startsWith("navigation-")) {
    title = "Visitors were sent to different pages or websites.";
    detail =
      "Check that the destination belongs to the organisation you intended to visit. Different destinations can also be normal.";
  } else if (id.startsWith("network-")) {
    title = "The page loaded different resources between visits.";
    detail =
      "Different images, fonts, or other files can be normal on a phone and a computer. This does not show that personal information was sent.";
  } else if (id.startsWith("content-") || id === "layout") {
    title = "The page looked different between visits.";
    detail =
      "Websites often adjust their layout and content for different visitors. This change alone does not prove a scam.";
  }
  return { title, detail, evidenceIds: finding.evidenceIds };
}

export function summarizeEvidence(
  captures: BrowserCapture[],
  findings: Finding[],
) {
  const complete = captures.filter((c) => c.availability === "complete").length;
  const incomplete = complete < 2 || complete < captures.length;
  const warnings = findings.filter(isWarning);
  const secret = warnings.some((f) => f.id === "secret-request");
  const exposed = warnings.some((f) => f.id === "unsafe-sensitive-form");
  const selected = warnings.length
    ? warnings
    : findings.filter(
        (f) =>
          !["no-material-difference", "insufficient-captures"].includes(f.id) &&
          f.tone !== "unavailable",
      );
  const priority = (f: Finding) =>
    f.id === "secret-request"
      ? 0
      : f.id === "unsafe-sensitive-form"
        ? 1
        : f.severity === "high"
          ? 2
          : 3;
  const grouped = new Map<string, SimplePoint>();
  for (const finding of [...selected].sort(
    (a, b) => priority(a) - priority(b),
  )) {
    const point = simplify(finding, captures);
    const previous = grouped.get(point.title);
    if (previous)
      previous.evidenceIds = [
        ...new Set([...previous.evidenceIds, ...point.evidenceIds]),
      ];
    else grouped.set(point.title, point);
  }
  const points = warnings.length
    ? [...grouped.values()]
    : [...grouped.values()].slice(0, 3);
  const pageText = captures.flatMap((c) =>
    c.structure
      ? [...c.structure.headings, ...(c.structure.textBlocks || [])]
      : [],
  );
  const testDisclosure = pageText.find((text) =>
    /fictional.{0,45}(?:test|fixture)|no real payments/i.test(text),
  );
  const title = incomplete
    ? "We couldn’t finish every check."
    : secret || exposed
      ? "Pause before sharing any information."
      : warnings.length
        ? "Check this website before continuing."
        : "No major warning found in this check.";
  const description = incomplete
    ? `Only ${complete} of ${captures.length} visits finished. Important changes may be missing.`
    : warnings.length
      ? "We found something worth checking. It does not automatically mean this website is a scam."
      : "We did not spot a major warning during these visits. This is not a guarantee that the website is safe.";
  const action = secret
    ? "Do not enter your wallet recovery phrase or private key."
    : exposed
      ? "Do not enter sensitive details into this form. Use a trusted way to contact the organisation."
      : incomplete
        ? "Try the check again. If warnings are listed below, review them before continuing."
        : warnings.length
          ? "Pause before paying or sharing details. Check the company and its website using a trusted source."
          : "Stay cautious. Check the web address and who is asking before you pay or share personal details.";
  return {
    title,
    description,
    action,
    points,
    complete,
    total: captures.length,
    warningCount: warnings.length ? grouped.size : 0,
    tone: incomplete ? "incomplete" : warnings.length ? "review" : "neutral",
    disclosure: testDisclosure
      ? `The page says: “${testDisclosure.slice(0, 240)}” This is the page’s claim, not proof of safety.`
      : undefined,
    limitation:
      "We only checked the pages that loaded during these visits. We did not click through every page, sign in, or test a payment.",
  };
}

export function simpleReportText(job: Investigation): string {
  if (!job.result) return "No completed result is available.";
  const summary = summarizeEvidence(job.result.captures, job.result.findings);
  return [
    `YŌKAI result${job.demo ? " — FICTIONAL DEMO" : ""}`,
    `Website: ${job.targetUrl}`,
    `Checked: ${new Date(job.updatedAt).toISOString()}`,
    summary.title,
    summary.description,
    "What we found",
    ...summary.points.map((p) => `• ${p.title} ${p.detail}`),
    summary.points.length
      ? ""
      : summary.complete < 2
        ? "We do not have enough completed visits to explain what changed."
        : "No major warning was found in the pages we compared.",
    summary.disclosure || "",
    "What you should do",
    summary.action,
    `Visits completed: ${summary.complete} of ${summary.total}`,
    "What this check cannot tell you",
    summary.limitation,
  ]
    .filter(Boolean)
    .join("\n\n");
}
