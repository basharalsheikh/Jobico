
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import {
    FolderKanban,
    RefreshCw,
    Plus,
    X,
    Save,
    Pencil,
    Trash2,
    ImagePlus,
} from 'lucide-react';

import {
    getProjects,
    getProjectDetails,
    createProject,
    updateProject,
    deleteProject,
    uploadProjectMedia,
} from '../services/projects';

import type {
    AdminProject,
    CreateProjectData,
} from '../services/projects';

const initialForm: CreateProjectData = {
    title: '',
    location: '',
    category_id: null,
    summary: '',
    description: '',
    quantity_text: '',
    cover_media_id: null,
    gallery: [],
    status: 'draft',
    sort_order: 0,
};

const inputClass =
    'w-full rounded-xl border border-[#505050] bg-[#333333] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#BDBDBD] focus:border-[#FFD500] focus:ring-2 focus:ring-[#FFD500]/20 disabled:cursor-not-allowed disabled:bg-[#292929]';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 30;

function getApiError(err: unknown): string | undefined {
    if (
        typeof err !== 'object' ||
        err === null ||
        !('response' in err)
    ) {
        return undefined;
    }

    const response = (
        err as {
            response?: {
                data?: {
                    message?: string;
                    errors?: Record<string, string[]>;
                };
            };
        }
    ).response?.data;

    const validationMessage = response?.errors
        ? Object.values(response.errors).flat()[0]
        : undefined;

    return validationMessage || response?.message;
}

function getMediaUrl(id: number): string {
    return `/api/v1/media/${id}/original`;
}

function isValidImage(file: File): boolean {
    return [
        'image/jpeg',
        'image/png',
        'image/webp',
    ].includes(file.type);
}

