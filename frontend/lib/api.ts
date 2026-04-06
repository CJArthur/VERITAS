const API_URL =
  typeof window === "undefined"
    ? process.env.API_URL || "http://localhost:8200"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
  }
}

// ── 401 interceptor ───────────────────────────────────────────────────────────
// Singleton promise — если несколько запросов одновременно получили 401,
// только один refresh уйдёт на сервер, остальные дождутся его результата.
let _refreshing: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
  if (_refreshing) return _refreshing;
  _refreshing = fetch(`${API_URL}/api/v1/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Обёртка над fetch с автоматическим обновлением токена при 401.
 * Используется только для клиентских запросов (cookie не передаётся явно).
 */
async function fetchWithRefresh(input: string, init: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  // Пробуем тихо обновить токены
  const refreshed = await tryRefreshTokens();
  if (!refreshed) {
    // Refresh тоже истёк — отправляем на логин
    redirectToLogin();
    return res;
  }

  // Повторяем оригинальный запрос с новыми куками
  return fetch(input, init);
}

// ── Response handler ──────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Public API helpers ────────────────────────────────────────────────────────

export function apiGet<T>(path: string, cookie?: string): Promise<T> {
  // Server-side (SSR) — cookie передаётся явно, refresh не нужен
  if (cookie) {
    return fetch(`${API_URL}${path}`, {
      credentials: "include",
      cache: "no-store",
      headers: { Cookie: cookie },
    }).then((r) => handleResponse<T>(r));
  }
  return fetchWithRefresh(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
  }).then((r) => handleResponse<T>(r));
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetchWithRefresh(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handleResponse<T>(r));
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return fetchWithRefresh(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handleResponse<T>(r));
}

export function apiDelete<T>(path: string): Promise<T> {
  return fetchWithRefresh(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
  }).then((r) => handleResponse<T>(r));
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return fetchWithRefresh(`${API_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handleResponse<T>(r));
}

export function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  return fetchWithRefresh(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then((r) => handleResponse<T>(r));
}

// API response types
export interface UserMe {
  id: string;
  login: string;
  email: string;
  is_verified: boolean;
  role: "student" | "university_staff" | "super_admin";
  issuer_id: string | null;
  university_id: string | null; // backward-compat alias (same value)
}

export type IssuerType = "university" | "training_center" | "corporate" | "certification_body";

export const ISSUER_TYPE_LABEL: Record<IssuerType, string> = {
  university: "Университет",
  training_center: "Учебный центр",
  corporate: "Корпоративная академия",
  certification_body: "Сертификационный центр",
};

export interface DiplomaListItem {
  id: string;
  registration_number: string;
  graduate_full_name: string;
  specialty_name: string;
  study_end_year: number;
  status: "active" | "revoked" | "suspended";
  certificate_token: string;
  student_user_id: string | null;
  created_at: string;
}

export interface DiplomaDetail extends DiplomaListItem {
  serial_number: string;
  specialty_code: string;
  study_start_year: number;
  issue_date: string;
  gpa: number;
  revoke_reason: string | null;
  data_hash: string;
  signature_valid: boolean;
  university_name: string;
  employer_link_valid_until: string | null;
  subjects: SubjectOut[];
  logs: VerificationLogOut[];
  blockchain_status: "anchored" | "pending" | "not_configured" | "mismatch" | null;
  blockchain_tx_hash: string | null;
  blockchain_anchored_at: string | null;
}

export interface SubjectOut {
  subject_name: string;
  hours: number;
  credits: number;
  grade: number;
  semester: number;
}

export interface VerificationLogOut {
  verifier_type: string;
  verifier_ip: string;
  verifier_org_name: string | null;
  verified_at: string;
  result: string;
}

export type DocumentType = "diploma" | "certificate" | "professional_license";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  diploma: "Диплом",
  certificate: "Сертификат",
  professional_license: "Профессиональная лицензия",
};

export interface PublicDiplomaView {
  certificate_token: string;
  graduate_full_name: string;
  specialty_name: string;
  study_end_year: number;
  registration_number: string;
  university_name: string;
  university_avatar_url: string | null;
  status: string;
  signature_valid: boolean;
  employer_link_valid_until: string | null;
  verification_count: number;
  share_recipient: string | null;
  document_type: DocumentType;
  issuer_name: string | null;
  blockchain_status: "anchored" | "pending" | "not_configured" | "mismatch" | null;
  blockchain_tx_hash: string | null;
  blockchain_anchored_at: string | null;
  blockchain_network: string;
}

export interface StudentDiploma {
  id: string;
  registration_number: string;
  graduate_full_name: string;
  specialty_name: string;
  study_end_year: number;
  status: "active" | "revoked" | "suspended";
  university_name: string | null;
  university_avatar_url: string | null;
  certificate_token: string;
  employer_link_valid_until: string | null;
  verification_count: number;
  last_verified_at: string | null;
  share_recipient: string | null;
  document_type: DocumentType;
  issuer_name: string | null;
}

export interface IssuerInfo {
  id: string;
  name: string;
  ogrn: string;
  license_number: string;
  accreditation_number: string | null;
  issuer_type: IssuerType;
  avatar_url: string | null;
  banner_url: string | null;
  approval_status: string;
}

// Backward-compat alias
export type UniversityInfo = IssuerInfo;

export interface PendingUniversity {
  id: string;
  name: string;
  ogrn: string;
  license_number: string;
  accreditation_number: string;
  created_at: string;
}

export interface OrgVerificationResult {
  university_id: string;
  university_name: string;
  ogrn: string;
  license_number: string;
  accreditation_number: string;
  // ОГРН checks
  ogrn_checksum_valid: boolean;
  ogrn_found_in_egrul: boolean;
  ogrn_verified_name: string | null;
  ogrn_inn: string | null;
  ogrn_is_active: boolean;
  ogrn_dadata_used: boolean;
  ogrn_error: string | null;
  // Links
  fns_url: string;
  rosobr_license_url: string;
  rosobr_accred_url: string;
  // Recommendation
  recommendation: "approve" | "reject" | "manual_review";
  recommendation_reason: string;
}

export interface AdminUniversityItem {
  id: string;
  name: string;
  ogrn: string;
  license_number: string;
  accreditation_number: string;
  approval_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  avatar_url: string | null;
  diploma_count: number;
  created_at: string;
}

export interface AdminStats {
  total_universities: number;
  approved_universities: number;
  total_diplomas: number;
  total_verifications: number;
}

export interface DiplomaActivityItem {
  verifier_org: string | null;
  verifier_type: string;
  result: string;
  verified_at: string;
}
