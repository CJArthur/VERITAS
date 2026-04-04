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

export function apiGet<T>(path: string, cookie?: string): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: cookie ? { Cookie: cookie } : {},
  }).then((r) => handleResponse<T>(r));
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handleResponse<T>(r));
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handleResponse<T>(r));
}

export function apiDelete<T>(path: string): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
  }).then((r) => handleResponse<T>(r));
}

export function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  return fetch(`${API_URL}${path}`, {
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
  university_id: string | null;
}

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

export interface PublicDiplomaView {
  certificate_token: string;
  graduate_full_name: string;
  specialty_name: string;
  study_end_year: number;
  registration_number: string;
  university_name: string;
  status: string;
  signature_valid: boolean;
  employer_link_valid_until: string | null;
}

export interface StudentDiploma {
  id: string;
  registration_number: string;
  graduate_full_name: string;
  specialty_name: string;
  study_end_year: number;
  status: "active" | "revoked" | "suspended";
  university_name: string | null;
  certificate_token: string;
  employer_link_valid_until: string | null;
}

export interface UniversityInfo {
  id: string;
  name: string;
  ogrn: string;
  license_number: string;
  accreditation_number: string;
  avatar_url: string | null;
  banner_url: string | null;
  approval_status: string;
}

export interface PendingUniversity {
  id: string;
  name: string;
  ogrn: string;
  license_number: string;
  accreditation_number: string;
  created_at: string;
}
