export interface Project {
  project_id: string;
  name: string;
  document_count: number;
  brd_count: number;
  user_stories_count: number;
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
  user_stories: UserStories[];
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
  // used to build preview urls; optional for backward compatibility
  input_document_ids?: string[];
}

export interface BRDListResponse {
  brds: BRD[];
}

export interface GenerateBRDResponse {
  brd_id: string;
  message: string;
}

// User Stories types
export interface UserStory {
  story_id: string;
  title: string;
  user_role: string;
  description: string;
  acceptance_criteria: string;
  priority: string;
  effort_estimate: string;
  brd_reference: string;
  version: string;
}

export interface Epic {
  epic_id: string;
  title: string;
  description: string;
  related_stories: string[];
}

export interface Dependency {
  story_id: string;
  depends_on: string;
  dependency_type: string;
}

export interface UserStories {
  id: string;
  filename: string;
  brd_id: string;
  brd_filename: string;
  version: string;
  generated_at: string;
  story_count: number;
  epic_count: number;
}

export interface UserStoriesListResponse {
  user_stories: UserStories[];
}

export interface GenerateUserStoriesRequest {
  brd_id: string;
  version: string;
}

export interface GenerateUserStoriesResponse {
  user_stories_id: string;
  message: string;
  filename: string;
  story_count: number;
  epic_count: number;
}

// Jira Integration types
export interface JiraConfig {
  jira_url: string;
  email: string;
  api_token: string;
  project_key: string;
}

export interface JiraProject {
  key: string;
  name: string;
  id: string;
}

export interface JiraIssueType {
  name: string;
  id: string;
  description: string;
}

export interface JiraSyncRequest {
  jira_url: string;
  project_key: string;
  auth_token: string;
}

export interface JiraSyncResult {
  success: boolean;
  message: string;
  sync_results?: {
    success: Array<{
      issue_key: string;
      issue_id: string;
      url: string;
      type: string;
    }>;
    failed: Array<{
      title: string;
      error: string;
    }>;
    total: number;
  };
  project_key?: string;
  user_stories_id?: string;
}

export interface JiraConnectionTest {
  success: boolean;
  message: string;
  projects?: JiraProject[];
  issue_types?: JiraIssueType[];
}

export interface JiraState {
  config: JiraConfig | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  syncProgress: {
    isSyncing: boolean;
    progress: number;
    message: string;
    results: JiraSyncResult | null;
  };
}
