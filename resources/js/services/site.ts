
import api from './api';

export interface SiteContactItem {
    label: string;
    value: string;
    is_visible: boolean;
}

export interface FooterSettings {
    id: number;
    company_name: string;
    subtitle: string;
    address: string | null;
    phones: SiteContactItem[] | null;
    emails: SiteContactItem[] | null;
    cta_title: string;
    cta_line_1: string;
    cta_line_2: string;
    cta_button_text: string;
    copyright_text: string;
}

export interface SiteMedia {
    id: number;
    path: string;
    disk: string;
    alt: string | null;
    variants: Record<string, unknown> | null;
}

export interface Site {
    id: number;
    company_name: string;
    header_subtitle: string;
    logo_media_id: number | null;
    logo_media: SiteMedia | null;
    hero_mode: 'image' | 'slider';
    address: string | null;
    phones: SiteContactItem[];
    emails: SiteContactItem[];
    map_url: string | null;
    footer: FooterSettings | null;
}

interface ApiResponse<T> {
    data: T;
}

export async function getSite(): Promise<Site> {
    const response = await api.get<ApiResponse<Site>>('/site');
    return response.data.data;
}


export interface PublicPage {
    id: number;
    slug: string;
    title: string;
    seo_title: string | null;
    seo_description: string | null;
    content: Record<string, unknown> | null;
}

export async function getPublicPage(
    slug: string,
): Promise<PublicPage> {
    const response = await api.get<ApiResponse<PublicPage>>(
        `/pages/${encodeURIComponent(slug)}`,
    );

    return response.data.data;
}

export interface Project {
    id: number;
    title: string;
    slug: string;
    location: string | null;
    summary: string | null;
    description: string | null;
    quantity_text: string | null;
    status: 'draft' | 'published';
    cover_media_id: number | null;
    cover_media: SiteMedia | null;
    gallery: SiteMedia[]; // أضفنا صور المعرض
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
}

export async function getProjects(): Promise<Project[]> {
    const response = await api.get<ApiResponse<Project[]>>('/projects');
    return response.data.data;
}

export interface ContactMessageInput {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    body: string;
}

export interface ContactMessageResponse {
    message: string;
    data: {
        id: number;
        request_id: string;
        mail_status: string;
    };
}

export async function sendContactMessage(
    input: ContactMessageInput,
): Promise<ContactMessageResponse> {
    try {
        const response = await api.post<ContactMessageResponse>(
            '/contact',
            input,
        );

        return response.data;
    } catch (error: unknown) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error
        ) {
            const response = error.response;

            if (
                typeof response === 'object' &&
                response !== null &&
                'data' in response
            ) {
                const data = response.data;

                if (
                    typeof data === 'object' &&
                    data !== null &&
                    'message' in data &&
                    typeof data.message === 'string'
                ) {
                    throw new Error(data.message);
                }
            }
        }

        throw new Error(
            'تعذّر إرسال الرسالة حالياً. حاول مرة أخرى.',
        );
    }
}
