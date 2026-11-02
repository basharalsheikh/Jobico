
import { useCallback, useEffect, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    Mail,
    MailOpen,
    MessageSquare,
    Phone,
    RefreshCw,
    Search,
    X,
} from 'lucide-react';

import {
    getContactMessages,
    getContactMessage,
    markContactMessageAsRead,
    type ContactMessage,
    type MessageReadFilter,
    type PaginatedContactMessages,
} from '../services/contactMessages';

const initialPagination: PaginatedContactMessages = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
};

export default function AdminContactMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [filter, setFilter] = useState<MessageReadFilter>('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] =
        useState<PaginatedContactMessages>(initialPagination);
    const [selectedMessage, setSelectedMessage] =
        useState<ContactMessage | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadMessages = useCallback(
        async (showRefresh = false) => {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            try {
                const result = await getContactMessages(page, filter);
                setMessages(result.data);
                setPagination(result);
            } catch {
                setError('تعذر تحميل الرسائل. تحقق من الاتصال ثم حاول مجددًا.');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, filter],
    );

    useEffect(() => {
        void loadMessages();
    }, [loadMessages]);

    const unreadCount = messages.filter(
        (message) => message.read_at === null,
    ).length;

    const filteredMessages = messages.filter((message) => {
        const term = search.trim().toLowerCase();

        if (!term) return true;

        return [
            message.name,
            message.email,
            message.subject,
            message.body,
            message.phone ?? '',
        ].some((value) => value.toLowerCase().includes(term));
    });

    async function openMessage(message: ContactMessage) {
        setSelectedMessage(message);

        if (message.read_at !== null) return;

        try {
            const updatedMessage = await markContactMessageAsRead(message.id);

            setMessages((current) =>
                current.map((item) =>
                    item.id === updatedMessage.id ? updatedMessage : item,
                ),
            );

            setSelectedMessage(updatedMessage);
        } catch {
            setError('تعذر تحديث حالة الرسالة إلى مقروءة.');
        }
    }

    async function refreshSelectedMessage() {
        if (!selectedMessage) return;

        try {
            const result = await getContactMessage(selectedMessage.id);
            setSelectedMessage(result);
        } catch {
            setError('تعذر تحميل تفاصيل الرسالة.');
        }
    }

    function changeFilter(nextFilter: MessageReadFilter) {
        setFilter(nextFilter);
        setPage(1);
        setSearch('');
    }

    function formatDate(value: string) {
        return new Intl.DateTimeFormat('ar', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    }

    return (
        <div dir="rtl" className="min-h-full space-y-7 bg-[#1A1A1A] text-right text-white">

            {/* Page Header */}
            <div className="relative overflow-hidden rounded-2xl border border-[#505050] bg-[#202020] p-6 sm:p-7">
                <div className="absolute right-0 top-0 h-full w-1 bg-[#FFD500]" />
                <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full border border-[#FFD500]/10" />
                <div className="absolute -left-5 -top-9 h-32 w-32 rounded-full border border-[#FFD500]/10" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-7 rounded-full bg-[#FFD500]" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFD500]">
                                Communication Center
                            </span>
                        </div>

                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                            رسائل التواصل
                        </h1>

                        <p className="mt-2 text-sm text-[#BDBDBD]">
                            متابعة رسائل الزوار وإدارة الاستفسارات الواردة.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadMessages(true)}
                        disabled={refreshing || loading}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#FFD500] bg-[#333333] px-5 py-3 text-sm font-bold text-[#FFD500] transition-all duration-200 hover:bg-[#FFD500] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? 'animate-spin' : ''}
                        />
                        تحديث الرسائل
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                    title="إجمالي الرسائل"
                    value={pagination.total}
                    icon={<MessageSquare size={21} />}
                    index="01"
                    description="جميع الرسائل المستلمة"
                />

                <SummaryCard
                    title="غير مقروءة في الصفحة"
                    value={unreadCount}
                    icon={<Mail size={21} />}
                    index="02"
                    description="بانتظار المراجعة"
                    accent
                />

                <SummaryCard
                    title="الصفحة الحالية"
                    value={`${pagination.current_page} / ${pagination.last_page}`}
                    icon={<MailOpen size={21} />}
                    index="03"
                    description="تصفح الرسائل"
                />
            </div>

            {/* Messages Section */}
            <div className="overflow-hidden rounded-2xl border border-[#505050] bg-[#202020] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">

                {/* Section Header */}
                <div className="flex flex-col gap-3 border-b border-[#505050] bg-[#292929] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FFD500]/50 bg-[#333333] text-[#FFD500]">
                                <MailOpen size={17} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">
                                    صندوق الرسائل
                                </h2>
                                <p className="mt-0.5 text-xs text-[#BDBDBD]">
                                    إدارة ومراجعة رسائل الزوار
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#BDBDBD]">
                        <span className="h-2 w-2 rounded-full bg-[#FFD500]" />
                        {pagination.total} رسالة مسجلة
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col gap-4 border-b border-[#505050] bg-[#202020] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <FilterButton
                            active={filter === 'all'}
                            onClick={() => changeFilter('all')}
                        >
                            الكل
                        </FilterButton>

                        <FilterButton
                            active={filter === 'unread'}
                            onClick={() => changeFilter('unread')}
                        >
                            غير مقروءة
                        </FilterButton>

                        <FilterButton
                            active={filter === 'read'}
                            onClick={() => changeFilter('read')}
                        >
                            مقروءة
                        </FilterButton>
                    </div>

                    <div className="relative w-full lg:max-w-sm">
                        <Search
                            size={17}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FFD500]"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="ابحث بالاسم أو البريد أو الموضوع..."
                            className="w-full rounded-xl border border-[#505050] bg-[#333333] py-3 pr-10 pl-4 text-sm text-white outline-none transition-all placeholder:text-[#BDBDBD] focus:border-[#FFD500] focus:ring-2 focus:ring-[#FFD500]/10"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300 sm:mx-6">
                        <span className="flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={() => setError('')}
                            aria-label="إغلاق رسالة الخطأ"
                            className="cursor-pointer transition hover:text-white"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto bg-[#202020] p-3 sm:p-5">
                    <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
                        <thead>
                            <tr className="bg-[#333333] text-white">
                                <th className="rounded-r-lg border-y border-r border-[#505050] px-4 py-4 text-right text-xs font-bold">
                                    المرسل
                                </th>
                                <th className="border-y border-[#505050] px-4 py-4 text-right text-xs font-bold">
                                    الموضوع
                                </th>
                                <th className="border-y border-[#505050] px-4 py-4 text-right text-xs font-bold">
                                    التاريخ
                                </th>
                                <th className="border-y border-[#505050] px-4 py-4 text-right text-xs font-bold">
                                    الحالة
                                </th>
                                <th className="rounded-l-lg border-y border-l border-[#505050] px-4 py-4 text-center text-xs font-bold">
                                    التفاصيل
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-16 text-center text-[#BDBDBD]"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw
                                                size={22}
                                                className="animate-spin text-[#FFD500]"
                                            />
                                            <span>جارٍ تحميل الرسائل...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredMessages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-16">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#505050] bg-[#333333] text-[#FFD500]">
                                                <Mail size={25} />
                                            </div>

                                            <p className="font-bold text-white">
                                                لا توجد رسائل مطابقة
                                            </p>

                                            <p className="text-xs text-[#BDBDBD]">
                                                جرّب تغيير الفلتر أو عبارة البحث.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredMessages.map((message) => (
                                    <tr
                                        key={message.id}
                                        className={`group transition-colors duration-200 hover:bg-[#FFD500]/10 ${
                                            !message.read_at
                                                ? 'bg-[#FFD500]/[0.04]'
                                                : 'bg-[#202020]'
                                        }`}
                                    >
                                        <td className="border-b border-[#505050] px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-extrabold ${
                                                    !message.read_at
                                                        ? 'border-[#FFD500] bg-[#333333] text-[#FFD500]'
                                                        : 'border-[#505050] bg-[#333333] text-white'
                                                }`}>
                                                    {message.name.charAt(0)}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="truncate font-bold text-white">
                                                        {message.name}
                                                    </div>

                                                    <div className="mt-1 truncate text-xs text-[#BDBDBD]">
                                                        {message.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="max-w-xs border-b border-[#505050] px-4 py-4">
                                            <p className="truncate font-semibold text-white">
                                                {message.subject}
                                            </p>

                                            <p className="mt-1 truncate text-xs text-[#BDBDBD]">
                                                {message.body}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap border-b border-[#505050] px-4 py-4 text-xs text-[#BDBDBD]">
                                            {formatDate(message.created_at)}
                                        </td>

                                        <td className="border-b border-[#505050] px-4 py-4">
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                                                    message.read_at
                                                        ? 'border-[#505050] bg-[#333333] text-[#BDBDBD]'
                                                        : 'border-[#FFD500] bg-[#FFD500]/10 text-[#FFD500]'
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    message.read_at
                                                        ? 'bg-[#BDBDBD]'
                                                        : 'bg-[#FFD500]'
                                                }`} />

                                                {message.read_at
                                                    ? 'مقروءة'
                                                    : 'غير مقروءة'}
                                            </span>
                                        </td>

                                        <td className="border-b border-[#505050] px-4 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => void openMessage(message)}
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#505050] bg-[#333333] px-3.5 py-2 text-xs font-bold text-white transition-all duration-200 hover:border-[#FFD500] hover:bg-[#FFD500] hover:text-black"
                                            >
                                                <Eye size={15} />
                                                عرض
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-4 border-t border-[#505050] bg-[#292929] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-[#BDBDBD]">
                        إجمالي النتائج:
                        <span className="mr-1.5 font-bold text-[#FFD500]">
                            {pagination.total}
                        </span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => current - 1)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#505050] bg-[#333333] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#FFD500] hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight size={15} />
                            السابقة
                        </button>

                        <span className="min-w-24 rounded-lg border border-[#FFD500] bg-[#202020] px-3 py-2 text-center text-xs font-bold text-[#FFD500]">
                            {pagination.current_page} من {pagination.last_page}
                        </span>

                        <button
                            type="button"
                            disabled={page >= pagination.last_page || loading}
                            onClick={() => setPage((current) => current + 1)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#505050] bg-[#333333] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#FFD500] hover:text-[#FFD500] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            التالية
                            <ChevronLeft size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Details Modal */}
            {selectedMessage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedMessage(null)}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="message-dialog-title"
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#505050] bg-[#202020] shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative overflow-hidden border-b border-[#505050] bg-[#292929] p-5 sm:p-6">
                            <div className="absolute right-0 top-0 h-full w-1 bg-[#FFD500]" />

                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#FFD500]">
                                        <MailOpen size={15} />
                                        تفاصيل الرسالة #{selectedMessage.id}
                                    </div>

                                    <h2
                                        id="message-dialog-title"
                                        className="text-xl font-extrabold text-white"
                                    >
                                        {selectedMessage.subject}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedMessage(null)}
                                    aria-label="إغلاق التفاصيل"
                                    className="cursor-pointer rounded-xl border border-[#505050] bg-[#333333] p-2 text-white transition hover:border-[#FFD500] hover:text-[#FFD500]"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 bg-[#202020] p-5 sm:p-6">

                            {/* Sender Information */}
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="h-1.5 w-5 rounded-full bg-[#FFD500]" />
                                    <h3 className="text-sm font-bold text-white">
                                        معلومات المرسل
                                    </h3>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <DetailItem
                                        label="اسم المرسل"
                                        value={selectedMessage.name}
                                    />

                                    <DetailItem
                                        label="البريد الإلكتروني"
                                        value={selectedMessage.email}
                                    />

                                    <DetailItem
                                        label="رقم الهاتف"
                                        value={selectedMessage.phone || 'غير متوفر'}
                                        icon={<Phone size={15} />}
                                    />

                                    <DetailItem
                                        label="تاريخ الإرسال"
                                        value={formatDate(selectedMessage.created_at)}
                                    />
                                </div>
                            </div>

                            {/* Message Body */}
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="h-1.5 w-5 rounded-full bg-[#FFD500]" />
                                    <h3 className="text-sm font-bold text-white">
                                        نص الرسالة
                                    </h3>
                                </div>

                                <div className="min-h-32 whitespace-pre-wrap break-words rounded-xl border border-[#505050] bg-[#333333] p-5 text-sm leading-8 text-white">
                                    {selectedMessage.body}
                                </div>
                            </div>

                            {/* Message Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#505050] pt-5">
                                <span className="rounded-lg border border-[#505050] bg-[#333333] px-3 py-2 text-xs text-[#BDBDBD]">
                                    حالة البريد:
                                    <span className="mr-1 font-semibold text-[#FFD500]">
                                        {selectedMessage.mail_status || 'غير محددة'}
                                    </span>
                                </span>

                                <button
                                    type="button"
                                    onClick={() => void refreshSelectedMessage()}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#505050] bg-[#333333] px-3.5 py-2.5 text-xs font-bold text-white transition hover:border-[#FFD500] hover:text-[#FFD500]"
                                >
                                    <RefreshCw size={15} />
                                    تحديث التفاصيل
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedMessage(null)}
                                    className="cursor-pointer rounded-xl bg-[#FFD500] px-7 py-3 text-sm font-extrabold text-black transition-all hover:bg-[#F6C900] hover:shadow-[0_5px_20px_rgba(255,213,0,0.15)]"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    title,
    value,
    icon,
    index,
    description,
    accent = false,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    index: string;
    description: string;
    accent?: boolean;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-[#505050] bg-[#292929] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#FFD500] hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <div className={`absolute right-0 top-0 h-full w-[3px] transition-all duration-300 group-hover:w-1 ${
                accent ? 'bg-[#FFD500]' : 'bg-[#888888] group-hover:bg-[#FFD500]'
            }`} />

            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-white">
                        {title}
                    </p>

                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                        {value}
                    </p>

                    <p className="mt-2 text-[11px] text-[#BDBDBD]">
                        {description}
                    </p>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                    accent
                        ? 'border-[#FFD500] bg-[#FFD500]/10 text-[#FFD500]'
                        : 'border-[#505050] bg-[#333333] text-[#FFD500] group-hover:border-[#FFD500]'
                }`}>
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#505050] pt-3">
                <span className="text-[10px] font-bold tracking-[0.18em] text-[#BDBDBD]">
                    JOBICO / MESSAGES
                </span>

                <span className="font-mono text-[10px] text-[#BDBDBD]">
                    {index}
                </span>
            </div>
        </div>
    );
}

function FilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                active
                    ? 'border border-[#FFD500] bg-[#FFD500] text-black shadow-[0_3px_12px_rgba(255,213,0,0.12)]'
                    : 'border border-[#505050] bg-[#333333] text-[#BDBDBD] hover:border-[#FFD500] hover:text-[#FFD500]'
            }`}
        >
            {children}
        </button>
    );
}

function DetailItem({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-[#505050] bg-[#333333] p-4 transition-colors hover:border-[#FFD500]">
            <p className="mb-2 text-[11px] font-semibold text-[#BDBDBD]">
                {label}
            </p>

            <p className="flex items-center gap-2 break-words text-sm font-bold leading-6 text-white">
                {icon && (
                    <span className="shrink-0 text-[#FFD500]">
                        {icon}
                    </span>
                )}
                {value}
            </p>
        </div>
    );
}
