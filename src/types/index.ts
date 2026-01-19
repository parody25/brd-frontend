export interface Project {
  project_id: string;
  name: string;
  document_count: number;
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