export default function AdminProjects() {
    const [projects, setProjects] = useState<AdminProject[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');

    const [showForm, setShowForm] = useState(false);

    const [editingProject, setEditingProject] =
        useState<AdminProject | null>(null);

    const [form, setForm] = useState<CreateProjectData>({
        ...initialForm,
    });

    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const [galleryPreviews, setGalleryPreviews] = useState<
        { id: number; url: string }[]
    >([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Load projects.
    const loadProjects = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');

        try {
            const result = await getProjects(page);

            setProjects(result.data);
            setCurrentPage(result.current_page);
            setLastPage(result.last_page);
            setTotal(result.total);
        } catch (err: unknown) {
            setError(
                getApiError(err) ||
                    'تعذّر تحميل المشاريع. حاول مرة أخرى.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProjects(1);
    }, [loadProjects]);

    // Reset image previews.
    const resetImages = () => {
        setCoverPreview(null);
        setGalleryPreviews([]);
    };

    // Open create form.
    const openCreateForm = () => {
        setEditingProject(null);
        setForm({ ...initialForm });

        resetImages();

        setFormError('');
        setSuccess('');
        setShowForm(true);
    };

    // Open edit form.
    const openEditForm = async (project: AdminProject) => {
        setFormError('');
        setSuccess('');
        setShowForm(false);

        try {
            const details = await getProjectDetails(project.id);

            setEditingProject(details);

            setForm({
                title: details.title,
                location: details.location ?? '',
                category_id: details.category_id ?? null,
                summary: details.summary ?? '',
                quantity_text: details.quantity_text ?? '',
                description: details.description ?? '',
                cover_media_id: details.cover_media_id ?? null,
                gallery:
                    details.gallery?.map((media) => media.id) ?? [],
                status:
                    details.status === 'published'
                        ? 'published'
                        : 'draft',
                sort_order: details.sort_order ?? 0,
            });

            setCoverPreview(
                details.cover_media
                    ? getMediaUrl(details.cover_media.id)
                    : null,
            );

            setGalleryPreviews(
                details.gallery?.map((media) => ({
                    id: media.id,
                    url: getMediaUrl(media.id),
                })) ?? [],
            );

            setShowForm(true);
        } catch (err: unknown) {
            setFormError(
                getApiError(err) ||
                    'تعذّر تحميل تفاصيل المشروع وصوره.',
            );

            setEditingProject(null);
            setShowForm(true);
        }
    };

    // Close form.
    const closeForm = () => {
        if (saving || uploadingImages) return;

        setShowForm(false);
        setEditingProject(null);
        setFormError('');

        resetImages();
    };

    // Update form field.
    const updateField = <K extends keyof CreateProjectData>(
        field: K,
        value: CreateProjectData[K],
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // Upload cover image.
    const handleCoverChange = async (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];

        event.target.value = '';

        if (!file) return;

        if (!isValidImage(file)) {
            setFormError('اختر صورة بصيغة JPG أو PNG أو WebP.');
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setFormError('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.');
            return;
        }

        setFormError('');
        setUploadingImages(true);

        try {
            const uploaded = await uploadProjectMedia(file);

            updateField('cover_media_id', uploaded.id);
            setCoverPreview(getMediaUrl(uploaded.id));
        } catch (err: unknown) {
            setFormError(
                getApiError(err) ||
                    'فشل رفع صورة الغلاف. حاول مرة أخرى.',
            );
        } finally {
            setUploadingImages(false);
        }
    };

    // Upload gallery images.
    const handleGalleryChange = async (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(event.target.files ?? []);

        event.target.value = '';

        if (files.length === 0) return;

        const existingIds = form.gallery ?? [];
        const remaining = MAX_GALLERY_IMAGES - existingIds.length;

        if (remaining <= 0) {
            setFormError(
                `وصلت إلى الحد الأقصى للمعرض وهو ${MAX_GALLERY_IMAGES} صورة.`,
            );
            return;
        }

        if (files.length > remaining) {
            setFormError(
                `يمكنك إضافة ${remaining} صورة فقط. الحد الأقصى ${MAX_GALLERY_IMAGES} صورة.`,
            );
            return;
        }

        const invalidFile = files.find(
            (file) =>
                !isValidImage(file) ||
                file.size > MAX_IMAGE_SIZE,
        );

        if (invalidFile) {
            setFormError(
                'كل الصور يجب أن تكون JPG أو PNG أو WebP، وألا يتجاوز حجم الصورة 5 ميغابايت.',
            );
            return;
        }

        setFormError('');
        setUploadingImages(true);

        try {
            const uploadedImages = [];

            for (const file of files) {
                const uploaded = await uploadProjectMedia(file);
                uploadedImages.push(uploaded);
            }

            const newIds = uploadedImages.map(
                (media) => media.id,
            );

            setForm((previous) => ({
                ...previous,
                gallery: [
                    ...(previous.gallery ?? []),
                    ...newIds,
                ],
            }));

            setGalleryPreviews((previous) => [
                ...previous,
                ...newIds.map((id) => ({
                    id,
                    url: getMediaUrl(id),
                })),
            ]);
        } catch (err: unknown) {
            setFormError(
                getApiError(err) ||
                    'تعذّر رفع بعض الصور. تحقق من المعرض وحاول مجدداً.',
            );
        } finally {
            setUploadingImages(false);
        }
    };

    // Remove cover image from the project.
    const removeCoverImage = () => {
        updateField('cover_media_id', null);
        setCoverPreview(null);
        setFormError('');
    };

    // Remove gallery image from the project.
    const removeGalleryImage = (id: number) => {
        setForm((previous) => ({
            ...previous,
            gallery: (previous.gallery ?? []).filter(
                (imageId) => imageId !== id,
            ),
        }));

        setGalleryPreviews((previous) =>
            previous.filter((image) => image.id !== id),
        );
    };

    // Save project.
    const handleSave = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setFormError('');
        setSuccess('');

        if (uploadingImages) {
            setFormError(
                'انتظر حتى ينتهي رفع الصور قبل الحفظ.',
            );
            return;
        }

        const title = form.title.trim();

        if (!title) {
            setFormError('يرجى إدخال اسم المشروع.');
            return;
        }

        if (title.length > 200) {
            setFormError('اسم المشروع يجب ألا يتجاوز 200 حرف.');
            return;
        }

        const projectBeingEdited = editingProject;

        setSaving(true);

        try {
            const payload: CreateProjectData = {
                ...form,
                title,
                location: form.location?.trim() || null,
                category_id: form.category_id ?? null,
                summary: form.summary?.trim() || null,
                quantity_text: form.quantity_text?.trim() || null,
                description: form.description?.trim() || null,
                cover_media_id: form.cover_media_id ?? null,
                gallery: form.gallery ?? [],
                sort_order: Math.max(
                    0,
                    Number(form.sort_order) || 0,
                ),
            };

            if (projectBeingEdited) {
                await updateProject(
                    projectBeingEdited.id,
                    payload,
                );
            } else {
                await createProject(payload);
            }

            setShowForm(false);
            setEditingProject(null);
            setForm({ ...initialForm });

            resetImages();

            setSuccess(
                projectBeingEdited
                    ? 'تم تعديل المشروع بنجاح.'
                    : 'تم إنشاء المشروع بنجاح.',
            );

            await loadProjects(
                projectBeingEdited ? currentPage : 1,
            );
        } catch (err: unknown) {
            setFormError(
                getApiError(err) ||
                    `تعذّر ${
                        projectBeingEdited ? 'تعديل' : 'إنشاء'
                    } المشروع. تحقق من البيانات وحاول مجدداً.`,
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete project.
    const handleDelete = async (project: AdminProject) => {
        const confirmed = window.confirm(
            `هل أنت متأكد من حذف المشروع "${project.title}"؟ لا يمكن التراجع عن هذا الإجراء.`,
        );

        if (!confirmed) return;

        setDeletingId(project.id);
        setError('');
        setSuccess('');

        try {
            await deleteProject(project.id);

            setSuccess('تم حذف المشروع بنجاح.');

            const nextPage =
                projects.length === 1 && currentPage > 1
                    ? currentPage - 1
                    : currentPage;

            await loadProjects(nextPage);
        } catch (err: unknown) {
            setError(
                getApiError(err) ||
                    'تعذّر حذف المشروع. حاول مرة أخرى.',
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="space-y-6" dir="rtl">
            {/* HEADER */}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">
                        المشاريع
                    </h1>

                    <p className="mt-2 text-sm text-[#BDBDBD]">
                        عرض وإدارة مشاريع شركة الجوبي.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#FFD500] px-4 py-2.5 text-sm font-bold text-[#202020] transition hover:bg-[#F6C900]"
                    >
                        <Plus size={17} />
                        إضافة مشروع
                    </button>

                    <button
                        type="button"
                        onClick={() => void loadProjects(currentPage)}
                        disabled={loading}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#505050] bg-[#333333] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#FFD500] hover:bg-[#FFD500]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? 'animate-spin' : ''}
                        />
                        تحديث
                    </button>
                </div>
            </div>

            {/* SUCCESS */}

            {success && (
                <div
                    role="status"
                    className="rounded-xl border border-[#FFD500]/60 bg-[#FFD500]/10 p-4 text-sm font-medium text-[#FFD500]"
                >
                    {success}
                </div>
            )}

            {/* PROJECT COUNT */}

            <div className="flex items-center gap-3 rounded-2xl border border-[#505050] bg-[#292929] p-5 shadow-sm">
                <div className="rounded-xl bg-[#FFD500] p-3 text-[#202020]">
                    <FolderKanban size={24} />
                </div>

                <div>
                    <p className="text-sm text-[#BDBDBD]">
                        إجمالي المشاريع
                    </p>

                    <p className="mt-1 text-2xl font-black text-white">
                        {total}
                    </p>
                </div>
            </div>

            {/* ERROR */}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => void loadProjects(currentPage)}
                        disabled={loading}
                        className="mt-2 cursor-pointer font-bold underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {/* PROJECTS TABLE */}

            <div className="overflow-hidden rounded-2xl border border-[#505050] bg-[#292929] shadow-sm">
                {loading ? (
                    <div
                        className="p-10 text-center text-sm text-[#BDBDBD]"
                        role="status"
                    >
                        جارٍ تحميل المشاريع...
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-sm text-[#BDBDBD]">
                        تعذّر عرض قائمة المشاريع.
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-10 text-center">
                        <FolderKanban
                            size={36}
                            className="mx-auto text-[#BDBDBD]"
                        />

                        <p className="mt-3 font-bold text-white">
                            لا توجد مشاريع
                        </p>

                        <p className="mt-1 text-sm text-[#BDBDBD]">
                            يمكنك إضافة أول مشروع من الزر أعلاه.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-right">
                            <thead className="bg-[#333333] text-xs text-[#BDBDBD]">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">
                                        المشروع
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        الحالة
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        تاريخ التحديث
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        الإجراءات
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#505050]">
                                {projects.map((project) => (
                                    <tr
                                        key={project.id}
                                        className="transition hover:bg-[#FFD500]/5"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-white">
                                                {project.title}
                                            </p>

                                            <p className="mt-1 text-xs text-[#BDBDBD]">
                                                #{project.id}
                                                {project.slug
                                                    ? ` · ${project.slug}`
                                                    : ''}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={
                                                    project.status === 'published'
                                                        ? 'rounded-full border border-[#FFD500] bg-[#FFD500]/20 px-3 py-1 text-xs font-bold text-[#FFD500]'
                                                        : 'rounded-full border border-[#505050] bg-[#333333] px-3 py-1 text-xs font-semibold text-[#BDBDBD]'
                                                }
                                            >
                                                {project.status === 'draft'
                                                    ? 'مسودة'
                                                    : project.status === 'published'
                                                      ? 'منشور'
                                                      : project.status || '—'}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-[#BDBDBD]">
                                            {project.updated_at
                                                ? new Date(
                                                      project.updated_at,
                                                  ).toLocaleDateString('ar')
                                                : '—'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void openEditForm(project)
                                                    }
                                                    disabled={deletingId !== null}
                                                    title="تعديل المشروع"
                                                    aria-label={`تعديل ${project.title}`}
                                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#505050] px-3 py-2 text-sm font-semibold text-white transition hover:border-[#FFD500] hover:bg-[#FFD500]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Pencil size={15} />
                                                    تعديل
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleDelete(project)
                                                    }
                                                    disabled={deletingId !== null}
                                                    title="حذف المشروع"
                                                    aria-label={`حذف ${project.title}`}
                                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-800 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 size={15} />

                                                    {deletingId === project.id
                                                        ? 'جارٍ الحذف...'
                                                        : 'حذف'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PAGINATION */}

            {!loading && !error && lastPage > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-[#BDBDBD]">
                        الصفحة {currentPage} من {lastPage}
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() =>
                                void loadProjects(currentPage - 1)
                            }
                            className="cursor-pointer rounded-xl border border-[#505050] bg-[#333333] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#FFD500] hover:bg-[#FFD500]/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            السابقة
                        </button>

                        <button
                            type="button"
                            disabled={currentPage >= lastPage}
                            onClick={() =>
                                void loadProjects(currentPage + 1)
                            }
                            className="cursor-pointer rounded-xl border border-[#505050] bg-[#333333] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#FFD500] hover:bg-[#FFD500]/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            التالية
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT MODAL */}

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#111111]/80 p-4 py-8"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeForm();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="project-form-title"
                        className="w-full max-w-2xl rounded-2xl border border-[#505050] bg-[#202020] shadow-2xl"
                    >
                        {/* MODAL HEADER */}

                        <div className="flex items-center justify-between border-b border-[#505050] p-5">
                            <div>
                                <h2
                                    id="project-form-title"
                                    className="text-xl font-black text-white"
                                >
                                    {editingProject
                                        ? 'تعديل المشروع'
                                        : 'إضافة مشروع جديد'}
                                </h2>

                                <p className="mt-1 text-sm text-[#BDBDBD]">
                                    أدخل معلومات المشروع وصوره.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving || uploadingImages}
                                aria-label="إغلاق النموذج"
                                className="cursor-pointer rounded-lg p-2 text-[#BDBDBD] transition hover:bg-[#FFD500]/15 hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={handleSave}
                            className="space-y-5 p-5"
                        >
                            {formError && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-300"
                                >
                                    {formError}
                                </div>
                            )}

                            {/* PROJECT NAME */}

                            <div>
                                <label
                                    htmlFor="project-title"
                                    className="mb-2 block text-sm font-bold text-white"
                                >
                                    اسم المشروع *
                                </label>

                                <input
                                    id="project-title"
                                    required
                                    maxLength={200}
                                    value={form.title}
                                    onChange={(event) =>
                                        updateField(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="مثال: تنفيذ طريق..."
                                />
                            </div>

                            {/* COVER IMAGE */}

                            <div className="space-y-3 rounded-2xl border border-[#505050] bg-[#292929] p-4">
                                <div>
                                    <label
                                        htmlFor="project-cover"
                                        className="mb-2 block text-sm font-bold text-white"
                                    >
                                        صورة الغلاف
                                    </label>

                                    <input
                                        id="project-cover"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) =>
                                            void handleCoverChange(event)
                                        }
                                        disabled={uploadingImages || saving}
                                        className={`${inputClass} cursor-pointer file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#FFD500]/25 file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#FFD500]`}
                                    />

                                    <p className="mt-1 text-xs text-[#BDBDBD]">
                                        JPG أو PNG أو WebP، بحد أقصى 5 ميغابايت.
                                    </p>
                                </div>

                                {coverPreview ? (
                                    <div className="relative overflow-hidden rounded-xl border border-[#505050]">
                                        <img
                                            src={coverPreview}
                                            alt="معاينة صورة غلاف المشروع"
                                            className="h-48 w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={removeCoverImage}
                                            disabled={uploadingImages || saving}
                                            aria-label="إزالة صورة الغلاف"
                                            title="إزالة صورة الغلاف"
                                            className="absolute left-2 top-2 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#202020] p-2 text-red-400 shadow-md transition hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex h-32 items-center justify-center rounded-xl bg-[#333333] text-sm text-[#BDBDBD]">
                                        لم يتم اختيار صورة غلاف
                                    </div>
                                )}
                            </div>

                            {/* GALLERY */}

                            <div className="space-y-3 rounded-2xl border border-[#505050] bg-[#292929] p-4">
                                <div>
                                    <label
                                        htmlFor="project-gallery"
                                        className="mb-2 block text-sm font-bold text-white"
                                    >
                                        معرض الصور
                                    </label>

                                    <input
                                        id="project-gallery"
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) =>
                                            void handleGalleryChange(event)
                                        }
                                        disabled={uploadingImages || saving}
                                        className={`${inputClass} cursor-pointer file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#FFD500]/25 file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#FFD500]`}
                                    />

                                    <p className="mt-1 text-xs text-[#BDBDBD]">
                                        يمكنك اختيار عدة صور. الحد الأقصى 30 صورة،
                                        وحجم كل صورة 5 ميغابايت.
                                    </p>
                                </div>

                                {galleryPreviews.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {galleryPreviews.map((image) => (
                                            <div
                                                key={image.id}
                                                className="relative overflow-hidden rounded-xl border border-[#505050]"
                                            >
                                                <img
                                                    src={image.url}
                                                    alt="صورة من معرض المشروع"
                                                    className="h-32 w-full object-cover"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeGalleryImage(image.id)
                                                    }
                                                    disabled={uploadingImages || saving}
                                                    aria-label="إزالة الصورة من المعرض"
                                                    title="إزالة الصورة من المعرض"
                                                    className="absolute left-2 top-2 cursor-pointer rounded-full bg-[#202020] p-2 text-red-400 shadow transition hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-xl bg-[#333333] p-6 text-sm text-[#BDBDBD]">
                                        <ImagePlus size={28} />

                                        <span className="mt-2">
                                            لا توجد صور في المعرض
                                        </span>
                                    </div>
                                )}

                                <p className="text-xs text-[#BDBDBD]">
                                    عدد الصور: {galleryPreviews.length} / {MAX_GALLERY_IMAGES}
                                </p>
                            </div>

                            {/* UPLOAD STATUS */}

                            {uploadingImages && (
                                <p
                                    role="status"
                                    className="text-sm font-semibold text-[#FFD500]"
                                >
                                    جارٍ رفع الصور، يرجى الانتظار...
                                </p>
                            )}

                            {/* LOCATION */}

                            <div>
                                <label
                                    htmlFor="project-location"
                                    className="mb-2 block text-sm font-bold text-white"
                                >
                                    الموقع
                                </label>

                                <input
                                    id="project-location"
                                    maxLength={200}
                                    value={form.location ?? ''}
                                    onChange={(event) =>
                                        updateField(
                                            'location',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="مثال: دمشق، سوريا"
                                />
                            </div>

                            {/* DESCRIPTION */}

                            <div>
                                <label
                                    htmlFor="project-description"
                                    className="mb-2 block text-sm font-bold text-white"
                                >
                                    وصف المشروع
                                </label>

                                <textarea
                                    id="project-description"
                                    rows={4}
                                    value={form.description ?? ''}
                                    onChange={(event) =>
                                        updateField(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="اكتب تفاصيل المشروع وأعماله."
                                />
                            </div>

                            {/* STATUS */}

                            <div>
                                <label
                                    htmlFor="project-status"
                                    className="mb-2 block text-sm font-bold text-white"
                                >
                                    الحالة
                                </label>

                                <select
                                    id="project-status"
                                    value={form.status}
                                    onChange={(event) =>
                                        updateField(
                                            'status',
                                            event.target.value as CreateProjectData['status'],
                                        )
                                    }
                                    className={`${inputClass} cursor-pointer`}
                                >
                                    <option value="draft">
                                        مسودة
                                    </option>

                                    <option value="published">
                                        منشور
                                    </option>
                                </select>
                            </div>

                            {/* SORT ORDER */}

                            <div>
                                <label
                                    htmlFor="project-sort-order"
                                    className="mb-2 block text-sm font-bold text-white"
                                >
                                    ترتيب العرض
                                </label>

                                <input
                                    id="project-sort-order"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={form.sort_order ?? 0}
                                    onChange={(event) =>
                                        updateField(
                                            'sort_order',
                                            Math.max(
                                                0,
                                                Number(event.target.value) || 0,
                                            ),
                                        )
                                    }
                                    className={inputClass}
                                />
                            </div>

                            {/* FORM ACTIONS */}

                            <div className="flex flex-wrap justify-end gap-3 border-t border-[#505050] pt-5">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving || uploadingImages}
                                    className="cursor-pointer rounded-xl border border-[#505050] px-5 py-3 text-sm font-bold text-white transition hover:border-[#FFD500] hover:bg-[#FFD500]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    إلغاء
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving || uploadingImages}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#FFD500] px-5 py-3 text-sm font-black text-[#202020] transition hover:bg-[#F6C900] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save size={17} />

                                    {saving
                                        ? 'جارٍ الحفظ...'
                                        : editingProject
                                          ? 'حفظ التعديلات'
                                          : 'حفظ المشروع'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
