import { useEffect, useState } from 'react';
import {
    FolderKanban,
    MessageSquare,
    Eye,
    TrendingUp,
    Clock,
} from 'lucide-react';
import {
    getDashboardStats,
    type DashboardStats,
} from '../services/dashboard';

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch(() => {
                setError('تعذّر تحميل بيانات لوحة المعلومات.');
            })
            .finally(() => setLoading(false));
    }, []);

    const cards = [
        {
            label: 'إجمالي المشاريع',
            value: stats
                ? stats.projects.published + stats.projects.draft
                : '—',
            description: stats
                ? `${stats.projects.published} منشور · ${stats.projects.draft} مسودة`
                : 'المشاريع المسجلة في الموقع',
            icon: FolderKanban,
        },
        {
            label: 'رسائل التواصل',
            value: stats ? stats.messages.total : '—',
            description: 'إجمالي الرسائل الواردة',
            icon: MessageSquare,
        },
        {
            label: 'الرسائل غير المقروءة',
            value: stats ? stats.messages.unread : '—',
            description: 'رسائل تنتظر المراجعة',
            icon: Eye,
        },
        {
            label: 'حالة لوحة التحكم',
            value: stats ? 'نشطة' : '—',
            description: stats
                ? 'تم تحميل البيانات بنجاح'
                : 'حالة الاتصال ببيانات لوحة التحكم',
            icon: TrendingUp,
        },
    ];

    return (
        <section className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">
                    نظرة عامة
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#BDBDBD]">
                    مرحباً بك في لوحة إدارة الجوبي. يمكنك متابعة محتوى الموقع
                    وإدارته من مكان واحد.
                </p>
            </div>

            {loading && (
                <p className="text-sm text-[#BDBDBD]">
                    جارٍ تحميل بيانات لوحة المعلومات...
                </p>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-700 bg-red-950/40 p-4 text-sm text-red-400"
                >
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <article
                            key={card.label}
                            className="rounded-2xl border border-[#505050] bg-[#292929] p-5 shadow-sm transition hover:border-[#FFD500] hover:shadow-md"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD500] text-[#202020]">
                                    <Icon size={23} />
                                </div>

                                <span className="text-2xl font-bold text-white">
                                    {card.value}
                                </span>
                            </div>

                            <h3 className="mt-5 font-semibold text-white">
                                {card.label}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#BDBDBD]">
                                {card.description}
                            </p>
                        </article>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-[#505050] bg-[#292929] p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD500] text-[#202020]">
                        <Clock size={21} />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                        آخر تعديلات المشاريع
                    </h3>
                </div>

                {stats?.latest_edits.length ? (
                    <div className="divide-y divide-[#505050]">
                        {stats.latest_edits.map((project) => (
                            <div
                                key={project.id}
                                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-white">
                                        {project.title}
                                    </p>
                                    <p className="mt-1 text-sm text-[#BDBDBD]">
                                        بواسطة{' '}
                                        {project.updated_by?.name ?? 'غير محدد'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            project.status === 'published'
                                                ? 'bg-[#FFD500]/20 text-[#FFD500]'
                                                : 'bg-[#333333] text-[#BDBDBD]'
                                        }`}
                                    >
                                        {project.status === 'published'
                                            ? 'منشور'
                                            : 'مسودة'}
                                    </span>

                                    <time className="text-xs text-[#BDBDBD]">
                                        {new Date(
                                            project.updated_at,
                                        ).toLocaleDateString('ar')}
                                    </time>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm leading-7 text-[#BDBDBD]">
                        {loading
                            ? 'جارٍ تحميل آخر التعديلات...'
                            : 'لا توجد تعديلات لعرضها حالياً.'}
                    </p>
                )}
            </div>
        </section>
    );
}
