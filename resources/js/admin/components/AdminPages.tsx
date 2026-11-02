
import { useCallback, useEffect, useState } from 'react';
import {
    FileText,
    RefreshCw,
    Save,
    Plus,
    Trash2,
} from 'lucide-react';

import {
    getAdminPages,
    updateAdminPage,
    type AdminPage,
} from '../services/page';

type TimelineItem = {
    year: string;
    title: string;
    body: string;
};

type AboutExpertiseItem = {
    title: string;
    body: string;
};

type ExpertiseSectionItem = {
    number: string;
    title: string;
    description: string;
};

type ExpertiseSection = {
    eyebrow: string;
    title_line_1: string;
    title_line_2: string;
    description: string;
    image_media_id: number | null;
    image_caption_eyebrow: string;
    image_caption_title: string;
    items: ExpertiseSectionItem[];
};

type PageValue = {
    title: string;
    seo_title: string;
    seo_description: string;
    intro: string;
    vision: string;
    mission: string;
    timeline: TimelineItem[];
    expertise: AboutExpertiseItem[];
    expertiseSection: ExpertiseSection;
};

type ContentRecord = Record<string, unknown>;

const defaultExpertiseItems = (): ExpertiseSectionItem[] => [
    {
        number: '01',
        title: 'Excavation & Earthworks',
        description: 'Site preparation, excavation and earthmoving.',
    },
    {
        number: '02',
        title: 'Excavation Support',
        description: 'Support for safe and reliable excavation works.',
    },
    {
        number: '03',
        title: 'Infrastructure & Roadworks',
        description: 'Road construction and infrastructure development.',
    },
    {
        number: '04',
        title: 'Bridges & Tunnels',
        description: 'Civil engineering for major infrastructure projects.',
    },
    {
        number: '05',
        title: 'Materials & Recycling',
        description: 'Quarry operations and construction materials.',
    },
];

const defaultExpertiseSection = (): ExpertiseSection => ({
    eyebrow: 'WHAT WE DO',
    title_line_1: 'Our Expertise',
    title_line_2: 'at a Glance.',
    description:
        'From excavation to essential infrastructure, we bring experience, equipment and commitment to every project.',
    image_media_id: null,
    image_caption_eyebrow: 'BUILT ON EXPERIENCE',
    image_caption_title: 'Engineering progress since 1965',
    items: defaultExpertiseItems(),
});

const emptyContent = (): PageValue => ({
    title: '',
    seo_title: '',
    seo_description: '',
    intro: '',
    vision: '',
    mission: '',
    timeline: [],
    expertise: [],
    expertiseSection: defaultExpertiseSection(),
});

function asRecord(value: unknown): ContentRecord {
    if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    ) {
        return value as ContentRecord;
    }

    return {};
}

function readString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function readPositiveId(value: unknown): number | null {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value > 0
    )
        ? value
        : null;
}

function readExpertiseItems(
    value: unknown,
): ExpertiseSectionItem[] {
    if (!Array.isArray(value)) {
        return defaultExpertiseItems();
    }

    return value.map((entry, index) => {
        const item = asRecord(entry);

        return {
            number: readString(
                item.number,
                String(index + 1).padStart(2, '0'),
            ),
            title: readString(item.title),
            description: readString(item.description),
        };
    });
}

function readTimeline(value: unknown): TimelineItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((entry) => {
        const item = asRecord(entry);

        return {
            year: readString(item.year),
            title: readString(item.title),
            body: readString(item.body),
        };
    });
}

function readAboutExpertise(
    value: unknown,
): AboutExpertiseItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((entry) => {
        const item = asRecord(entry);

        return {
            title: readString(item.title),
            body: readString(item.body),
        };
    });
}

function readExpertiseSection(
    value: unknown,
): ExpertiseSection {
    const defaults = defaultExpertiseSection();
    const section = asRecord(value);

    return {
        eyebrow: readString(
            section.eyebrow,
            defaults.eyebrow,
        ),
        title_line_1: readString(
            section.title_line_1,
            defaults.title_line_1,
        ),
        title_line_2: readString(
            section.title_line_2,
            defaults.title_line_2,
        ),
        description: readString(
            section.description,
            defaults.description,
        ),
        image_media_id: readPositiveId(
            section.image_media_id,
        ),
        image_caption_eyebrow: readString(
            section.image_caption_eyebrow,
            defaults.image_caption_eyebrow,
        ),
        image_caption_title: readString(
            section.image_caption_title,
            defaults.image_caption_title,
        ),
        items: readExpertiseItems(section.items),
    };
}

