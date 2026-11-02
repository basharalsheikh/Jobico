
import api from '../../services/api';

export interface ProjectCategory {
    id: number;
    name: string;
    slug: string;
}

export interface ProjectMedia {
    id: number;
    path?: string;
    disk?: string;
    url?: string;
    alt?: string | null;
    alt_text?: string | null;
    variants?: Record<string, unknown> | null;
}

export interface AdminProject {
    id: number;
    title: string;
    slug?: string;
    location?: string | null;
    category_id?: number | null;
    summary?: string | null;
    description?: string | null;
    quantity_text?: string | null;
    cover_media_id?: number | null;
    gallery?: ProjectMedia[];
    status: string;
    sort_order: number;
    category?: ProjectCategory | null;
    cover_media?: ProjectMedia | null;
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedProjects {
    data: AdminProject[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
export interface ProjectMedia {
    id: number;
    path?: string;
    disk?: string;
    url?: string;
    alt?: string | null;
    alt_text?: string | null;
    variants?: Record<string, unknown> | null;
}

export interface AdminProject {
    id: number;
    title: string;
    slug?: string;
    location?: string | null;
    category_id?: number | null;
    summary?: string | null;
    description?: string | null;
    quantity_text?: string | null;
    cover_media_id?: number | null;
    gallery?: ProjectMedia[];
    status: string;
    sort_order: number;
    category?: ProjectCategory | null;
    cover_media?: ProjectMedia | null;
    created_at?: string;
    updated_at?: string;
}

export interface CreateProjectData {
    title: string;
    location?: string | null;
    category_id?: number | null;
    summary?: string | null;
    description?: string | null;
    quantity_text?: string | null;
    cover_media_id?: number | null;
    gallery?: number[];
    status: 'draft' | 'published';
    sort_order?: number;
}

export async function getProjects(
    page = 1,
): Promise<PaginatedProjects> {
    const response = await api.get<PaginatedProjects>(
        '/admin/projects',
        { params: { page } },
    );

    return response.data;
}

export async function getProjectDetails(
    id: number,
): Promise<AdminProject> {
    const response = await api.get<{ data: AdminProject }>(
        `/admin/projects/${id}`,
    );

    return response.data.data;
}


export async function createProject(
    data: CreateProjectData,
): Promise<AdminProject> {
    const response = await api.post<{ data: AdminProject }>(
        '/admin/projects',
        data,
    );

    return response.data.data;
}

export async function updateProject(
    id: number,
    data: CreateProjectData,
): Promise<AdminProject> {
    const response = await api.put<{ data: AdminProject }>(
        `/admin/projects/${id}`,
        data,
    );

    return response.data.data;
}

export async function deleteProject(id: number): Promise<void> {
    await api.delete(`/admin/projects/${id}`);
}

export async function getProjectCategories(): Promise<ProjectCategory[]> {
    const response = await api.get<{ data: ProjectCategory[] }>(
        '/admin/project-categories',
    );

    return response.data.data;
}
export interface UploadedMedia {
    id: number;
    disk: string;
    path: string;
    mime: string;
    size: number;
    width: number | null;
    height: number | null;
    alt: string | null;
}

export async function uploadProjectMedia(
    file: File,
    alt?: string,
): Promise<UploadedMedia> {
    const formData = new FormData();

    formData.append('file', file);

    if (alt?.trim()) {
        formData.append('alt', alt.trim());
    }

    const response = await api.post<{ data: UploadedMedia }>(
        '/admin/media',
        formData,
    );

    return response.data.data;
}
export interface PaginatedMedia {
    data: UploadedMedia[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export async function getAdminMedia(
    page = 1,
): Promise<PaginatedMedia> {
    const response = await api.get<PaginatedMedia>(
        '/admin/media',
        { params: { page } },
    );

    return response.data;
}

export async function deleteAdminMedia(
    id: number,
): Promise<void> {
    await api.delete(`/admin/media/${id}`);
}
