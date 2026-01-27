export interface Project {
  project_id: string;
  name: string;
  document_count: number;
  brd_count: number;
  created_at: string;
}

export interface Document {
  id: string;
  filename: string;
  uploaded_at: string;
  type: string;
}

export interface AppState {
  projects: Project[];
  currentProject: Project | null;
  documents: Document[];
  brds: BRD[];
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
}

export interface CreateProjectResponse {
  project_id: string;
  name: string;
  message: string;
}

export interface ProjectsListResponse {
  projects: Project[];
}

export interface UploadDocumentResponse {
  message: string;
  document_id: string;
  embedding_created: boolean;
}

export interface ProjectDocumentsResponse {
  documents: Document[];
}

export interface DeleteDocumentResponse {
  message: string;
}

export interface BRDTemplateResponse {
  template: string;
}

export interface BRD {
  id: string;
  filename: string;
  requirements_preview: string;
  document_count: number;
  input_document_filenames: string[];
  generated_at: string;
}

export interface BRDListResponse {
  brds: BRD[];
}

export interface GenerateBRDResponse {
  brd_id: string;
  message: string;
}
