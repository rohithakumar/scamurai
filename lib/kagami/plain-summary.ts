import {
  formatAllowance,
  type Permission,
  type WalletAnalysis,
  type TransactionResult,
} from "./types";

export function plainPermission(permission: Permission) {
  const asset = permission.symbol || "This token";
  if (permission.type === "delegation")
    return {
      title: "This wallet uses code from another address.",
      meaning:
        "That code can affect how this wallet works. We found the code link, but did not check what the code can do.",
      amount: "Wallet code access",
    };
  if (!permission.active || permission.allowanceKind === "zero")
    return {
      title: `${asset}: no spending access in this record.`,
      meaning:
        "This saved permission currently allows no spending. Other permissions may still exist.",
      amount: "No spending allowed",
    };
  if (permission.allowanceKind === "unlimited")
    return {
      title: `${asset}: no set spending limit.`,
      meaning:
        "This permission can let the approved address spend this token, including tokens you add later. It does not prove that the address is harmful or that money was taken.",
      amount: "No set limit",
    };
  return {
    title: `${asset}: spending access has a limit.`,
    meaning:
      "The approved address may spend up to the saved limit for this token. Check whether you still need this permission.",
    amount:
      permission.allowanceRaw === null
        ? "Amount unavailable"
        : permission.decimals === null
          ? "Limited amount — token size unknown"
          : formatAllowance(permission),
  };
}

export function plainWallet(analysis: WalletAnalysis) {
  const unavailable =
    ["failed", "unsupported", "pending"].includes(analysis.status) ||
    (analysis.coverage.approvals === "unavailable" &&
      analysis.coverage.delegations === "unavailable");
  const active = analysis.permissions.filter((p) => p.active);
  const unlimited = active.filter(
    (p) => p.type === "erc20" && p.allowanceKind === "unlimited",
  );
  return {
    active: active.length,
    unlimited: unlimited.length,
    permissions: [...active].sort(
      (a, b) =>
        Number(b.allowanceKind === "unlimited") -
        Number(a.allowanceKind === "unlimited"),
    ),
    title: unavailable
      ? "We could not complete this wallet check."
      : unlimited.length
        ? "Some token permissions have no set spending limit."
        : active.length
          ? "This wallet has permissions worth reviewing."
          : "No active permission was found in the data we checked.",
    meaning: unavailable
      ? "The missing data cannot tell us whether this wallet has spending permissions."
      : "A permission can let an app or another wallet use particular tokens. Finding a permission does not mean money has been stolen.",
    nextStep: unavailable
      ? "Try again when the connection is working. Do not treat missing results as a safety check."
      : active.length
        ? "Check the approved addresses and whether you still use them. Remove unwanted access only through your wallet or a trusted permission manager. This app does not remove it for you."
        : "Stay cautious. A limited check cannot prove that your wallet has no other permissions or is safe.",
    coverage:
      analysis.coverage.approvals === "complete"
        ? "The returned spending records were checked. This is not a complete wallet security audit."
        : analysis.coverage.approvals === "unavailable"
          ? "We could not read token-spending history. Other returned information may still be useful."
          : "We could only check part of the wallet’s history. Other permissions may be missing.",
  };
}

export function plainTransaction(
  result: TransactionResult,
  action: "decode" | "preview",
) {
  const failed = [
    "failed",
    "unsupported",
    "inconclusive",
    "pending",
    "reverted",
  ].includes(result.status);
  const method = result.functionName?.split("(")[0];
  const zeroApproval =
    method === "approve" &&
    result.parameters.some(
      (p) => /^amount(?:\s|$)/.test(p.name) && p.value === "0",
    );
  const title = failed
    ? result.status === "reverted"
      ? "This request failed in the test."
      : result.status === "unsupported"
        ? "We cannot explain this request yet."
        : "We could not confirm what this request would do."
    : action === "preview" && !result.effects.length
      ? "We could not confirm the expected changes."
      : method === "approve"
        ? action === "decode"
          ? zeroApproval
            ? "This request asks to remove token-spending access."
            : "This request asks to allow token spending."
          : "The test predicts a change to token-spending access."
        : method === "transfer" || method === "transferFrom"
          ? action === "decode"
            ? "This request asks to move tokens."
            : "The test checked a token transfer."
          : "Read the request carefully before approving it.";
  return {
    title,
    meaning: failed
      ? "Do not assume the request is safe or that it will work. Check with the app before approving anything."
      : action === "decode"
        ? "We translated the request’s instructions. This does not test whether the transaction will succeed."
        : result.effects.length
          ? "We tested supported changes against blockchain data. The real outcome can still be different."
          : "The service returned no supported changes to compare. That does not mean the request has no effect.",
    action:
      "Confirm the app, address, and amount before you approve anything. No transaction was signed or sent by this check.",
  };
}
