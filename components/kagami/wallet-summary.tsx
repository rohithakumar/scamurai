"use client";
import type { WalletAnalysis } from "@/lib/kagami/types";
import { shortAddress, isAddress } from "@/lib/kagami/types";
import { plainPermission, plainWallet } from "@/lib/kagami/plain-summary";
import { plainTransaction } from "@/lib/kagami/plain-summary";
import type { TransactionResult } from "@/lib/kagami/types";

export function TransactionSummary({
  result,
  action,
}: {
  result: TransactionResult;
  action: "decode" | "preview";
}) {
  const summary = plainTransaction(result, action);
  const method = result.functionName?.split("(")[0];
  const address = result.parameters.find(
    (p) => p.name === (method === "approve" ? "spender" : "to"),
  )?.value;
  const amount = result.parameters.find((p) =>
    /^amount(?:\s|$)/.test(p.name),
  )?.value;
  const unlimited = amount === ((1n << 256n) - 1n).toString();
  const readable =
    result.status === "successful" &&
    ["approve", "transfer", "transferFrom"].includes(method || "");
  return (
    <div className="kg-simple-summary">
      <span className="kg-eyebrow">
        {result.demo ? "EXAMPLE RESULT" : "YOUR REQUEST, EXPLAINED"}
      </span>
      <h2>{summary.title}</h2>
      <p>{summary.meaning}</p>
      {readable && (
        <div className="kg-simple-next">
          <h3>What the request says</h3>
          <p>
            Token contract: <code>{shortAddress(result.target)}</code>
          </p>
          {address && isAddress(address) && (
            <p>
              {method === "approve"
                ? "Address getting spending access"
                : "Tokens would go to"}
              : <code>{shortAddress(address)}</code>
            </p>
          )}
          {amount && (
            <p>
              {method === "approve"
                ? "Requested spending limit"
                : "Requested amount"}
              :{" "}
              {amount === "0"
                ? "Zero"
                : unlimited && method === "approve"
                  ? "No set limit"
                  : "An exact amount is included; its human-readable token amount is not confirmed. See the details below."}
            </p>
          )}
        </div>
      )}
      <div className="kg-simple-next">
        <h3>Before you approve</h3>
        <p>{summary.action}</p>
      </div>
    </div>
  );
}

export function WalletSummary({
  analysis,
  onDetails,
  onAll,
}: {
  analysis: WalletAnalysis;
  onDetails: (id: string) => void;
  onAll: () => void;
}) {
  const summary = plainWallet(analysis);
  return (
    <section
      className="kg-panel kg-simple-summary"
      aria-label="Wallet result in plain language"
    >
      <span className="kg-eyebrow">YOUR WALLET CHECK, SIMPLY</span>
      <h2>{summary.title}</h2>
      <p>{summary.meaning}</p>
      <div className="kg-model-summary">
        <div>
          <span>Active permissions found</span>
          <strong>{summary.active}</strong>
        </div>
        <div>
          <span>Without a set spending limit</span>
          <strong>{summary.unlimited}</strong>
        </div>
      </div>
      <p className="kg-simple-coverage">{summary.coverage}</p>
      {!!summary.permissions.length && (
        <>
          <h3>What we found</h3>
          <ul className="kg-simple-permissions">
            {summary.permissions.slice(0, 5).map((permission) => {
              const point = plainPermission(permission);
              return (
                <li key={permission.id}>
                  <h4>{point.title}</h4>
                  <p>{point.meaning}</p>
                  <p className="kg-note">
                    Approved address:{" "}
                    <code>{shortAddress(permission.spender)}</code>
                  </p>
                  <button
                    className="kg-inline-link"
                    onClick={() => onDetails(permission.id)}
                  >
                    See this permission’s details ↗
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="kg-secondary" onClick={onAll}>
            Review token-spending access
          </button>
          {summary.permissions.length > 5 && (
            <p className="kg-note">
              Showing 5 of {summary.permissions.length} active permissions. More
              records are available in the token list and detailed map.
            </p>
          )}
        </>
      )}
      <div className="kg-simple-next">
        <h3>What you should do</h3>
        <p>{summary.nextStep}</p>
      </div>
      <p className="kg-note">
        No money moved. No wallet permissions were changed.
      </p>
    </section>
  );
}