function readPage(page: AdminPage): PageValue {
    const content = asRecord(page.content);

    return {
        ...emptyContent(),
        title: page.title ?? '',
        seo_title: page.seo_title ?? '',
        seo_description: page.seo_description ?? '',
        intro: readString(content.intro),
        vision: readString(content.vision),
        mission: readString(content.mission),
        timeline: readTimeline(content.timeline),
        expertise: readAboutExpertise(content.expertise),
        expertiseSection: readExpertiseSection(
            content.expertise_section,
        ),
    };
}

function errorMessage(error: unknown): string {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };
                };
            }
        ).response;

        const validationErrors = response?.data?.errors;

        if (validationErrors) {
            return Object.values(validationErrors)
                .flat()
                .join(' ');
        }

        if (response?.data?.message) {
            return response.data.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'حدث خطأ. يرجى المحاولة مرة أخرى.';
}

const inputClass =
    'w-full rounded-xl border border-[#505050] bg-[#333333] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[#BDBDBD] focus:border-[#FFD500] focus:ring-2 focus:ring-[#FFD500]/20 cursor-text';

const labelClass =
    'mb-2 block text-sm font-semibold text-white';

const sectionClass =
    'space-y-5 rounded-xl border border-[#505050] bg-[#292929] p-4 md:p-5';

const cardClass =
    'space-y-3 rounded-xl border border-[#505050] bg-[#333333] p-4';

const buttonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#505050] bg-[#333333] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#FFD500] hover:bg-[#FFD500]/10 hover:text-[#FFD500] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

const addButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#FFD500] bg-[#FFD500] px-3 py-2 text-sm font-bold text-[#202020] transition-colors hover:bg-[#F6C900] hover:border-[#F6C900] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

const deleteButtonClass =
    'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 cursor-pointer';

function Field({
    label,
    value,
    onChange,
    multiline = false,
    rows = 3,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className={labelClass}>{label}</span>

            {multiline ? (
                <textarea
                    className={inputClass}
                    rows={rows}
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                />
            ) : (
                <input
                    className={inputClass}
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                />
            )}
        </label>
    );
}

