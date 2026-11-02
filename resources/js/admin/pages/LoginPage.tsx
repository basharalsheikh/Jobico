
import { useState, type FormEvent } from 'react';
import { login } from '../services/auth';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email.trim(), password);
            onLoginSuccess();
        } catch (err: unknown) {
            const response = (
                err as {
                    response?: {
                        data?: {
                            message?: string;
                            errors?: Record<string, string[]>;
                        };
                    };
                }
            ).response;

            const validationErrors = response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat()[0]
                : undefined;

            setError(
                firstValidationError ??
                    response?.data?.message ??
                    'تعذّر تسجيل الدخول. تأكد من الاتصال وحاول مرة أخرى.',
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main
            dir="rtl"
            className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10"
        >
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                        لوحة إدارة الجوبي
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        سجّل الدخول للمتابعة
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="admin-email"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            البريد الإلكتروني
                        </label>
                        <input
                            id="admin-email"
                            type="email"
                            autoComplete="username"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="admin-password"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            كلمة المرور
                        </label>
                        <input
                            id="admin-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                            placeholder="أدخل كلمة المرور"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </section>
        </main>
    );
}
