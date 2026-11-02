import api from '../../services/api';
export interface AdminPage {
    id: number;
    slug: string;
    title: string;
    seo_title: string | null;
    seo_description: string | null;
    content: Record<string, unknown>;
    updated_by: number | null;
    updated_at: string | null;
}

export interface UpdateAdminPageData {
    title: string;
    seo_title: string | null;
    seo_description: string | null;
    content?: Record<string, unknown>;
}

export async function getAdminPages(): Promise<AdminPage[]> {
    const response = await api.get<{ data: AdminPage[] }>('/admin/pages');

    return response.data.data;
}

export async function updateAdminPage(
    slug: string,
    data: UpdateAdminPageData,
): Promise<AdminPage> {
    const response = await api.put<{ data: AdminPage }>(
        `/admin/pages/${encodeURIComponent(slug)}`,
        data,
    );

    return response.data.data;
}
