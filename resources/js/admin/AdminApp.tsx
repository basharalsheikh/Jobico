
import AdminMedia from './components/AdminMedia';
import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminDashboard from './components/AdminDashboard';
import AdminHeroSlides from './components/AdminHeroSlides';
import AdminProjects from './components/AdminProjects';
import AdminSettings from './components/AdminSetting';
import AdminPages from './components/AdminPages';
import AdminContactMessages from './components/AdminContactMessages';
import {
    getCurrentAdmin,
    logout,
    type AdminUser,
} from './services/auth';

type AdminPage =
    | 'dashboard'
    | 'projects'
    | 'media'
    | 'hero'
    | 'pages'
    | 'messages'
    | 'settings';

export default function AdminApp() {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePage, setActivePage] =
        useState<AdminPage>('dashboard');

    useEffect(() => {
        getCurrentAdmin()
            .then(setAdmin)
            .catch(() => setAdmin(null))
            .finally(() => setChecking(false));
    }, []);

    async function handleLogout() {
        setError('');

        try {
            await logout();
            setAdmin(null);
        } catch {
            setError('تعذّر تسجيل الخروج. حاول مرة أخرى.');
        }
    }

    async function handleLoginSuccess() {
        setError('');

        try {
            const currentAdmin = await getCurrentAdmin();
            setAdmin(currentAdmin);
        } catch {
            setError(
                'تم تسجيل الدخول، لكن تعذّر التحقق من الجلسة.',
            );
        }
    }

    if (checking) {
        return (
            <main dir="rtl" className="min-h-screen bg-[#1A1A1A] p-8 text-center text-white">
                جارٍ التحقق من الجلسة...
            </main>
        );
    }

    if (!admin) {
        return (
            <>
                {error && (
                    <p role="alert" className="bg-[#1A1A1A] p-4 text-red-400">
                        {error}
                    </p>
                )}

                <LoginPage onLoginSuccess={handleLoginSuccess} />
            </>
        );
    }

    function renderPage() {
        switch (activePage) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'projects':
                return <AdminProjects />;
            case 'media':
                return <AdminMedia />;
            case 'pages':
                return <AdminPages />;
            case 'messages':
                return <AdminContactMessages />;
            case 'settings':
                return <AdminSettings />;
            case 'hero':
                return <AdminHeroSlides />;
        }
    }

    return (
        <div dir="rtl" className="min-h-screen bg-[#1A1A1A] text-white">
            <AdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activePage={activePage}
                onNavigate={setActivePage}
            />

            <div className="min-h-screen bg-[#1A1A1A] lg:mr-72">
                <AdminHeader
                    adminName={admin.name}
                    onMenuClick={() => setSidebarOpen(true)}
                    onLogout={handleLogout}
                />

                <main className="min-h-screen bg-[#1A1A1A] p-4 sm:p-6 lg:p-8">
                    {error && (
                        <p
                            role="alert"
                            className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
                        >
                            {error}
                        </p>
                    )}

                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

interface PlaceholderPageProps {
    title: string;
    description: string;
}

function PlaceholderPage({
    title,
    description,
}: PlaceholderPageProps) {
    return (
        <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">
                {title}
            </h2>

            <div className="rounded-2xl border border-[#505050] bg-[#292929] p-6">
                <p className="text-sm leading-7 text-[#BDBDBD]">
                    {description}
                </p>

                <p className="mt-3 text-sm text-[#BDBDBD]">
                    هذه الصفحة لم تُفعّل بعد.
                </p>
            </div>
        </section>
    );
}
