import { useCallback, useEffect, useState } from 'react';
import {
    RefreshCw,
    Trash2,
    Image as ImageIcon,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

import {
    getAdminMedia,
    deleteAdminMedia,
} from '../services/projects';

import type {
    UploadedMedia,
    PaginatedMedia,
} from '../services/projects';

function getMediaUrl(id: number): string {
    return `/api/v1/media/${id}/original`;
}

function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (
            error as {
                response?: {
                    data?: { message?: string };
                };
            }
        ).response?.data;

        if (response?.message) {
            return response.message;
        }
    }

    return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

export default function AdminMedia() {
    const [media, setMedia] = useState<UploadedMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const loadMedia = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const result: PaginatedMedia = await getAdminMedia(page);

            setMedia(result.data);
            setCurrentPage(result.current_page);
            setLastPage(result.last_page);
            setTotal(result.total);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMedia(1);
    }, [loadMedia]);

    async function handleDelete(item: UploadedMedia) {
        const confirmed = window.confirm(
            'هل أنت متأكد من حذف هذه الصورة؟ إذا كانت مستخدمة في مشروع أو شريحة رئيسية، سيرفض الخادم حذفها.',
        );

        if (!confirmed) return;

        setDeletingId(item.id);
        setError('');
        setSuccess('');

        try {
            await deleteAdminMedia(item.id);

            setSuccess('تم حذف الصورة بنجاح.');

            const nextPage =
                media.length === 1 && currentPage > 1
                    ? currentPage - 1
                    : currentPage;

            await loadMedia(nextPage);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <section className="space-y-6" dir="rtl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">
                        الصور والوسائط
                    </h1>
                    <p className="mt-2 text-sm text-[#BDBDBD]">
                        استعراض الصور المستخدمة في مشاريع الموقع وإدارة الملفات.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadMedia(currentPage)}
                    disabled={loading}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#505050] bg-[#333333] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#FFD500] hover:bg-[#FFD500]/10 hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        size={17}
                        className={loading ? 'animate-spin' : ''}
                    />
                    تحديث
                </button>
            </div>

            {success && (
                <div
                    role="status"
                    className="rounded-xl border border-[#FFD500]/50 bg-[#FFD500]/10 p-4 text-sm font-semibold text-[#FFD500]"
                >
                    {success}
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-700 bg-red-950/40 p-4 text-sm text-red-400"
                >
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={() => void loadMedia(currentPage)}
                        className="mt-2 cursor-pointer font-bold text-red-400 underline"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl border border-[#505050] bg-[#292929] p-5 shadow-sm">
                <div className="rounded-xl bg-[#FFD500] p-3 text-[#202020]">
                    <ImageIcon size={24} />
                </div>
                <div>
                    <p className="text-sm text-[#BDBDBD]">إجمالي الوسائط</p>
                    <p className="mt-1 text-2xl font-black text-white">
                        {total}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-[#505050] bg-[#292929] p-10 text-center text-sm text-[#BDBDBD]">
                    جارٍ تحميل الصور...
                </div>
            ) : media.length === 0 ? (
                <div className="rounded-2xl border border-[#505050] bg-[#292929] p-10 text-center">
                    <ImageIcon
                        size={40}
                        className="mx-auto text-[#BDBDBD]"
                    />
                    <p className="mt-3 font-bold text-white">
                        لا توجد وسائط
                    </p>
                    <p className="mt-1 text-sm text-[#BDBDBD]">
                        ستظهر الصور هنا بعد رفعها من إدارة المشاريع.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {media.map((item) => (
                        <article
                            key={item.id}
                            className="overflow-hidden rounded-2xl border border-[#505050] bg-[#292929] shadow-sm transition-shadow hover:shadow-md"
                        >
                            <a
                                href={getMediaUrl(item.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="block cursor-pointer bg-[#333333]"
                                aria-label={`فتح الصورة رقم ${item.id}`}
                            >
                                <img
                                    src={getMediaUrl(item.id)}
                                    alt={item.alt || `صورة رقم ${item.id}`}
                                    loading="lazy"
                                    className="h-56 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                                />
                            </a>

                            <div className="space-y-3 p-4">
                                <div>
                                    <p className="font-bold text-white">
                                        صورة #{item.id}
                                    </p>
                                    <p className="mt-1 break-all text-xs text-[#BDBDBD]">
                                        {item.path}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs text-[#BDBDBD]">
                                    <span className="rounded-full bg-[#333333] px-3 py-1">
                                        {item.mime}
                                    </span>
                                    <span className="rounded-full bg-[#333333] px-3 py-1">
                                        {(item.size / 1024).toFixed(1)} KB
                                    </span>
                                    {item.width && item.height && (
                                        <span className="rounded-full bg-[#333333] px-3 py-1">
                                            {item.width} × {item.height}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleDelete(item)}
                                    disabled={deletingId !== null}
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-700 px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                    {deletingId === item.id
                                        ? 'جارٍ الحذف...'
                                        : 'حذف الصورة'}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {!loading && lastPage > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-[#BDBDBD]">
                        الصفحة {currentPage} من {lastPage}
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => void loadMedia(currentPage - 1)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#505050] bg-[#333333] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#FFD500] hover:bg-[#FFD500]/10 hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight size={16} />
                            السابقة
                        </button>

                        <button
                            type="button"
                            disabled={currentPage >= lastPage}
                            onClick={() => void loadMedia(currentPage + 1)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#505050] bg-[#333333] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#FFD500] hover:bg-[#FFD500]/10 hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            التالية
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
