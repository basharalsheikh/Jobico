import api from '../../services/api';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    is_active: boolean;
}

const webApi = api.create({
    baseURL: '/',
});

export async function getCsrfCookie(): Promise<void> {
    await webApi.get('/sanctum/csrf-cookie');
}

export async function login(
    email: string,
    password: string,
): Promise<void> {
    await getCsrfCookie();

    await webApi.post('/login', {
        email,
        password,
    });
}

export async function getCurrentAdmin(): Promise<AdminUser> {
    const response = await api.get<{ user: AdminUser }>('/me');
    return response.data.user;
}

export async function logout(): Promise<void> {
    await webApi.post('/logout');
}
