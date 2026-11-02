import { useCallback, useEffect, useState } from 'react';
import {
    RefreshCw,
    Upload,
    Plus,
    Trash2,
    Save,
    ArrowUp,
    ArrowDown,
    Film,
    Image as ImageIcon,
    Eye,
    EyeOff,
} from 'lucide-react';

import {
    getAdminHeroSlides,
    uploadHeroMedia,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    type AdminHeroSlide,
    type HeroMedia,
} from '../services/hero';

function getMediaUrl(media: HeroMedia): string {
    if (
        media.disk === 'legacy_hero_videos' &&
        media.path
    ) {
        return `/videos/${media.path.replace(/^\/+/, '')}`;
    }

    return `/api/v1/media/${media.id}/original`;
}

function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
        const err = error as {
            response?: {
                status?: number;
                data?: { message?: string };
            };
            code?: string;
            message?: string;
        };

        if (err.response?.status === 413) {
            return 'حجم الفيديو كبير جدًا. اختر ملفًا أصغر من 50 ميغابايت وحاول مرة أخرى.';
        }

        if (
            err.code === 'ERR_NETWORK' ||
            err.message === 'Network Error'
        ) {
            return 'تعذّر رفع الملف. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.';
        }

        if (err.response?.data?.message) {
            return err.response.data.message;
        }

        if (err.message) {
            return err.message;
        }
    }

    return 'تعذّر رفع الملف. تأكد من حجم الملف وصيغته ثم حاول مرة أخرى.';
}

const buttonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#505050] bg-[#333333] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#FFD500] hover:bg-[#FFD500]/10 hover:text-[#FFD500] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

const inputClass =
    'w-full rounded-xl border border-[#505050] bg-[#333333] px-4 py-3 text-sm text-white placeholder:text-[#BDBDBD] outline-none transition-colors focus:border-[#FFD500] focus:ring-2 focus:ring-[#FFD500]/20 cursor-text';

