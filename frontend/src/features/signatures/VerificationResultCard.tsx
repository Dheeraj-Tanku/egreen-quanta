import { Badge, Card, type Severity } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { CertInfo, Finding, VerificationResult } from "@/types/api";

const VERDICT_TONE: Record<VerificationResult["verdict"], Severity> = {
  valid: "ok",
  invalid: "critical",
  indeterminate: "medium",
};

const SEV_ORDER: Record<Finding["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function VerificationResultCard({ result }: { result: VerificationResult }) {
  const findings = [...result.findings].sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity],
  );

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-3">
        <Badge severity={VERDICT_TONE[result.verdict]} className="text-xs">
          {result.verdict}
        </Badge>
        <span className="text-xs uppercase tracking-wide text-muted">{result.envelope}</span>
        <span className="text-sm text-fg">{result.summary}</span>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {result.signature && (
          <Card>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Signature
            </h4>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
              <Row k="Algorithm" v={result.signature.algorithm} />
              <Row k="Digest" v={result.signature.hash_alg ?? "—"} />
              {result.signature.padding && <Row k="Padding" v={result.signature.padding} />}
              <Row
                k="Key"
                v={[
                  result.signature.key_type,
                  result.signature.key_bits ? `${result.signature.key_bits}-bit` : null,
                  result.signature.curve,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              {result.signature.low_s !== null && (
                <Row k="Low-S" v={result.signature.low_s ? "yes" : "no (malleable)"} />
              )}
              {result.signing_time && (
                <Row k="Signing time" v={formatDateTime(result.signing_time)} />
              )}
              <Row
                k="Timestamp"
                v={
                  result.tsa_present
                    ? result.tsa_trusted
                      ? "present, trusted"
                      : "present, untrusted"
                    : "none"
                }
              />
            </dl>
          </Card>
        )}

        {result.chain && (
          <Card>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Certificate chain
            </h4>
            <div className="mb-2">
              <Badge
                severity={
                  result.chain.status === "trusted"
                    ? "ok"
                    : result.chain.status === "error"
                      ? "critical"
                      : "medium"
                }
              >
                {result.chain.status}
              </Badge>
              {result.revocation && result.revocation.status !== "not_checked" && (
                <Badge
                  className="ml-2"
                  severity={result.revocation.status === "revoked" ? "critical" : "info"}
                >
                  revocation: {result.revocation.status}
                </Badge>
              )}
            </div>
            <ol className="space-y-1.5">
              {result.chain.chain.map((c, i) => (
                <CertRow key={c.spki_sha256 + i} cert={c} depth={i} />
              ))}
            </ol>
            {result.chain.error && (
              <p className="mt-2 text-xs text-critical">{result.chain.error}</p>
            )}
          </Card>
        )}
      </div>

      <Card>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Findings ({findings.length})
        </h4>
        {findings.length === 0 ? (
          <p className="text-sm text-ok">No issues detected.</p>
        ) : (
          <ul className="space-y-2">
            {findings.map((f, i) => (
              <li key={f.code + i} className="flex gap-2.5 text-sm">
                <Badge severity={f.severity as Severity}>{f.severity}</Badge>
                <div>
                  <span className="font-medium text-fg">
                    {f.code} · {f.title}
                  </span>
                  {f.detail && <p className="text-xs text-muted">{f.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted">{k}</dt>
      <dd className="truncate text-fg" title={v}>
        {v}
      </dd>
    </>
  );
}

function CertRow({ cert, depth }: { cert: CertInfo; depth: number }) {
  return (
    <li className="rounded-lg border border-border bg-surface-2/40 p-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted">{depth === 0 ? "leaf" : `#${depth}`}</span>
        <span className="truncate font-medium text-fg" title={cert.subject}>
          {cert.subject}
        </span>
        {cert.is_ca && <Badge severity="info">CA</Badge>}
      </div>
      <div className="mt-0.5 text-muted">
        {cert.sig_algo} · {cert.key_type}
        {cert.key_bits ? `-${cert.key_bits}` : ""} {cert.curve ?? ""} · exp{" "}
        {formatDateTime(cert.not_after)}
      </div>
    </li>
  );
}
