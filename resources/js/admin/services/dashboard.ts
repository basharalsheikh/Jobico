
import api from '../../services/api';

export interface DashboardStats {
    projects: {
        published: number;
        draft: number;
    };
    messages: {
        total: number;
        unread: number;
    };
    latest_edits: {
        id: number;
        title: string;
        status: string;
        updated_by: {
            id: number;
            name: string;
        } | null;
        updated_at: string;
    }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/admin/dashboard');

    return response.data;
}
