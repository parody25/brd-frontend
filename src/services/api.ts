import axios from 'axios';
import {
  HealthCheckResponse,
  CreateProjectResponse,
  ProjectsListResponse,
  UploadDocumentResponse,
  ProjectDocumentsResponse,
  DeleteDocumentResponse,
  BRDTemplateResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  file: File
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadDocumentResponse>(
    `/projects/${projectId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const getProjectDocuments = async (
  projectId: string
): Promise<ProjectDocumentsResponse> => {
  const response = await api.get<ProjectDocumentsResponse>(`/projects/${projectId}/documents`);
  return response.data;
};

export const deleteDocument = async (
  projectId: string,
  documentId: string
): Promise<DeleteDocumentResponse> => {
  const response = await api.delete<DeleteDocumentResponse>(
    `/projects/${projectId}/documents/${documentId}`
  );
  return response.data;
};

// BRD generation
export const generateBRD = async (
  projectId: string,
  requirements: string
): Promise<Blob> => {
  const response = await api.post<Blob>(
    `/projects/${projectId}/generate_brd`,
    null,
    {
      params: { requirements },
      responseType: 'blob',
    }
  );
  return response.data;
};

export const getBRDTemplate = async (): Promise<BRDTemplateResponse> => {
  const response = await api.get<BRDTemplateResponse>('/brd_template');
  return response.data;
};
