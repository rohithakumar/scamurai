"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Network,
  Clock3,
  ArrowUpRight,
  ArrowRight,
  LoaderCircle,
  Braces,
  Info,
  RotateCcw,
} from "lucide-react";
import { useWallet } from "@/lib/kagami/use-wallet";
import {
  networks,
  modeledSummary,
  isAddress,
  type ModuleId,
} from "@/lib/kagami/types";
import { AddressValue, EmptyPanel } from "./shared";
import { PermissionDetails, PermissionDialog } from "./permission-details";
import { BreakpointLab } from "./breakpoint-lab";
import { ApprovalTimebomb } from "./approvals";
import { FutureView } from "./futureview";
import { WalletSummary } from "./wallet-summary";
const AuthorityGraph = dynamic(() => import("./authority-graph"), {
  ssr: false,
  loading: () => (
    <div className="kg-panel kg-graph-skeleton" role="status">
      <span>Loading authority graph…</span>
    </div>
  ),
});
const modules = [
  {
    id: "authority" as const,
    label: "Wallet overview",
    short: "Overview",
    description: "Who may use your tokens",
    Icon: Network,
  },
  {
    id: "approvals" as const,
    label: "Token access",
    short: "Token access",
    description: "Review spending permissions",
    Icon: Clock3,
  },
  {
    id: "futureview" as const,
    label: "Check a request",
    short: "New request",
    description: "Understand before you approve",
    Icon: Braces,
  },
];
export function KagamiWorkspace({
  initialModule = "authority",
  initialPurpose = false,
}: {
  initialModule?: ModuleId;
  initialPurpose?: boolean;
}) {
  const state = useWallet();
  const router = useRouter();
  const [module, setModule] = useState<ModuleId>(initialModule);
  const [mounted, setMounted] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [selected, setSelected] = useState("wallet");
  const [detail, setDetail] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [tokenAddress, setTokenAddress] = useState("");
  const [spenderAddress, setSpenderAddress] = useState("");
  const analysis = state.analysis;
  const capability = state.capabilities?.networks.find(
    (n) => n.id === state.network,
  );
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => setModule(initialModule), [initialModule]);
  useEffect(() => {
    setRemoved([]);
    setSelected("wallet");
    setDetail(null);
  }, [analysis?.id, state.wallet, state.network, state.demo]);
  function navigate(id: ModuleId) {
    setModule(id);
    router.replace(`/dashboard/kagami?module=${id}`, { scroll: false });
    requestAnimationFrame(() =>
      document.querySelector(".kg-module-content")?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion:reduce)").matches
          ? "instant"
          : "smooth",
      }),
    );
  }
  function toggle(id: string) {
    const p = analysis?.permissions.find((p) => p.id === id);
    if (
      !p?.active ||
      !p.modelRemovable ||
      !analysis?.graph?.edges.some((e) => e.permissionId === id)
    )
      return;
    setRemoved((previous) =>
      previous.includes(id)
        ? previous.filter((x) => x !== id)
        : [...previous, id],
    );
  }
  function graphPermission(id: string) {
    const node = analysis?.graph?.nodes.find(
      (n) =>
        n.permissionId === id &&
        (n.kind === "permission" || n.kind === "delegation"),
    );
    if (!node) return;
    setDetail(null);
    setShowGraph(true);
    setSelected(node.id);
    navigate("authority");
  }
  const currentNode = analysis?.graph?.nodes.find((n) => n.id === selected);
  const permission = analysis?.permissions.find(
    (p) => p.id === currentNode?.permissionId,
  );
  const selectedPermission = analysis?.permissions.find((p) => p.id === detail);
  const summary = analysis ? modeledSummary(analysis, removed) : null;
  const nav = (mobile: boolean) => (
    <nav
      className={`kg-module-nav ${mobile ? "kg-module-mobile" : ""}`}
      aria-label="KAGAMI modules"
    >
      {modules.map(({ id, label, short, description, Icon }, i) => (
        <button
          key={id}
          aria-current={module === id ? "page" : undefined}
          onClick={() => navigate(id)}
        >
          <Icon size={19} />
          <span>
            <strong>{mobile ? short : label}</strong>
            {!mobile && <small>{description}</small>}
          </span>
          {!mobile && <em>0{i + 1}</em>}
        </button>
      ))}
    </nav>
  );
  return (
    <div className="kg-workspace">
      <header className="kg-hero">
        <div>
          <span className="kg-eyebrow">SCAMURAI / UNDERSTAND YOUR WALLET</span>
          <h1>
            KAGAMI<span>Know what your wallet allows.</span>
          </h1>
          <p>
            See who may spend your tokens and understand a new request before
            you approve it.
          </p>
        </div>
        <div className="kg-hero-symbol" aria-hidden="true">
          <span>鏡</span>
          <small>REFLECT / INSPECT</small>
        </div>
        <Link href="/dashboard">
          All modes <ArrowUpRight size={14} />
        </Link>
      </header>
      <div className="kg-workspace-status">
        <span>
          <i />
          {state.demo ? "Fictional demo" : "Live blockchain data"}
        </span>
        <p>
          {state.demo
            ? "Made-up examples · No live wallet checks"
            : "Only your public address · No wallet login or signature"}
        </p>
        <button className="kg-secondary" onClick={state.changeDemo}>
          {state.demo ? "Use connected service" : "Try a simple example"}
          <ArrowUpRight size={14} />
        </button>
      </div>
      <section className="kg-panel kg-wallet-input">
        <div className="kg-panel-heading">
          <div>
            <span className="kg-eyebrow">START WITH A PUBLIC ADDRESS</span>
            <h2>Check a wallet’s permissions.</h2>
          </div>
          <Wallet size={23} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void state.analyze().then((success) => {
              if (success)
                navigate(module === "futureview" ? "authority" : module);
            });
          }}
        >
          <div className="kg-wallet-fields">
            <label>
              Public wallet address
              <input
                aria-label="Public wallet address"
                aria-invalid={!!state.wallet && !isAddress(state.wallet)}
                value={state.wallet}
                onChange={(e) => state.changeWallet(e.target.value)}
                placeholder="Paste a public wallet address starting with 0x"
                maxLength={42}
                spellCheck={false}
                required
                readOnly={state.demo}
              />
            </label>
            <label>
              Network
              <select
                aria-label="Wallet network"
                value={state.network}
                onChange={(e) =>
                  state.changeNetwork(e.target.value as typeof state.network)
                }
              >
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                    {state.capabilities &&
                    !state.capabilities.networks.some((s) => s.id === n.id)
                      ? " · unsupported"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="kg-primary"
              type="submit"
              disabled={
                state.busy ||
                !state.capabilities?.available ||
                !capability?.walletAnalysis
              }
            >
              {state.busy ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <ArrowRight size={16} />
              )}{" "}
              {state.busy ? "Checking wallet…" : "Check wallet"}
            </button>
          </div>
          <div className="kg-wallet-foot">
            {state.wallet && !isAddress(state.wallet) && (
              <p className="kg-error" role="alert">
                Address format: 0x followed by 40 hexadecimal characters.
              </p>
            )}
            <p>
              {state.demo
                ? "A fixed fictional wallet keeps demo permissions separate from real addresses."
                : "Use only a public address. Never enter a recovery phrase or private key. This check cannot move your money."}
            </p>
            {state.demo && (
              <button
                type="button"
                className="kg-inline-link"
                onClick={state.useExample}
              >
                Use example wallet <ArrowUpRight size={13} />
              </button>
            )}
            {state.busy && (
              <button
                type="button"
                className="kg-inline-link"
                onClick={state.cancelRequest}
              >
                Stop waiting
              </button>
            )}
          </div>
          {!state.demo && (
            <details className="kg-specific-allowance">
              <summary>Check one token and approved address (optional)</summary>
              <p className="kg-note">
                If a permission is missing from the list, check its token and
                approved address directly. This reads the current spending
                limit; it does not grant access.
              </p>
              <div className="kg-specific-fields">
                <label>
                  Token contract address
                  <input
                    aria-label="Allowance token contract"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="0x…"
                    maxLength={42}
                    spellCheck={false}
                    disabled={state.busy}
                  />
                </label>
                <label>
                  Approved address (app or wallet)
                  <input
                    aria-label="Allowance spender address"
                    value={spenderAddress}
                    onChange={(e) => setSpenderAddress(e.target.value)}
                    placeholder="0x…"
                    maxLength={42}
                    spellCheck={false}
                    disabled={state.busy}
                  />
                </label>
              </div>
              <button
                type="button"
                className="kg-secondary"
                disabled={state.busy || !capability?.walletAnalysis}
                onClick={() => {
                  void state
                    .checkAllowance(tokenAddress, spenderAddress)
                    .then((success) => {
                      if (success) navigate("authority");
                    });
                }}
              >
                Check spending access <ArrowRight size={15} />
              </button>
            </details>
          )}
          {state.error && (
            <div className="kg-error kg-error-row" role="alert">
              <span>{state.error}</span>
              <button
                className="kg-secondary"
                type="button"
                onClick={state.retry}
              >
                <RotateCcw size={13} /> Retry connection
              </button>
            </div>
          )}
          {!state.capabilities?.available && state.capabilities && (
            <p className="kg-notice">
              {state.capabilities.limitations.join(" ")}
            </p>
          )}
          {state.capabilities?.available && !capability?.walletAnalysis && (
            <p className="kg-notice">
              {networks.find((n) => n.id === state.network)?.label} is not
              connected yet. Your address is kept. Choose a connected network or
              retry the connection.
            </p>
          )}
        </form>
      </section>
      {nav(false)}
      {mounted && createPortal(nav(true), document.body)}
      {state.storageNote && <p className="kg-note">{state.storageNote}</p>}
      <div className="kg-module-content" key={module}>
        {module === "futureview" ? (
          <FutureView
            key={`${state.network}-${state.wallet}-${state.demo}`}
            wallet={state.wallet}
            network={state.network}
            demo={state.demo}
            capabilities={state.capabilities}
            initialPurpose={initialPurpose}
          />
        ) : analysis ? (
          <>
            <div className="kg-analysis-context">
              <div>
                <span
                  className={`kg-badge status-${analysis.status === "partial" ? "Limited check" : analysis.status === "completed" ? "Check finished" : analysis.status}`}
                >
                  {analysis.status === "partial"
                    ? "Limited check"
                    : analysis.status === "completed"
                      ? "Check finished"
                      : analysis.status}
                </span>
                <span className="kg-badge">
                  {analysis.demo ? "DEMO EXAMPLE" : "LIVE DATA"}
                </span>
                <strong>
                  {networks.find((n) => n.id === analysis.network)?.label}
                </strong>
              </div>
              <AddressValue
                value={analysis.wallet}
                network={analysis.network}
                demo={analysis.demo}
              />
              <p className="kg-note">
                Recorded {new Date(analysis.checkedAt).toLocaleString()}
                {analysis.demo ? " · Example data" : ""}. This is a limited
                check; other permissions may be missing.
              </p>
              {analysis.error && <p className="kg-error">{analysis.error}</p>}
            </div>
            {analysis.status === "pending" ? (
              <section className="kg-panel kg-pending" role="status">
                <LoaderCircle className="spin" size={24} />
                <h2>The service is analyzing this wallet.</h2>
                <p>
                  Waiting for returned evidence. No progress percentage is
                  inferred.
                </p>
              </section>
            ) : analysis.status === "failed" ||
              analysis.status === "unsupported" ? (
              <section className="kg-panel">
                <EmptyPanel
                  title="We could not complete this wallet check."
                >
                  {analysis.error ||
                    "The service did not return a completed analysis for this target."}
                </EmptyPanel>
              </section>
            ) : module === "approvals" ? (
              <ApprovalTimebomb
                analysis={analysis}
                onDetails={setDetail}
                onGraph={graphPermission}
              />
            ) : (
              <>
                <WalletSummary
                  analysis={analysis}
                  onDetails={setDetail}
                  onAll={() => navigate("approvals")}
                />
                <details
                  className="kg-advanced"
                  open={showGraph}
                  onToggle={(e) => setShowGraph(e.currentTarget.open)}
                >
                  <summary>
                    Explore the permission map and test changes (advanced)
                  </summary>
                  {showGraph && (
                    <>
                      <div className="kg-authority-layout">
                        <AuthorityGraph
                          analysis={analysis}
                          removed={removed}
                          selected={selected}
                          onSelect={setSelected}
                        />
                        <aside className="kg-panel kg-authority-detail">
                          {permission ? (
                            <PermissionDetails
                              permission={permission}
                              analysis={analysis}
                              removed={removed.includes(permission.id)}
                              onToggle={toggle}
                              onGraph={graphPermission}
                            />
                          ) : (
                            <>
                              <span className="kg-eyebrow">
                                SELECTED OBSERVATION
                              </span>
                              <h3>
                                {currentNode?.label || "Investigated wallet"}
                              </h3>
                              {currentNode?.address && (
                                <AddressValue
                                  value={currentNode.address}
                                  network={analysis.network}
                                  demo={analysis.demo}
                                />
                              )}
                              <p className="kg-note">
                                Select a permission node or graph relationship
                                to inspect its exact allowance, implementation
                                address, and supporting evidence.
                              </p>
                              <div className="kg-wallet-model-count">
                                <strong>{summary?.remaining ?? 0}</strong>
                                <span>Active modeled paths remaining</span>
                              </div>
                              {analysis.findings.map((f) => (
                                <p className="kg-notice" key={f}>
                                  {f}
                                </p>
                              ))}
                            </>
                          )}
                        </aside>
                      </div>
                      <BreakpointLab
                        analysis={analysis}
                        removed={removed}
                        onToggle={toggle}
                        onReset={() => setRemoved([])}
                      />
                    </>
                  )}
                </details>
              </>
            )}
            <details className="kg-panel kg-limitations kg-advanced">
              <summary>What this check could not cover</summary>
              <div className="kg-panel-heading">
                <h3>Coverage & limitations</h3>
                <Info size={18} />
              </div>
              <ul>
                {analysis.limitations.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <section className="kg-panel kg-get-started">
            <EmptyPanel
              title={
                module === "authority"
                  ? "Start with a public wallet address."
                  : "See who can spend your tokens."
              }
            >
              {module === "authority"
                ? "Paste the wallet address above and choose Check wallet. We will explain the permissions we can find, in everyday language."
                : "Check a wallet to review its saved spending permissions. This does not change anything in the wallet."}
            </EmptyPanel>
            <div className="kg-start-columns">
              <div>
                <Network size={20} />
                <strong>Understand the permission</strong>
                <p>
                  See which token an address may use, and whether a spending
                  limit is set.
                </p>
              </div>
              <div>
                <Clock3 size={20} />
                <strong>Know the limits</strong>
                <p>
                  Some permissions may be missing. A clean result does not prove
                  the wallet is safe.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
      <footer className="kg-footer">
        <span>NO SIGNING. NO MONEY MOVED. / SCAMURAI</span>
        <Link href="/dashboard/kagami/inspect">
          Advanced request inspector <ArrowUpRight size={12} />
        </Link>
      </footer>
      {selectedPermission && analysis && (
        <PermissionDialog
          permission={selectedPermission}
          analysis={analysis}
          removed={removed.includes(selectedPermission.id)}
          onToggle={toggle}
          onGraph={graphPermission}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
