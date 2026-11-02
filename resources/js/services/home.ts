
import api from './api';

export interface HeroSlideMedia {
    id: number;
    path: string;
    disk: string;
    mime: string;
    alt: string | null;
    variants: Record<string, unknown> | null;
}

export interface HeroSlide {
    id: number;
    title?: string | null;
    subtitle?: string | null;
    sort_order: number;
    is_active: boolean;
    media: HeroSlideMedia | null;
}

export type HeroMode = 'image' | 'video' | 'slider';

export interface HomeData {
    settings: {
        hero_mode: HeroMode;
    } | null;
    hero_slides: HeroSlide[];
}

interface ApiResponse<T> {
    data: T;
}

export async function getHome(): Promise<HomeData> {
    const response = await api.get<ApiResponse<HomeData>>('/home');
    return response.data.data;
}