export default function AdminHeroSlides() {
    const [slides, setSlides] = useState<AdminHeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [file, setFile] = useState<File | null>(null);
    const [alt, setAlt] = useState('');
    const [title, setTitle] = useState('JOBICO');
    const [subtitle, setSubtitle] = useState(
        'شركة الجوبي للتجارة والمقاولات',
    );

    const loadSlides = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getAdminHeroSlides();

            if (!Array.isArray(result.data)) {
                throw new Error('تنسيق بيانات الشرائح غير صحيح.');
            }

            setSlides(result.data);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSlides();
    }, [loadSlides]);

    async function handleAddSlide(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!file) {
            setError('اختر صورة أو فيديو أولًا.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        let uploadedMediaId: number | null = null;

        try {
            const uploadedMedia = await uploadHeroMedia(file, alt);
            uploadedMediaId = uploadedMedia.id;

            await createHeroSlide({
                title: title.trim() || null,
                subtitle: subtitle.trim() || null,
                media_id: uploadedMediaId,
                sort_order:
                    slides.length > 0
                        ? Math.max(
                              ...slides.map((slide) => slide.sort_order),
                          ) + 1
                        : 0,
                is_active: true,
            });

            setFile(null);
            setAlt('');
            setTitle('JOBICO');
            setSubtitle('شركة الجوبي للتجارة والمقاولات');

            const input = document.getElementById(
                'hero-media-file',
            ) as HTMLInputElement | null;

            if (input) input.value = '';

            setSuccess('تم رفع الوسائط وإضافة الشريحة بنجاح.');
            await loadSlides();
        } catch (err: unknown) {
            setError(
                uploadedMediaId
                    ? `${getErrorMessage(err)} تم رفع الملف، لكن لم تُنشأ الشريحة؛ يمكنك إعادة المحاولة.`
                    : getErrorMessage(err),
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleUpdate(
        slide: AdminHeroSlide,
        changes: {
            title?: string | null;
            subtitle?: string | null;
            is_active?: boolean;
        },
    ) {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateHeroSlide(slide.id, changes);
            setSuccess('تم تحديث الشريحة بنجاح.');
            await loadSlides();
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(slide: AdminHeroSlide) {
        if (
            !window.confirm(
                'هل تريد حذف هذه الشريحة من العرض؟ لن نحذف ملف الفيديو أو الصورة.',
            )
        ) {
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await deleteHeroSlide(slide.id);
            setSuccess('تم حذف الشريحة من العرض.');
            await loadSlides();
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function moveSlide(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= slides.length) return;

        const reordered = [...slides];

        [reordered[index], reordered[targetIndex]] = [
            reordered[targetIndex],
            reordered[index],
        ];

        const orderedSlides = reordered.map((slide, position) => ({
            ...slide,
            sort_order: position,
        }));

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const result = await reorderHeroSlides(
                orderedSlides.map((slide) => ({
                    id: slide.id,
                    sort_order: slide.sort_order,
                })),
            );

            setSlides(result);
            setSuccess('تم تحديث ترتيب الشرائح.');
        } catch (err: unknown) {
            setError(getErrorMessage(err));
            await loadSlides();
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-6" dir="rtl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">
                        إدارة الواجهة الرئيسية
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-[#BDBDBD]">
                        إدارة الصور والفيديوهات التي تظهر في الواجهة الرئيسية.
                        الملفات القديمة تبقى محفوظة كما هي.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadSlides()}
                    disabled={loading || saving}
                    className={buttonClass}
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
                    {error}
                </div>
            )}

            <form
                onSubmit={handleAddSlide}
                className="space-y-5 rounded-2xl border border-[#505050] bg-[#292929] p-5 shadow-sm sm:p-6"
            >
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#FFD500] p-3 text-[#202020]">
                        <Upload size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white">
                            إضافة صورة أو فيديو
                        </h2>
                        <p className="text-sm text-[#BDBDBD]">
                            ارفع ملفًا جديدًا لإضافته إلى عرض الرئيسية.
                        </p>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="hero-media-file"
                        className="mb-2 block text-sm font-bold text-[#BDBDBD]"
                    >
                        ملف الوسائط
                    </label>
                    <input
                        id="hero-media-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4"
                        onChange={(event) =>
                            setFile(event.target.files?.[0] ?? null)
                        }
                        className="block w-full cursor-pointer rounded-xl border border-[#505050] bg-[#333333] p-3 text-sm text-white file:ml-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#FFD500] file:px-4 file:py-2 file:font-bold file:text-[#202020] hover:file:bg-[#F6C900]"
                    />
                    <p className="mt-2 text-xs text-[#BDBDBD]">
                        الصيغ المدعومة: JPG وPNG وWebP وMP4. الحد الأقصى الحالي 50 ميغابايت.
                    </p>
                </div>

                {file && (
                    <p className="break-all rounded-lg bg-[#333333] p-3 text-sm text-[#BDBDBD]">
                        الملف المختار: {file.name}
                    </p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="new-hero-title"
                            className="mb-2 block text-sm font-bold text-[#BDBDBD]"
                        >
                            النص الرئيسي
                        </label>
                        <input
                            id="new-hero-title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            maxLength={200}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="new-hero-subtitle"
                            className="mb-2 block text-sm font-bold text-[#BDBDBD]"
                        >
                            النص الفرعي
                        </label>
                        <input
                            id="new-hero-subtitle"
                            value={subtitle}
                            onChange={(event) =>
                                setSubtitle(event.target.value)
                            }
                            maxLength={500}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="hero-media-alt"
                        className="mb-2 block text-sm font-bold text-[#BDBDBD]"
                    >
                        وصف الوسائط (اختياري)
                    </label>
                    <input
                        id="hero-media-alt"
                        value={alt}
                        onChange={(event) => setAlt(event.target.value)}
                        maxLength={300}
                        placeholder="وصف مختصر للصورة أو الفيديو"
                        className={inputClass}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving || !file}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#FFD500] px-5 py-3 text-sm font-black text-[#202020] transition-colors hover:bg-[#F6C900] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus size={18} />
                    {saving ? 'جارٍ الحفظ...' : 'رفع وإضافة الشريحة'}
                </button>
            </form>

            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-black text-white">
                        الشرائح الحالية
                    </h2>
                    <p className="mt-1 text-sm text-[#BDBDBD]">
                        غيّر النصوص أو حالة العرض أو ترتيب الشرائح.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-[#505050] bg-[#292929] p-10 text-center text-sm text-[#BDBDBD]">
                        جارٍ تحميل الشرائح...
                    </div>
                ) : slides.length === 0 ? (
                    <div className="rounded-2xl border border-[#505050] bg-[#292929] p-10 text-center">
                        <ImageIcon
                            size={38}
                            className="mx-auto text-[#BDBDBD]"
                        />
                        <p className="mt-3 font-bold text-white">
                            لا توجد شرائح حاليًا
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {slides.map((slide, index) => {
                            const media = slide.media;
                            const isVideo =
                                media?.mime?.startsWith('video/') ?? false;

                            return (
                                <article
                                    key={slide.id}
                                    className="overflow-hidden rounded-2xl border border-[#505050] bg-[#292929] shadow-sm"
                                >
                                    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#1A1A1A]">
                                        {media ? (
                                            isVideo ? (
                                                <video
                                                    src={getMediaUrl(media)}
                                                    controls
                                                    preload="none"
                                                    playsInline
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : (
                                                <img
                                                    src={getMediaUrl(media)}
                                                    alt={media.alt ?? ''}
                                                    loading="lazy"
                                                    className="h-full w-full object-contain"
                                                />
                                            )
                                        ) : (
                                            <div className="text-sm text-white">
                                                لا يوجد ملف مرتبط
                                            </div>
                                        )}

                                        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#292929]/90 px-3 py-1 text-xs font-bold text-white">
                                            {isVideo ? (
                                                <Film
                                                    size={14}
                                                    className="ml-1 inline"
                                                />
                                            ) : (
                                                <ImageIcon
                                                    size={14}
                                                    className="ml-1 inline"
                                                />
                                            )}
                                            شريحة {index + 1}
                                        </span>
                                    </div>

                                    <div className="space-y-4 p-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="break-all text-sm font-bold text-white">
                                                {media?.mime ?? 'بدون وسائط'}
                                            </p>
                                            <span
                                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                                    slide.is_active
                                                        ? 'bg-[#FFD500]/20 text-[#FFD500]'
                                                        : 'bg-[#333333] text-[#BDBDBD]'
                                                }`}
                                            >
                                                {slide.is_active
                                                    ? 'فعّالة'
                                                    : 'متوقفة'}
                                            </span>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`hero-title-${slide.id}`}
                                                className="mb-1 block text-sm font-bold text-[#BDBDBD]"
                                            >
                                                النص الرئيسي
                                            </label>
                                            <input
                                                id={`hero-title-${slide.id}`}
                                                defaultValue={slide.title ?? ''}
                                                maxLength={200}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`hero-subtitle-${slide.id}`}
                                                className="mb-1 block text-sm font-bold text-[#BDBDBD]"
                                            >
                                                النص الفرعي
                                            </label>
                                            <input
                                                id={`hero-subtitle-${slide.id}`}
                                                defaultValue={slide.subtitle ?? ''}
                                                maxLength={500}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() => {
                                                    const titleInput =
                                                        document.getElementById(
                                                            `hero-title-${slide.id}`,
                                                        ) as HTMLInputElement | null;

                                                    const subtitleInput =
                                                        document.getElementById(
                                                            `hero-subtitle-${slide.id}`,
                                                        ) as HTMLInputElement | null;

                                                    void handleUpdate(slide, {
                                                        title:
                                                            titleInput?.value.trim() ||
                                                            null,
                                                        subtitle:
                                                            subtitleInput?.value.trim() ||
                                                            null,
                                                    });
                                                }}
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#FFD500] px-3 py-2.5 text-sm font-bold text-[#202020] transition-colors hover:bg-[#F6C900] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Save size={16} />
                                                حفظ النصوص
                                            </button>

                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() =>
                                                    void handleUpdate(slide, {
                                                        is_active: !slide.is_active,
                                                    })
                                                }
                                                className={buttonClass}
                                            >
                                                {slide.is_active ? (
                                                    <EyeOff size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                                {slide.is_active
                                                    ? 'إيقاف العرض'
                                                    : 'تفعيل العرض'}
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#505050] pt-4">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        saving || index === 0
                                                    }
                                                    onClick={() =>
                                                        void moveSlide(index, -1)
                                                    }
                                                    aria-label="تحريك الشريحة للأعلى"
                                                    className="cursor-pointer rounded-lg border border-[#505050] p-2 text-[#BDBDBD] transition-colors hover:border-[#FFD500] hover:bg-[#FFD500]/10 hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <ArrowUp size={17} />
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        saving ||
                                                        index === slides.length - 1
                                                    }
                                                    onClick={() =>
                                                        void moveSlide(index, 1)
                                                    }
                                                    aria-label="تحريك الشريحة للأسفل"
                                                    className="cursor-pointer rounded-lg border border-[#505050] p-2 text-[#BDBDBD] transition-colors hover:border-[#FFD500] hover:bg-[#FFD500]/10 hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <ArrowDown size={17} />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() =>
                                                    void handleDelete(slide)
                                                }
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-700 px-3 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                                حذف من العرض
                                            </button>
                                        </div>

                                        {media && (
                                            <p className="break-all text-xs text-[#BDBDBD]">
                                                {media.path}
                                            </p>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
