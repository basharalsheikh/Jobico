
import api from '../../services/api';

export interface HeroMedia {
    id: number;
    disk: string;
    path: string;
    mime: string;
    size: number | null;
    alt: string | null;
    width: number | null;
    height: number | null;
    variants: Record<string, unknown> | null;
}

export interface AdminHeroSlide {
    id: number;
    title: string | null;
    subtitle: string | null;
    media_id: number | null;
    sort_order: number;
    is_active: boolean;
    media: HeroMedia | null;
}

interface ApiMessage<T> {
    message?: string;
    data: T;
}

interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

export interface CreateHeroSlideInput {
    title?: string | null;
    subtitle?: string | null;
    media_id: number;
    sort_order?: number;
    is_active?: boolean;
}

export type UpdateHeroSlideInput = Partial<CreateHeroSlideInput>;

export async function getAdminHeroSlides(): Promise<PaginatedResponse<AdminHeroSlide>> {
    const response = await api.get<PaginatedResponse<AdminHeroSlide>>(
        '/admin/hero-slides',
    );

    return response.data;
}

export async function uploadHeroMedia(
    file: File,
    alt?: string,
): Promise<HeroMedia> {
    const formData = new FormData();
    formData.append('file', file);

    if (alt?.trim()) {
        formData.append('alt', alt.trim());
    }

    const response = await api.post<ApiMessage<HeroMedia>>(
        '/admin/hero-media',
        formData,
    );

    return response.data.data;
}

export async function createHeroSlide(
    input: CreateHeroSlideInput,
): Promise<AdminHeroSlide> {
    const response = await api.post<ApiMessage<AdminHeroSlide>>(
        '/admin/hero-slides',
        input,
    );

    return response.data.data;
}

export async function updateHeroSlide(
    id: number,
    input: UpdateHeroSlideInput,
): Promise<AdminHeroSlide> {
    const response = await api.patch<ApiMessage<AdminHeroSlide>>(
        `/admin/hero-slides/${id}`,
        input,
    );

    return response.data.data;
}

export async function deleteHeroSlide(id: number): Promise<void> {
    await api.delete(`/admin/hero-slides/${id}`);
}

export async function reorderHeroSlides(
    slides: Array<{ id: number; sort_order: number }>,
): Promise<AdminHeroSlide[]> {
    const response = await api.put<ApiMessage<AdminHeroSlide[]>>(
        '/admin/hero-slides/actions/reorder',
        { slides },
    );

    return response.data.data;
}
