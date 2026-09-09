import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Badge, Button, Card, Field, Input, Select, type Severity } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { PortfolioItem, PortfolioResult, QESBand, QESResult } from "@/types/api";

const BAND_TONE: Record<QESBand, Severity> = {
  ok: "ok",
  monitor: "low",
  plan: "medium",
  immediate: "critical",
};

function bandColor(qes: number): string {
  if (qes >= 75) return "rgb(244 63 94)";
  if (qes >= 50) return "rgb(250 204 21)";
  if (qes >= 25) return "rgb(96 165 250)";
  return "rgb(52 211 153)";
}

export function QuantumRiskPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <ScoreForm />
      <Portfolio />
    </div>
  );
}

function ScoreForm() {
  const [algo, setAlgo] = useState("rsa");
  const [keyBits, setKeyBits] = useState("2048");
  const [curve, setCurve] = useState("secp256r1");
  const [life, setLife] = useState("7");
  const [exposure, setExposure] = useState("transmitted");

  const score = useMutation<QESResult, ApiError>({
    mutationFn: () =>
      api.post<QESResult>("/quantum/pq-risk/score", {
        algo,
        key_bits: algo === "rsa" ? Number(keyBits) : null,
        curve: algo === "ec" ? curve : null,
        data_lifetime_years: Number(life),
        exposure,
      }),
  });

  const isEc = algo === "ec";
  const r = score.data;

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-semibold">Score a signature</h3>
      <Field label="Algorithm" htmlFor="q-algo">
        <Select id="q-algo" value={algo} onChange={(e) => setAlgo(e.target.value)}>
          <option value="rsa">RSA</option>
          <option value="ec">ECDSA / ECDH</option>
          <option value="ed25519">Ed25519</option>
          <option value="ml-dsa">ML-DSA (Dilithium)</option>
          <option value="slh-dsa">SLH-DSA (SPHINCS+)</option>
        </Select>
      </Field>
      {algo === "rsa" && (
        <Field label="Key size (bits)" htmlFor="q-bits">
          <Select id="q-bits" value={keyBits} onChange={(e) => setKeyBits(e.target.value)}>
            {["1024", "2048", "3072", "4096", "7680", "15360"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
      )}
      {isEc && (
        <Field label="Curve" htmlFor="q-curve">
          <Select id="q-curve" value={curve} onChange={(e) => setCurve(e.target.value)}>
            <option value="secp256r1">P-256</option>
            <option value="secp384r1">P-384</option>
            <option value="secp521r1">P-521</option>
          </Select>
        </Field>
      )}
      <Field label="Data must stay trustworthy (years)" htmlFor="q-life">
        <Input
          id="q-life"
          type="number"
          min={0}
          max={50}
          value={life}
          onChange={(e) => setLife(e.target.value)}
        />
      </Field>
      <Field label="Exposure" htmlFor="q-exp">
        <Select id="q-exp" value={exposure} onChange={(e) => setExposure(e.target.value)}>
          <option value="public">Public (published)</option>
          <option value="transmitted">Transmitted over the network</option>
          <option value="internal">Internal only</option>
          <option value="sealed">Sealed / air-gapped</option>
        </Select>
      </Field>
      <Button onClick={() => score.mutate()} disabled={score.isPending}>
        {score.isPending ? "Scoring…" : "Compute QES"}
      </Button>

      {r && (
        <div className="rounded-lg border border-border bg-surface-2/40 p-3">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-semibold tabular-nums"
              style={{ color: bandColor(r.qes) }}
            >
              {r.qes}
            </span>
            <Badge severity={BAND_TONE[r.band]}>{r.band}</Badge>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] text-muted">
            {(
              [
                ["algo", r.algo_factor],
                ["strength", r.strength_factor],
                ["longevity", r.longevity_factor],
                ["exposure", r.exposure_factor],
              ] as [string, number][]
            ).map(([k, v]) => (
              <div key={k} className="rounded bg-surface p-1">
                <div className="text-fg tabular-nums">{v}</div>
                {k}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-fg">{r.recommendation}</p>
        </div>
      )}
      {score.error && <p className="text-xs text-critical">{score.error.message}</p>}
    </Card>
  );
}

function Portfolio() {
  const [life, setLife] = useState("7");
  const run = useMutation<PortfolioResult, ApiError>({
    mutationFn: () =>
      api.post<PortfolioResult>("/quantum/pq-risk/portfolio", {
        lookback_days: 30,
        data_lifetime_years: Number(life),
        exposure: "public",
      }),
  });

  return (
    <Card className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Portfolio quantum-risk heatmap</h3>
          <p className="text-xs text-muted">
            Every signing identity seen in the last 30 days, scored for HNDL exposure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={life}
            min={0}
            max={50}
            onChange={(e) => setLife(e.target.value)}
            className="h-8 w-16 py-0"
          />
          <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? "Scoring…" : "Score portfolio"}
          </Button>
        </div>
      </div>

      {run.data ? (
        run.data.items.length === 0 ? (
          <p className="text-sm text-muted">
            No signing identities observed yet — run some verifications first.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">
              {run.data.scored} identities · mean QES{" "}
              <span className="text-fg">{run.data.mean_qes}</span> ·{" "}
              {Object.entries(run.data.by_band)
                .map(([b, n]) => `${n} ${b}`)
                .join(" · ")}
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {run.data.items.map((it: PortfolioItem, i) => (
                <div
                  key={it.spki_sha256 ?? i}
                  className={cn("rounded-lg p-2 text-xs")}
                  style={{ background: bandColor(it.qes) + "22", border: `1px solid ${bandColor(it.qes)}55` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold tabular-nums" style={{ color: bandColor(it.qes) }}>
                      {it.qes}
                    </span>
                    <span className="text-[10px] text-muted">{it.event_count}×</span>
                  </div>
                  <div className="truncate text-fg" title={it.label}>
                    {it.label}
                  </div>
                  <div className="text-[10px] text-muted">
                    {it.algo}
                    {it.key_bits ? `-${it.key_bits}` : ""} {it.curve ?? ""}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <p className="text-sm text-muted">Run to populate.</p>
      )}
      {run.error && <p className="text-xs text-critical">{run.error.message}</p>}
    </Card>
  );
}
