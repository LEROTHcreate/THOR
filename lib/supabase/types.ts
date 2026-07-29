export type AppSource = "vision" | "audition";

export interface UploadSession {
  id: string;
  token: string;
  app_source: AppSource;
  patient_id: string;
  patient_name: string | null;
  praticien_name: string | null;
  message: string | null;
  created_at: string;
  expires_at: string;
  max_files: number;
  max_file_size_mb: number;
  allowed_types: string[];
  revoked: boolean;
}

export interface UploadedFile {
  id: string;
  session_id: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
  content_type: string;
  uploaded_at: string;
}

export interface UploadSessionPublicView {
  token: string;
  app_source: AppSource;
  patient_name: string | null;
  praticien_name: string | null;
  message: string | null;
  expires_at: string;
  max_files: number;
  max_file_size_mb: number;
  allowed_types: string[];
  files_count: number;
}
