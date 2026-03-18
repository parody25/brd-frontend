import axios, { AxiosRequestConfig } from 'axios';
import {
  HealthCheckResponse,
  CreateProjectResponse,
  ProjectsListResponse,
  UploadDocumentResponse,
  ProjectDocumentsResponse,
  DeleteDocumentResponse,
  BRDTemplateResponse,
  BRDListResponse,
  GenerateBRDResponse,
  UserStoriesListResponse,
  GenerateUserStoriesResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Health check
export const healthCheck = async (): Promise<HealthCheckResponse> => {
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};

// Project management
export const createProject = async (name?: string): Promise<CreateProjectResponse> => {
  const params = name ? { name } : {};
  const response = await api.post<CreateProjectResponse>('/create_project', null, { params });
  return response.data;
};

export const getProjects = async (): Promise<ProjectsListResponse> => {
  const response = await api.get<ProjectsListResponse>('/projects');
  return response.data;
};

// Document management
export const uploadDocument = async (
  projectId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const config: AxiosRequestConfig = {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (!evt.total) return;
      const pct = Math.round((evt.loaded * 100) / evt.total);
      onProgress?.(pct);
    },
  };

  const response = await api.post<UploadDocumentResponse>(`/projects/${projectId}/upload`, formData, config);
  return response.data;
};

export const getProjectDocuments = async (projectId: string): Promise<ProjectDocumentsResponse> => {
  const response = await api.get<ProjectDocumentsResponse>(`/projects/${projectId}/documents`);
  return response.data;
};

export const deleteDocument = async (projectId: string, documentId: string): Promise<DeleteDocumentResponse> => {
  const response = await api.delete<DeleteDocumentResponse>(`/projects/${projectId}/documents/${documentId}`);
  return response.data;
};

// BRD management
export const getProjectBRDs = async (projectId: string): Promise<BRDListResponse> => {
  const response = await api.get<BRDListResponse>(`/projects/${projectId}/brds`);
  return response.data;
};

export const generateBRD = async (
  projectId: string,
  requirements: string,
  processInstructions?: string
): Promise<GenerateBRDResponse> => {
  const requestBody: any = { requirements };
  if (processInstructions) {
    requestBody.process_instructions = processInstructions;
  }
  const response = await api.post<GenerateBRDResponse>(`/projects/${projectId}/generate_brd`, requestBody);
  return response.data;
};

export const downloadBRD = async (projectId: string, brdId: string): Promise<Blob> => {
  const response = await api.get<Blob>(`/projects/${projectId}/brds/${brdId}/download`, { responseType: 'blob' });
  return response.data;
};

export const deleteBRD = async (projectId: string, brdId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/brds/${brdId}`);
  return response.data;
};

// Project management - additional operations
export const deleteProject = async (
  projectId: string
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/projects/${projectId}`
  );
  return response.data;
};

export const renameProject = async (
  projectId: string,
  newName: string
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(
    `/projects/${projectId}`,
    { name: newName }
  );
  return response.data;
};

export const getBRDTemplate = async (): Promise<BRDTemplateResponse> => {
  const response = await api.get<BRDTemplateResponse>('/brd_template');
  return response.data;
};

// === Helper for preview/download URL ===
export const getDocumentDownloadUrl = (projectId: string, documentId: string): string => {
  return `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}/download`;
};

// User Stories management
export const getProjectUserStories = async (projectId: string): Promise<UserStoriesListResponse> => {
  const response = await api.get<UserStoriesListResponse>(`/projects/${projectId}/user_stories`);
  return response.data;
};

export const generateUserStories = async (
  projectId: string,
  brdId: string | null,
  version: string,
  customerJourneyContent?: string | null,
  customerJourneyFile?: File | null
): Promise<GenerateUserStoriesResponse> => {
  // If we have a file, use multipart form data
  if (customerJourneyFile) {
    const formData = new FormData();
    formData.append('customer_journey_file', customerJourneyFile);
    formData.append('version', version);
    
    const response = await api.post<GenerateUserStoriesResponse>(
      `/projects/${projectId}/generate_user_stories`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }
  
  // Otherwise use JSON payload
  const requestBody: any = { version };
  
  if (brdId) {
    requestBody.brd_id = brdId;
  }
  
  if (customerJourneyContent) {
    requestBody.customer_journey_content = customerJourneyContent;
  }
  
  const response = await api.post<GenerateUserStoriesResponse>(`/projects/${projectId}/generate_user_stories`, requestBody);
  return response.data;
};

export const downloadUserStories = async (projectId: string, userStoriesId: string): Promise<Blob> => {
  const response = await api.get<Blob>(`/projects/${projectId}/user_stories/${userStoriesId}/download`, { responseType: 'blob' });
  return response.data;
};

export const deleteUserStories = async (projectId: string, userStoriesId: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/projects/${projectId}/user_stories/${userStoriesId}`);
  return response.data;
};

export const getUserStoriesDownloadUrl = (projectId: string, userStoriesId: string): string => {
  return `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/user_stories/${encodeURIComponent(userStoriesId)}/download`;
};

// Jira Integration API endpoints
export const getJiraConfig = async (): Promise<any> => {
  const response = await api.get('/jira/config');
  return response.data;
};

export const testJiraConnection = async (config: any): Promise<any> => {
  const response = await api.post('/jira/test-connection', config);
  return response.data;
};

export const getJiraProjects = async (): Promise<any> => {
  const response = await api.get('/jira/projects');
  return response.data;
};

export const getJiraIssueTypes = async (): Promise<any> => {
  const response = await api.get('/jira/issue-types');
  return response.data;
};

export const syncUserStoriesToJira = async (
  projectId: string,
  userStoriesId: string,
  config: any
): Promise<any> => {
  const response = await api.post(`/projects/${projectId}/user_stories/${userStoriesId}/jira-sync`, config);
  return response.data;
};

export {};
