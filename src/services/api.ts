
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

export const generateBRD = async (projectId: string, requirements: string): Promise<GenerateBRDResponse> => {
  const response = await api.post<GenerateBRDResponse>(`/projects/${projectId}/generate_brd`, null, { params: { requirements } });
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

export {};
