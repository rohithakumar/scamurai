"use client";
import { useEffect, useRef } from "react";
import { X, ArrowUpRight, Scissors, RotateCcw } from "lucide-react";
import {
  formatAllowance,
  networks,
  type Permission,
  type WalletAnalysis,
} from "@/lib/kagami/types";
import { AddressValue, CopyValue, SeverityBadge } from "./shared";
import { plainPermission } from "@/lib/kagami/plain-summary";
export function PermissionDetails({
  permission,
  analysis,
  removed,
  onToggle,
  onGraph,
}: {
  permission: Permission;
  analysis: WalletAnalysis;
  removed: boolean;
  onToggle: (id: string) => void;
  onGraph: (id: string) => void;
}) {
  const plain = plainPermission(permission);
  const modeled = analysis.graph?.nodes.some(
    (n) => n.permissionId === permission.id,
  );
  return (
    <div className="kg-permission-detail">
      <span className="kg-eyebrow">
        {permission.type === "erc20"
          ? "TOKEN SPENDING AUTHORITY"
          : "EXECUTION AUTHORITY"}
      </span>
      <h3>{plain.title}</h3>
      <SeverityBadge severity={permission.severity} />
      <p>{plain.meaning}</p>
      <details className="kg-advanced">
        <summary>Show exact addresses and supporting evidence</summary>
        <p>{permission.explanation}</p>
        <dl>
          <div>
            <dt>Owner</dt>
            <dd>
              <AddressValue
                value={permission.owner}
                network={analysis.network}
                demo={analysis.demo}
              />
            </dd>
          </div>
          <div>
            <dt>
              {permission.type === "delegation" ? "Implementation" : "Spender"}
            </dt>
            <dd>
              <AddressValue
                value={permission.spender}
                network={analysis.network}
                demo={analysis.demo}
              />
            </dd>
          </div>
          {permission.token && (
            <div>
              <dt>Token contract</dt>
              <dd>
                <AddressValue
                  value={permission.token}
                  network={analysis.network}
                  demo={analysis.demo}
                />
              </dd>
            </div>
          )}
          <div>
            <dt>Permission</dt>
            <dd>{formatAllowance(permission)}</dd>
          </div>
          {permission.allowanceRaw !== null && (
            <div>
              <dt>Exact raw allowance</dt>
              <dd>
                <CopyValue
                  value={permission.allowanceRaw}
                  label="Copy exact raw allowance"
                />
              </dd>
            </div>
          )}
          <div>
            <dt>Recorded at</dt>
            <dd>
              {new Date(permission.checkedAt).toLocaleString()}
              {analysis.demo && " · Fixture timestamp"}
            </dd>
          </div>
        </dl>
        <details open className="kg-evidence">
          <summary>
            Supporting evidence · {permission.evidenceIds.length}
          </summary>
          {analysis.evidence
            .filter((e) => permission.evidenceIds.includes(e.id))
            .map((e) => (
              <div key={e.id}>
                <span className="kg-badge">{e.source}</span>
                <strong>{e.label}</strong>
                <p>{e.reference}</p>
                {e.transactionHash && (
                  <>
                    <CopyValue
                      value={e.transactionHash}
                      label="Copy evidence transaction hash"
                    />
                    {!analysis.demo && (
                      <a
                        className="kg-inline-link"
                        href={`${networks.find((n) => n.id === analysis.network)!.explorer}/tx/${e.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View transaction evidence ↗
                      </a>
                    )}
                  </>
                )}
              </div>
            ))}
        </details>
      </details>
      <p className="kg-note">
        Map changes below are previews only. They do not remove real wallet
        permissions.
      </p>
      <div className="kg-detail-actions">
        {modeled && (
          <button
            className="kg-secondary"
            onClick={() => onGraph(permission.id)}
          >
            Show in permission map <ArrowUpRight size={14} />
          </button>
        )}
        {permission.modelRemovable && permission.active && modeled ? (
          <button
            className="kg-secondary"
            onClick={() => onToggle(permission.id)}
          >
            {removed ? <RotateCcw size={14} /> : <Scissors size={14} />}{" "}
            {removed ? "Restore in preview" : "Test removal in the map"}
          </button>
        ) : (
          <p className="kg-note">
            {permission.active
              ? "This permission has no supported removal model."
              : "This record contributes no active modeled path."}
          </p>
        )}
      </div>
    </div>
  );
}
export function PermissionDialog({
  permission,
  analysis,
  removed,
  onToggle,
  onGraph,
  onClose,
}: {
  permission: Permission;
  analysis: WalletAnalysis;
  removed: boolean;
  onToggle: (id: string) => void;
  onGraph: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="kg-dialog"
      aria-label="Permission evidence details"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <span className="kg-eyebrow">PERMISSION DETAILS</span>
        <button
          className="kg-icon-button"
          aria-label="Close permission details"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </header>
      <PermissionDetails
        permission={permission}
        analysis={analysis}
        removed={removed}
        onToggle={onToggle}
        onGraph={onGraph}
      />
    </dialog>
  );
}
