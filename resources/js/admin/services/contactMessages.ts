import api from '../../services/api';
export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    body: string;
    read_at: string | null;
    mail_status: string | null;
    request_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedContactMessages {
    data: ContactMessage[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export type MessageReadFilter = 'all' | 'unread' | 'read';

export async function getContactMessages(
    page = 1,
    filter: MessageReadFilter = 'all',
): Promise<PaginatedContactMessages> {
    const params: Record<string, number | boolean> = { page };

    if (filter === 'unread') {
        params.read = false;
    } else if (filter === 'read') {
        params.read = true;
    }

    const response = await api.get<PaginatedContactMessages>(
        '/admin/contact-messages',
        { params },
    );

    return response.data;
}

export async function getContactMessage(
    id: number,
): Promise<ContactMessage> {
    const response = await api.get<{ data: ContactMessage }>(
        `/admin/contact-messages/${id}`,
    );

    return response.data.data;
}

export async function markContactMessageAsRead(
    id: number,
): Promise<ContactMessage> {
    const response = await api.patch<{ data: ContactMessage }>(
        `/admin/contact-messages/${id}/read`,
    );

    return response.data.data;
}
