/** Shared API types mirroring the backend Pydantic schemas. */

export type Role = "admin" | "analyst" | "auditor" | "viewer";

export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  auditor: 1,
  analyst: 2,
  admin: 3,
};

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  role: Role;
}

export interface Me {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  totp_enabled: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  totp_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
}

export type ApiKeyScope = "ingest:events" | "ingest:signatures";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created_by: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKey {
  api_key: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface SystemInfo {
  name: string;
  version: string;
  environment: string;
  database: string;
  ml_enabled: boolean;
  outbound_revocation: boolean;
}

// ---- Module 2: cryptographic core ----

export type Verdict = "valid" | "invalid" | "indeterminate";
export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  code: string;
  title: string;
  severity: FindingSeverity;
  category: string;
  detail: string;
}

export interface CertInfo {
  subject: string;
  issuer: string;
  serial_hex: string;
  not_before: string;
  not_after: string;
  spki_sha256: string;
  sig_algo: string;
  key_type: string;
  key_bits: number | null;
  curve: string | null;
  is_ca: boolean;
  self_signed: boolean;
  key_usage: string[];
  ext_key_usage: string[];
  san: string[];
}

export interface ChainOut {
  status: "trusted" | "untrusted" | "incomplete" | "error";
  trust_anchor_spki: string | null;
  error: string | null;
  chain: CertInfo[];
}

export interface RevocationOut {
  status: "good" | "revoked" | "unknown" | "not_checked" | "error";
  method: string | null;
  detail: string;
  revoked_at: string | null;
}

export interface SignatureOut {
  algorithm: string;
  hash_alg: string | null;
  padding: string | null;
  key_type: string | null;
  key_bits: number | null;
  curve: string | null;
  low_s: boolean | null;
  der_canonical: boolean | null;
}

export interface VerificationResult {
  verdict: Verdict;
  envelope: "raw" | "pdf" | "cms" | "jws";
  signature: SignatureOut | null;
  signer: CertInfo | null;
  chain: ChainOut | null;
  revocation: RevocationOut | null;
  signing_time: string | null;
  tsa_present: boolean;
  tsa_trusted: boolean;
  findings: Finding[];
  payload_sha256: string | null;
  summary: string;
}

export interface TrustAnchor {
  id: string;
  name: string;
  subject: string;
  spki_sha256: string;
  fingerprint_sha256: string;
  not_after: string;
  enabled: boolean;
  created_at: string;
}

export interface ObservedCertificate {
  id: string;
  spki_sha256: string;
  fingerprint_sha256: string;
  subject: string;
  issuer: string;
  serial_hex: string;
  not_before: string;
  not_after: string;
  sig_algo: string;
  key_type: string;
  key_bits: number | null;
  curve: string | null;
  is_ca: boolean;
  self_signed: boolean;
  times_seen: number;
  first_seen_at: string;
  last_seen_at: string;
}
