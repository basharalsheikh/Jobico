
import api from '../../services/api';

export interface SettingContactItem {
    label: string;
    value: string;
    is_visible: boolean;
}

export interface SiteSettings {
    id: number;
    company_name: string;
    header_subtitle: string;
    logo_media_id: number | null;
    hero_mode: 'image' | 'slider';
    address: string | null;
    phones: SettingContactItem[] | null;
    emails: SettingContactItem[] | null;
    map_url: string | null;
    logo_media?: {
        id: number;
        [key: string]: unknown;
    } | null;
}

export interface UpdateSiteSettingsPayload {
    company_name: string;
    header_subtitle: string;
    logo_media_id: number | null;
    hero_mode?: 'image' | 'slider';
    address: string | null;
    phones: SettingContactItem[] | null;
    emails: SettingContactItem[] | null;
    map_url: string | null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
    const response = await api.get<{ data: SiteSettings }>(
        '/admin/settings'
    );

    return response.data.data;
}

export async function updateSiteSettings(
    payload: UpdateSiteSettingsPayload
): Promise<SiteSettings> {
    const response = await api.put<{ data: SiteSettings }>(
        '/admin/settings',
        payload
    );

    return response.data.data;
}

export interface FooterSettings {
    id: number;
    company_name: string;
    subtitle: string;
    address: string | null;
    phones: SettingContactItem[] | null;
    emails: SettingContactItem[] | null;
    cta_title: string;
    cta_line_1: string;
    cta_line_2: string;
    cta_button_text: string;
    copyright_text: string;
}

export type UpdateFooterSettingsPayload = Omit<FooterSettings, 'id'>;

export async function getFooterSettings(): Promise<FooterSettings> {
    const response = await api.get<{ data: FooterSettings }>(
        '/admin/footer-settings',
    );

    return response.data.data;
}

export async function updateFooterSettings(
    payload: Partial<UpdateFooterSettingsPayload>,
): Promise<FooterSettings> {
    const response = await api.put<{ data: FooterSettings }>(
        '/admin/footer-settings',
        payload,
    );

    return response.data.data;
}