export default function AdminPages() {
    const [pages, setPages] = useState<AdminPage[]>([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [form, setForm] = useState<PageValue>(
        emptyContent(),
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadPages = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getAdminPages();

            setPages(result);

            const selected =
                result.find(
                    (page) => page.slug === selectedSlug,
                ) ?? result[0];

            if (selected) {
                setSelectedSlug(selected.slug);
                setForm(readPage(selected));
            } else {
                setSelectedSlug('');
                setForm(emptyContent());
            }
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [selectedSlug]);

    useEffect(() => {
        void loadPages();
    }, [loadPages]);

    function choosePage(slug: string) {
        const page = pages.find(
            (item) => item.slug === slug,
        );

        if (!page) return;

        setSelectedSlug(slug);
        setForm(readPage(page));
        setError('');
        setNotice('');
    }

    function changeField<K extends keyof PageValue>(
        key: K,
        value: PageValue[K],
    ) {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));

        setNotice('');
    }

    function updateExpertiseSection<
        K extends keyof ExpertiseSection,
    >(
        key: K,
        value: ExpertiseSection[K],
    ) {
        setForm((previous) => ({
            ...previous,
            expertiseSection: {
                ...previous.expertiseSection,
                [key]: value,
            },
        }));

        setNotice('');
    }

    function updateExpertiseSectionItem(
        index: number,
        field: keyof ExpertiseSectionItem,
        value: string,
    ) {
        const items = form.expertiseSection.items.map(
            (item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item,
        );

        updateExpertiseSection('items', items);
    }

    function addExpertiseSectionItem() {
        updateExpertiseSection('items', [
            ...form.expertiseSection.items,
            {
                number: String(
                    form.expertiseSection.items.length + 1,
                ).padStart(2, '0'),
                title: '',
                description: '',
            },
        ]);
    }

    function removeExpertiseSectionItem(index: number) {
        updateExpertiseSection(
            'items',
            form.expertiseSection.items.filter(
                (_, itemIndex) => itemIndex !== index,
            ),
        );
    }

    function updateItem(
        key: 'timeline' | 'expertise',
        index: number,
        field: string,
        value: string,
    ) {
        setForm((previous) => {
            if (key === 'timeline') {
                const items = [...previous.timeline];

                items[index] = {
                    ...items[index],
                    [field]: value,
                };

                return {
                    ...previous,
                    timeline: items,
                };
            }

            const items = [...previous.expertise];

            items[index] = {
                ...items[index],
                [field]: value,
            };

            return {
                ...previous,
                expertise: items,
            };
        });

        setNotice('');
    }

    function addItem(key: 'timeline' | 'expertise') {
        if (key === 'timeline') {
            changeField('timeline', [
                ...form.timeline,
                {
                    year: '',
                    title: '',
                    body: '',
                },
            ]);
        } else {
            changeField('expertise', [
                ...form.expertise,
                {
                    title: '',
                    body: '',
                },
            ]);
        }
    }

    function removeItem(
        key: 'timeline' | 'expertise',
        index: number,
    ) {
        if (key === 'timeline') {
            changeField(
                'timeline',
                form.timeline.filter(
                    (_, itemIndex) => itemIndex !== index,
                ),
            );
        } else {
            changeField(
                'expertise',
                form.expertise.filter(
                    (_, itemIndex) => itemIndex !== index,
                ),
            );
        }
    }

    async function savePage() {
        if (!selectedSlug || saving) return;

        setSaving(true);
        setError('');
        setNotice('');

        /*
         * Projects are no longer managed from this page.
         * Their records and images are managed exclusively
         * through the Admin Projects section.
         */
        let content: Record<string, unknown>;

        if (selectedSlug === 'home') {
            content = {
                vision: form.vision,
                mission: form.mission,

                expertise_section: {
                    eyebrow: form.expertiseSection.eyebrow,
                    title_line_1:
                        form.expertiseSection.title_line_1,
                    title_line_2:
                        form.expertiseSection.title_line_2,
                    description:
                        form.expertiseSection.description,
                    image_media_id:
                        form.expertiseSection.image_media_id,
                    image_caption_eyebrow:
                        form.expertiseSection.image_caption_eyebrow,
                    image_caption_title:
                        form.expertiseSection.image_caption_title,
                    items: form.expertiseSection.items,
                },
            };
        } else if (selectedSlug === 'about') {
            content = {
                intro: form.intro,
                timeline: form.timeline,
                expertise: form.expertise,
            };
        } else {
            content = {
                intro: form.intro,
            };
        }

        try {
            const updated = await updateAdminPage(
                selectedSlug,
                {
                    title: form.title,
                    seo_title: form.seo_title || null,
                    seo_description:
                        form.seo_description || null,
                    content,
                },
            );

            setPages((previous) =>
                previous.map((page) =>
                    page.slug === updated.slug
                        ? updated
                        : page,
                ),
            );

            setForm(readPage(updated));
            setNotice('تم حفظ التعديلات بنجاح.');
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    const selectedPage = pages.find(
        (page) => page.slug === selectedSlug,
    );

    return (
        <section dir="rtl" className="space-y-6">
            {/* HEADER */}

            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">
                        إدارة الصفحات
                    </h1>

                    <p className="mt-2 text-sm text-[#BDBDBD]">
                        تعديل محتوى الصفحات وبيانات محركات البحث.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadPages()}
                    disabled={loading || saving}
                    className={buttonClass}
                >
                    <RefreshCw
                        size={17}
                        className={
                            loading ? 'animate-spin' : ''
                        }
                    />
                    تحديث
                </button>
            </header>

            {/* ERROR */}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
                >
                    {error}
                </div>
            )}

            {/* SUCCESS */}

            {notice && (
                <div
                    role="status"
                    className="rounded-xl border border-[#FFD500]/40 bg-[#FFD500]/10 p-4 text-sm font-semibold text-[#FFD500]"
                >
                    {notice}
                </div>
            )}

            {/* PAGE LIST */}

            {loading ? (
                <div className="rounded-xl border border-[#505050] bg-[#292929] p-8 text-center text-[#BDBDBD]">
                    جارٍ تحميل الصفحات...
                </div>
            ) : pages.length === 0 ? (
                <div className="rounded-xl border border-[#505050] bg-[#292929] p-8 text-center text-[#BDBDBD]">
                    لم يتم العثور على صفحات.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {pages.map((page) => (
                            <button
                                key={page.id}
                                type="button"
                                onClick={() =>
                                    choosePage(page.slug)
                                }
                                className={`rounded-xl border p-4 text-right transition-colors cursor-pointer ${
                                    selectedSlug === page.slug
                                        ? 'border-[#FFD500] bg-[#FFD500]/10 shadow-sm'
                                        : 'border-[#505050] bg-[#292929] hover:border-[#FFD500] hover:bg-[#FFD500]/5'
                                }`}
                            >
                                <FileText
                                    size={20}
                                    className={`mb-2 ${
                                        selectedSlug === page.slug
                                            ? 'text-[#FFD500]'
                                            : 'text-[#BDBDBD]'
                                    }`}
                                />

                                <span className="block font-bold text-white">
                                    {page.title}
                                </span>

                                <span className="mt-1 block text-xs text-[#BDBDBD]">
                                    {page.slug}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* SELECTED PAGE */}

                    {selectedPage && (
                        <div className="space-y-6 rounded-2xl border border-[#505050] bg-[#292929] p-5 shadow-sm md:p-7">
                            <h2 className="border-b border-[#505050] pb-4 text-lg font-black text-white">
                                تعديل: {selectedPage.title}
                            </h2>

                            {/* SEO FIELDS */}

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="عنوان الصفحة"
                                    value={form.title}
                                    onChange={(value) =>
                                        changeField('title', value)
                                    }
                                />

                                <Field
                                    label="عنوان SEO"
                                    value={form.seo_title}
                                    onChange={(value) =>
                                        changeField('seo_title', value)
                                    }
                                />

                                <div className="md:col-span-2">
                                    <Field
                                        label="وصف SEO"
                                        value={form.seo_description}
                                        multiline
                                        rows={3}
                                        onChange={(value) =>
                                            changeField(
                                                'seo_description',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* HOME PAGE */}

                            {selectedSlug === 'home' ? (
                                <div className="space-y-6">
                                    {/* VISION AND MISSION */}

                                    <div className={sectionClass}>
                                        <h3 className="text-lg font-black text-white">
                                            المحتوى الحالي: الرؤية والرسالة
                                        </h3>

                                        <Field
                                            label="الرؤية"
                                            value={form.vision}
                                            multiline
                                            rows={4}
                                            onChange={(value) =>
                                                changeField(
                                                    'vision',
                                                    value,
                                                )
                                            }
                                        />

                                        <Field
                                            label="الرسالة"
                                            value={form.mission}
                                            multiline
                                            rows={4}
                                            onChange={(value) =>
                                                changeField(
                                                    'mission',
                                                    value,
                                                )
                                            }
                                        />
                                    </div>

                                    {/* OUR EXPERTISE */}

                                    <div className={sectionClass}>
                                        <div>
                                            <h3 className="text-lg font-black text-white">
                                                Our Expertise
                                            </h3>

                                            <p className="mt-1 text-sm text-[#BDBDBD]">
                                                إدارة عنوان القسم ووصفه وبطاقات مجالات العمل.
                                            </p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                label="النص العلوي (Eyebrow)"
                                                value={
                                                    form.expertiseSection.eyebrow
                                                }
                                                onChange={(value) =>
                                                    updateExpertiseSection(
                                                        'eyebrow',
                                                        value,
                                                    )
                                                }
                                            />

                                            <Field
                                                label="عنوان السطر الأول"
                                                value={
                                                    form.expertiseSection.title_line_1
                                                }
                                                onChange={(value) =>
                                                    updateExpertiseSection(
                                                        'title_line_1',
                                                        value,
                                                    )
                                                }
                                            />

                                            <Field
                                                label="عنوان السطر الثاني"
                                                value={
                                                    form.expertiseSection.title_line_2
                                                }
                                                onChange={(value) =>
                                                    updateExpertiseSection(
                                                        'title_line_2',
                                                        value,
                                                    )
                                                }
                                            />

                                            <Field
                                                label="وصف القسم"
                                                value={
                                                    form.expertiseSection.description
                                                }
                                                multiline
                                                rows={4}
                                                onChange={(value) =>
                                                    updateExpertiseSection(
                                                        'description',
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>

                                        {/* EXPERTISE IMAGE SETTINGS */}

                                        <div className="space-y-4 border-t border-[#505050] pt-4">
                                            <h4 className="font-bold text-white">
                                                صورة القسم والنص الظاهر عليها
                                            </h4>

                                            <label className="block">
                                                <span className={labelClass}>
                                                    معرّف الصورة (Media ID)
                                                </span>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    className={inputClass}
                                                    value={
                                                        form.expertiseSection.image_media_id ??
                                                        ''
                                                    }
                                                    placeholder="أدخل معرّف صورة موجودة في مكتبة الوسائط"
                                                    onChange={(event) => {
                                                        const value =
                                                            event.target.value;

                                                        const id =
                                                            value.trim() === ''
                                                                ? null
                                                                : Number(value);

                                                        updateExpertiseSection(
                                                            'image_media_id',
                                                            id !== null &&
                                                                Number.isInteger(id) &&
                                                                id > 0
                                                                ? id
                                                                : null,
                                                        );
                                                    }}
                                                />
                                            </label>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label="عنوان الصورة العلوي"
                                                    value={
                                                        form.expertiseSection.image_caption_eyebrow
                                                    }
                                                    onChange={(value) =>
                                                        updateExpertiseSection(
                                                            'image_caption_eyebrow',
                                                            value,
                                                        )
                                                    }
                                                />

                                                <Field
                                                    label="عنوان الصورة"
                                                    value={
                                                        form.expertiseSection.image_caption_title
                                                    }
                                                    onChange={(value) =>
                                                        updateExpertiseSection(
                                                            'image_caption_title',
                                                            value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <p className="text-xs leading-6 text-[#BDBDBD]">
                                                اترك المعرّف فارغاً لإزالة ربط الصورة.
                                                هذا الحقل لا يرفع صورة جديدة.
                                            </p>
                                        </div>

                                        {/* EXPERTISE CARDS */}

                                        <div className="space-y-4 border-t border-[#505050] pt-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <h4 className="font-bold text-white">
                                                    بطاقات مجالات العمل
                                                </h4>

                                                <button
                                                    type="button"
                                                    onClick={addExpertiseSectionItem}
                                                    disabled={
                                                        form.expertiseSection.items.length >= 10
                                                    }
                                                    className={addButtonClass}
                                                >
                                                    <Plus size={16} />
                                                    إضافة مجال
                                                </button>
                                            </div>

                                            {form.expertiseSection.items.map(
                                                (item, index) => (
                                                    <div
                                                        key={index}
                                                        className={cardClass}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="font-bold text-white">
                                                                المجال{' '}
                                                                {index + 1}
                                                            </h5>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeExpertiseSectionItem(
                                                                        index,
                                                                    )
                                                                }
                                                                className={deleteButtonClass}
                                                                aria-label={`حذف المجال ${index + 1}`}
                                                            >
                                                                <Trash2 size={16} />
                                                                حذف
                                                            </button>
                                                        </div>

                                                        <div className="grid gap-3 md:grid-cols-2">
                                                            <Field
                                                                label="رقم البطاقة"
                                                                value={item.number}
                                                                onChange={(value) =>
                                                                    updateExpertiseSectionItem(
                                                                        index,
                                                                        'number',
                                                                        value,
                                                                    )
                                                                }
                                                            />

                                                            <Field
                                                                label="العنوان"
                                                                value={item.title}
                                                                onChange={(value) =>
                                                                    updateExpertiseSectionItem(
                                                                        index,
                                                                        'title',
                                                                        value,
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <Field
                                                            label="الوصف"
                                                            value={item.description}
                                                            multiline
                                                            rows={3}
                                                            onChange={(value) =>
                                                                updateExpertiseSectionItem(
                                                                    index,
                                                                    'description',
                                                                    value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : selectedSlug === 'about' ? (
                                /* ABOUT PAGE */

                                <div className="space-y-5">
                                    <Field
                                        label="المقدمة"
                                        value={form.intro}
                                        multiline
                                        rows={5}
                                        onChange={(value) =>
                                            changeField('intro', value)
                                        }
                                    />

                                    {/* TIMELINE */}

                                    <div className="space-y-3">
                                        <h3 className="font-bold text-white">
                                            الخط الزمني
                                        </h3>

                                        {form.timeline.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className={cardClass}
                                                >
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <Field
                                                            label="السنة"
                                                            value={item.year}
                                                            onChange={(value) =>
                                                                updateItem(
                                                                    'timeline',
                                                                    index,
                                                                    'year',
                                                                    value,
                                                                )
                                                            }
                                                        />

                                                        <Field
                                                            label="العنوان"
                                                            value={item.title}
                                                            onChange={(value) =>
                                                                updateItem(
                                                                    'timeline',
                                                                    index,
                                                                    'title',
                                                                    value,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <Field
                                                        label="التفاصيل"
                                                        value={item.body}
                                                        multiline
                                                        onChange={(value) =>
                                                            updateItem(
                                                                'timeline',
                                                                index,
                                                                'body',
                                                                value,
                                                            )
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className={deleteButtonClass}
                                                        onClick={() =>
                                                            removeItem(
                                                                'timeline',
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={16} />
                                                        حذف المرحلة
                                                    </button>
                                                </div>
                                            ),
                                        )}

                                        <button
                                            type="button"
                                            className={addButtonClass}
                                            onClick={() =>
                                                addItem('timeline')
                                            }
                                            disabled={
                                                form.timeline.length >= 30
                                            }
                                        >
                                            <Plus size={16} />
                                            إضافة مرحلة
                                        </button>
                                    </div>

                                    {/* ABOUT EXPERTISE */}

                                    <div className="space-y-3">
                                        <h3 className="font-bold text-white">
                                            مجالات الخبرة في صفحة من نحن
                                        </h3>

                                        {form.expertise.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className={cardClass}
                                                >
                                                    <Field
                                                        label="العنوان"
                                                        value={item.title}
                                                        onChange={(value) =>
                                                            updateItem(
                                                                'expertise',
                                                                index,
                                                                'title',
                                                                value,
                                                            )
                                                        }
                                                    />

                                                    <Field
                                                        label="التفاصيل"
                                                        value={item.body}
                                                        multiline
                                                        onChange={(value) =>
                                                            updateItem(
                                                                'expertise',
                                                                index,
                                                                'body',
                                                                value,
                                                            )
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className={deleteButtonClass}
                                                        onClick={() =>
                                                            removeItem(
                                                                'expertise',
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={16} />
                                                        حذف المجال
                                                    </button>
                                                </div>
                                            ),
                                        )}

                                        <button
                                            type="button"
                                            className={addButtonClass}
                                            onClick={() =>
                                                addItem('expertise')
                                            }
                                            disabled={
                                                form.expertise.length >= 30
                                            }
                                        >
                                            <Plus size={16} />
                                            إضافة مجال خبرة
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Field
                                    label="مقدمة الصفحة"
                                    value={form.intro}
                                    multiline
                                    rows={6}
                                    onChange={(value) =>
                                        changeField('intro', value)
                                    }
                                />
                            )}

                            {/* SAVE */}

                            <div className="flex justify-start border-t border-[#505050] pt-5">
                                <button
                                    type="button"
                                    onClick={() => void savePage()}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#FFD500] px-5 py-3 text-sm font-bold text-[#202020] transition-colors hover:bg-[#F6C900] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save size={17} />

                                    {saving
                                        ? 'جارٍ الحفظ...'
                                        : 'حفظ التعديلات'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
