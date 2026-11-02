
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
    Check,
    Image as ImageIcon,
    LoaderCircle,
    Plus,
    Save,
    Settings,
    Trash2,
    Upload,
    X,
} from 'lucide-react';

import {
    getSiteSettings,
    updateSiteSettings,
    getFooterSettings,
    updateFooterSettings,
    type SiteSettings,
    type SettingContactItem,
    type FooterSettings,
} from '../services/setting';

import api from '../../services/api';

interface MediaItem {
    id: number;
    path: string;
    disk?: string;
    alt?: string | null;
    [key: string]: unknown;
}

const emptyContact: SettingContactItem = {
    label: '',
    value: '',
    is_visible: true,
};

const inputClass =
    'mt-2 w-full rounded-xl border border-[#505050] bg-[#333333] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#BDBDBD] focus:border-[#FFD500] focus:ring-2 focus:ring-[#FFD500]/20 disabled:cursor-not-allowed disabled:bg-[#292929] cursor-text';

function getMediaUrl(path: unknown): string | null {
    if (typeof path !== 'string' || !path.trim()) {
        return null;
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const cleanPath = path.replace(/^\/+/, '');

    if (cleanPath.startsWith('storage/')) {
        return `/${cleanPath}`;
    }

    return `/storage/${cleanPath}`;
}

function getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err !== 'object' || err === null) {
        return fallback;
    }

    if ('response' in err) {
        const response = err.response;

        if (typeof response === 'object' && response !== null) {
            if ('data' in response) {
                const data = response.data;

                if (typeof data === 'object' && data !== null) {
                    if (
                        'errors' in data &&
                        typeof data.errors === 'object' &&
                        data.errors !== null
                    ) {
                        const messages = Object.values(data.errors)
                            .flatMap((value) =>
                                Array.isArray(value) ? value : [value],
                            )
                            .filter(
                                (value): value is string =>
                                    typeof value === 'string',
                            );

                        if (messages.length > 0) {
                            return messages.join(' ');
                        }
                    }

                    if (
                        'message' in data &&
                        typeof data.message === 'string'
                    ) {
                        return data.message;
                    }
                }
            }

            if ('status' in response && typeof response.status === 'number') {
                return `${fallback} (HTTP ${response.status})`;
            }
        }
    }

    if ('message' in err && typeof err.message === 'string') {
        return `${fallback} ${err.message}`;
    }

    return fallback;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [footerSettings, setFooterSettings] =
        useState<FooterSettings | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [footerSaving, setFooterSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError('');

            try {
                const [currentSettings, currentFooterSettings] =
                    await Promise.all([
                        getSiteSettings(),
                        getFooterSettings(),
                    ]);

                if (cancelled) return;

                setSettings(currentSettings);
                setFooterSettings(currentFooterSettings);
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        getErrorMessage(
                            err,
                            'تعذر تحميل الإعدادات. تحقق من الاتصال وصلاحيات الإدارة.',
                        ),
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (logoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    function updateField<K extends keyof SiteSettings>(
        field: K,
        value: SiteSettings[K],
    ) {
        setSettings((current) =>
            current ? { ...current, [field]: value } : current,
        );

        setError('');
        setSuccess('');
    }

    function updateFooterField<K extends keyof FooterSettings>(
        field: K,
        value: FooterSettings[K],
    ) {
        setFooterSettings((current) =>
            current ? { ...current, [field]: value } : current,
        );

        setError('');
        setSuccess('');
    }

    async function handleLogoUpload(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const input = event.currentTarget;
        const file = input.files?.[0];

        input.value = '';

        if (!file || !settings || uploadingLogo) return;

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        if (!allowedTypes.includes(file.type)) {
            setError('نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.');
            return;
        }

        const localPreview = URL.createObjectURL(file);

        setLogoPreview((previous) => {
            if (previous?.startsWith('blob:')) {
                URL.revokeObjectURL(previous);
            }

            return localPreview;
        });

        setUploadingLogo(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('alt', `شعار ${settings.company_name}`);

            const response = await api.post<{ data: MediaItem }>(
                '/admin/media',
                formData,
            );

            const uploadedMedia = response.data?.data;

            if (
                !uploadedMedia ||
                typeof uploadedMedia.id !== 'number' ||
                !uploadedMedia.path
            ) {
                throw new Error(
                    'لم تُرجع عملية الرفع بيانات الصورة المطلوبة.',
                );
            }

            setSettings((current) =>
                current
                    ? {
                          ...current,
                          logo_media_id: uploadedMedia.id,
                          logo_media: uploadedMedia,
                      }
                    : current,
            );

            const uploadedUrl = getMediaUrl(uploadedMedia.path);

            setLogoPreview((previous) => {
                if (previous?.startsWith('blob:')) {
                    URL.revokeObjectURL(previous);
                }

                return uploadedUrl;
            });

            setSuccess(
                'تم رفع الشعار. اضغط «حفظ إعدادات الهيدر» لتثبيته على الموقع.',
            );
        } catch (err: unknown) {
            setError(
                getErrorMessage(
                    err,
                    'تعذر رفع الشعار. تحقق من الصورة وصلاحيات الإدارة وحاول مجددًا.',
                ),
            );
        } finally {
            setUploadingLogo(false);
        }
    }

    function removeLogo() {
        updateField('logo_media_id', null);

        setLogoPreview((previous) => {
            if (previous?.startsWith('blob:')) {
                URL.revokeObjectURL(previous);
            }

            return null;
        });
    }

    function updateFooterContact(
        field: 'phones' | 'emails',
        index: number,
        key: keyof SettingContactItem,
        value: string | boolean,
    ) {
        if (!footerSettings) return;

        const items = [...(footerSettings[field] ?? [])];
        items[index] = { ...items[index], [key]: value };

        updateFooterField(field, items);
    }

    function addFooterContact(field: 'phones' | 'emails') {
        if (!footerSettings) return;

        updateFooterField(field, [
            ...(footerSettings[field] ?? []),
            { ...emptyContact },
        ]);
    }

    function removeFooterContact(
        field: 'phones' | 'emails',
        index: number,
    ) {
        if (!footerSettings) return;

        updateFooterField(
            field,
            (footerSettings[field] ?? []).filter(
                (_, itemIndex) => itemIndex !== index,
            ),
        );
    }

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!settings || saving || uploadingLogo) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const updated = await updateSiteSettings({
                company_name: settings.company_name,
                header_subtitle: settings.header_subtitle,
                logo_media_id: settings.logo_media_id,
                hero_mode: settings.hero_mode,
                address: settings.address,
                phones: settings.phones,
                emails: settings.emails,
                map_url: settings.map_url,
            });

            setSettings(updated);

            setLogoPreview((previous) => {
                if (previous?.startsWith('blob:')) {
                    URL.revokeObjectURL(previous);
                }

                return null;
            });

            setSuccess('تم حفظ إعدادات الهيدر بنجاح.');
        } catch (err: unknown) {
            setError(
                getErrorMessage(
                    err,
                    'تعذر حفظ إعدادات الهيدر. تحقق من البيانات المطلوبة في الخادم.',
                ),
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveFooter(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!footerSettings || footerSaving) return;

        setFooterSaving(true);
        setError('');
        setSuccess('');

        try {
            const updated = await updateFooterSettings({
                company_name: footerSettings.company_name,
                subtitle: footerSettings.subtitle,
                address: footerSettings.address,
                phones: footerSettings.phones,
                emails: footerSettings.emails,
                cta_title: footerSettings.cta_title,
                cta_line_1: footerSettings.cta_line_1,
                cta_line_2: footerSettings.cta_line_2,
                cta_button_text: footerSettings.cta_button_text,
                copyright_text: footerSettings.copyright_text,
            });

            setFooterSettings(updated);
            setSuccess('تم حفظ إعدادات الفوتر بنجاح.');
        } catch (err: unknown) {
            setError(
                getErrorMessage(
                    err,
                    'تعذر حفظ إعدادات الفوتر. تحقق من البيانات المطلوبة في الخادم.',
                ),
            );
        } finally {
            setFooterSaving(false);
        }
    }

    if (loading) {
        return (
            <div
                dir="rtl"
                className="flex items-center justify-center gap-3 bg-[#1A1A1A] p-12 text-[#BDBDBD]"
            >
                <LoaderCircle size={20} className="animate-spin" />
                جارٍ تحميل الإعدادات...
            </div>
        );
    }

    if (!settings || !footerSettings) {
        return (
            <div
                dir="rtl"
                className="rounded-2xl border border-red-800 bg-red-950/40 p-5 text-sm leading-6 text-red-300"
            >
                {error || 'تعذر تحميل إعدادات الموقع.'}
            </div>
        );
    }

    const currentLogo =
        logoPreview ?? getMediaUrl(settings.logo_media?.path);

    return (
        <div dir="rtl" className="space-y-6 bg-[#1A1A1A] text-right text-white">
            <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#FFD500] p-3 text-[#202020]">
                    <Settings size={24} />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-white">
                        إعدادات الموقع
                    </h1>

                    <p className="mt-1 text-sm text-[#BDBDBD]">
                        إدارة إعدادات الهيدر والفوتر بشكل مستقل.
                    </p>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm leading-6 text-red-300"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="flex items-center gap-2 rounded-xl border border-[#FFD500]/40 bg-[#FFD500]/10 p-4 text-sm text-[#FFD500]"
                >
                    <Check size={18} className="shrink-0 text-[#FFD500]" />
                    {success}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <SettingsSection
                    title="إعدادات الهيدر"
                    description="إعدادات اسم الشركة وعنوانها الفرعي وشعارها."
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="اسم الشركة">
                            <input
                                required
                                maxLength={200}
                                value={settings.company_name ?? ''}
                                onChange={(event) =>
                                    updateField(
                                        'company_name',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                        </Field>

                        <Field label="العنوان الفرعي للهيدر">
                            <input
                                required
                                maxLength={200}
                                value={settings.header_subtitle ?? ''}
                                onChange={(event) =>
                                    updateField(
                                        'header_subtitle',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                                placeholder="CONTRACTING & TRADING"
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <div className="text-sm font-semibold text-white">
                                شعار الشركة
                            </div>

                            <div className="mt-2 flex flex-col gap-4 rounded-xl border border-[#505050] bg-[#333333] p-4 sm:flex-row sm:items-center">
                                <div className="flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#505050] bg-[#292929]">
                                    {currentLogo ? (
                                        <img
                                            src={currentLogo}
                                            alt="معاينة شعار الشركة"
                                            className="h-full w-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-[#BDBDBD]">
                                            <ImageIcon size={28} />
                                            <span className="text-xs">
                                                لا يوجد شعار
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <label
                                        className={`inline-flex items-center gap-2 rounded-xl bg-[#FFD500] px-4 py-3 text-sm font-bold text-[#202020] transition ${
                                            uploadingLogo || saving
                                                ? 'cursor-not-allowed opacity-60'
                                                : 'cursor-pointer hover:bg-[#F6C900]'
                                        }`}
                                    >
                                        {uploadingLogo ? (
                                            <LoaderCircle
                                                size={18}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Upload size={18} />
                                        )}

                                        {uploadingLogo
                                            ? 'جارٍ رفع الشعار...'
                                            : 'اختيار شعار من الجهاز'}

                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                            disabled={
                                                uploadingLogo || saving
                                            }
                                            onChange={handleLogoUpload}
                                            className="sr-only"
                                        />
                                    </label>

                                    {settings.logo_media_id != null && (
                                        <button
                                            type="button"
                                            disabled={
                                                uploadingLogo || saving
                                            }
                                            onClick={removeLogo}
                                            className="mr-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#505050] bg-[#292929] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#FFD500] hover:bg-[#FFD500]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <X size={16} />
                                            إزالة الشعار
                                        </button>
                                    )}

                                    <p className="mt-3 text-xs leading-6 text-[#BDBDBD]">
                                        الصيغ المدعومة: JPG وPNG وWebP.
                                        الحجم الأقصى 5 ميغابايت.
                                    </p>

                                    <p className="text-xs leading-6 text-[#BDBDBD]">
                                        بعد رفع الشعار، اضغط «حفظ إعدادات الهيدر»
                                        لتثبيته.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                <SettingsSection
                    title="الواجهة الرئيسية"
                    description="حدد طريقة عرض القسم الرئيسي في الصفحة الرئيسية."
                >
                    <Field label="طريقة العرض">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <ModeOption
                                active={settings.hero_mode === 'image'}
                                title="صورة"
                                description="عرض صورة رئيسية واحدة."
                                onClick={() =>
                                    updateField('hero_mode', 'image')
                                }
                            />

                            <ModeOption
                                active={settings.hero_mode === 'slider'}
                                title="سلايدر"
                                description="عرض الشرائح الرئيسية بالتتابع."
                                onClick={() =>
                                    updateField('hero_mode', 'slider')
                                }
                            />
                        </div>

                        {settings.hero_mode === 'image' && (
                            <p className="mt-3 rounded-lg border border-[#FFD500]/30 bg-[#FFD500]/10 p-3 text-xs leading-6 text-[#FFD500]">
                                يتطلب وضع الصورة وجود شريحة فعّالة واحدة على
                                الأقل مرتبطة بصورة.
                            </p>
                        )}
                    </Field>
                </SettingsSection>

                <div className="flex justify-start">
                    <button
                        type="submit"
                        disabled={saving || uploadingLogo}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FFD500] px-6 py-3 text-sm font-bold text-[#202020] transition hover:bg-[#F6C900] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Save size={18} />
                        )}

                        {saving
                            ? 'جارٍ الحفظ...'
                            : 'حفظ إعدادات الهيدر'}
                    </button>
                </div>
            </form>

            <form onSubmit={handleSaveFooter} className="space-y-6">
                <SettingsSection
                    title="إعدادات الفوتر"
                    description="هذه الإعدادات مستقلة عن الهيدر، ويتم حفظها بشكل منفصل."
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="اسم الشركة في الفوتر">
                            <input
                                required
                                maxLength={200}
                                value={footerSettings.company_name ?? ''}
                                onChange={(event) =>
                                    updateFooterField(
                                        'company_name',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                        </Field>

                        <Field label="عنوان الشركة">
                            <input
                                required
                                maxLength={200}
                                value={footerSettings.subtitle ?? ''}
                                onChange={(event) =>
                                    updateFooterField(
                                        'subtitle',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                                placeholder="CONTRACTING & TRADING"
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="عنوان الشركة في الفوتر">
                                <input
                                    maxLength={500}
                                    value={footerSettings.address ?? ''}
                                    onChange={(event) =>
                                        updateFooterField(
                                            'address',
                                            event.target.value || null,
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="أدخل عنوان الشركة"
                                />
                            </Field>
                        </div>
                    </div>
                </SettingsSection>

                <SettingsSection
                    title="أرقام هاتف الفوتر"
                    description="أضف الأرقام التي تريد إظهارها في الفوتر وحدد العناصر الظاهرة للزوار."
                >
                    <ContactList
                        items={footerSettings.phones ?? []}
                        valueLabel="رقم الهاتف"
                        valueType="tel"
                        onAdd={() => addFooterContact('phones')}
                        onRemove={(index) =>
                            removeFooterContact('phones', index)
                        }
                        onChange={(index, key, value) =>
                            updateFooterContact(
                                'phones',
                                index,
                                key,
                                value,
                            )
                        }
                    />
                </SettingsSection>

                <SettingsSection
                    title="البريد الإلكتروني للفوتر"
                    description="أضف عناوين البريد الإلكتروني الخاصة بالفوتر بشكل مستقل."
                >
                    <ContactList
                        items={footerSettings.emails ?? []}
                        valueLabel="البريد الإلكتروني"
                        valueType="email"
                        onAdd={() => addFooterContact('emails')}
                        onRemove={(index) =>
                            removeFooterContact('emails', index)
                        }
                        onChange={(index, key, value) =>
                            updateFooterContact(
                                'emails',
                                index,
                                key,
                                value,
                            )
                        }
                    />
                </SettingsSection>

                <SettingsSection
                    title="نصوص الفوتر"
                    description="تحكم بالنصوص والعنوان والزر الظاهر في القسم السفلي من الموقع."
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="عنوان الدعوة الرئيسي">
                            <input
                                required
                                maxLength={200}
                                value={footerSettings.cta_title ?? ''}
                                onChange={(event) =>
                                    updateFooterField(
                                        'cta_title',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                                placeholder="LET'S BUILD SOMETHING LASTING"
                            />
                        </Field>

                        <Field label="نص الزر">
                            <input
                                required
                                maxLength={100}
                                value={footerSettings.cta_button_text ?? ''}
                                onChange={(event) =>
                                    updateFooterField(
                                        'cta_button_text',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                                placeholder="GET STARTED"
                            />
                        </Field>

                        <Field label="السطر الأول">
                            <input
                                required
                                maxLength={200}
                                value={footerSettings.cta_line_1 ?? ''}
                                onChange={(event) =>
                                    updateFooterField(
                                        'cta_line_1',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                                placeholder="Have a project"
                            />
                        </Field>

                        <Field label="السطر الثاني">
                            <input
                                required
                                maxLength={200}
                                value={footerSettings.cta_line_2 ?? ''}
                                onChange={(event) =>
                                    updateFooterField(
                                        'cta_line_2',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                                placeholder="in mind?"
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="نص حقوق النشر">
                                <input
                                    required
                                    maxLength={200}
                                    value={footerSettings.copyright_text ?? ''}
                                    onChange={(event) =>
                                        updateFooterField(
                                            'copyright_text',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="ALL RIGHTS RESERVED."
                                />
                            </Field>
                        </div>
                    </div>
                </SettingsSection>

                <div className="flex justify-start">
                    <button
                        type="submit"
                        disabled={footerSaving}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FFD500] px-6 py-3 text-sm font-bold text-[#202020] transition hover:bg-[#F6C900] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {footerSaving ? (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Save size={18} />
                        )}

                        {footerSaving
                            ? 'جارٍ حفظ الفوتر...'
                            : 'حفظ إعدادات الفوتر'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function SettingsSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-[#505050] bg-[#292929] p-5 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-[#505050] pb-4">
                <h2 className="text-lg font-bold text-white">
                    {title}
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#BDBDBD]">
                    {description}
                </p>
            </div>

            {children}
        </section>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block text-sm font-semibold text-[#BDBDBD]">
            {label}
            {children}
        </label>
    );
}

function ModeOption({
    active,
    title,
    description,
    onClick,
}: {
    active: boolean;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`cursor-pointer rounded-xl border p-4 text-right transition duration-200 ${
                active
                    ? 'border-[#FFD500] bg-[#FFD500]/10 ring-1 ring-[#FFD500]/50'
                    : 'border-[#505050] bg-[#333333] hover:border-[#FFD500] hover:bg-[#FFD500]/5'
            }`}
        >
            <span className="flex items-center gap-2 font-bold text-white">
                <ImageIcon size={18} />
                {title}
            </span>

            <span className="mt-2 block text-xs leading-5 text-[#BDBDBD]">
                {description}
            </span>
        </button>
    );
}

function ContactList({
    items,
    valueLabel,
    valueType,
    onAdd,
    onRemove,
    onChange,
}: {
    items: SettingContactItem[];
    valueLabel: string;
    valueType: 'tel' | 'email';
    onAdd: () => void;
    onRemove: (index: number) => void;
    onChange: (
        index: number,
        key: keyof SettingContactItem,
        value: string | boolean,
    ) => void;
}) {
    return (
        <div className="space-y-4">
            {items.length === 0 && (
                <p className="rounded-xl bg-[#333333] p-4 text-sm text-[#BDBDBD]">
                    لا توجد عناصر مضافة حاليًا.
                </p>
            )}

            {items.map((item, index) => (
                <div
                    key={`${valueType}-${index}`}
                    className="grid gap-4 rounded-xl border border-[#505050] bg-[#333333] p-4 sm:grid-cols-2"
                >
                    <Field label="التسمية">
                        <input
                            required
                            maxLength={100}
                            value={item.label ?? ''}
                            onChange={(event) =>
                                onChange(
                                    index,
                                    'label',
                                    event.target.value,
                                )
                            }
                            className={inputClass}
                            placeholder="مثال: الهاتف الرئيسي"
                        />
                    </Field>

                    <Field label={valueLabel}>
                        <input
                            required
                            type={valueType}
                            maxLength={valueType === 'email' ? 255 : 50}
                            value={item.value ?? ''}
                            onChange={(event) =>
                                onChange(
                                    index,
                                    'value',
                                    event.target.value,
                                )
                            }
                            className={inputClass}
                            placeholder={
                                valueType === 'email'
                                    ? 'info@example.com'
                                    : '+963...'
                            }
                        />
                    </Field>

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#BDBDBD]">
                        <input
                            type="checkbox"
                            checked={item.is_visible}
                            onChange={(event) =>
                                onChange(
                                    index,
                                    'is_visible',
                                    event.target.checked,
                                )
                            }
                            className="h-4 w-4 cursor-pointer accent-[#FFD500]"
                        />
                        إظهار هذا العنصر على الموقع
                    </label>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950/40"
                        >
                            <Trash2 size={16} />
                            حذف
                        </button>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={onAdd}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#505050] bg-[#333333] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#FFD500] hover:bg-[#FFD500]/10"
            >
                <Plus size={17} />
                إضافة {valueType === 'email' ? 'بريد إلكتروني' : 'رقم هاتف'}
            </button>
        </div>
    );
}
