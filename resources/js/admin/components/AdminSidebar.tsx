
import {
    LayoutDashboard,
    FolderKanban,
    Images,
    FileText,
    MessageSquare,
    Settings,
    X,
    PanelsTopLeft,
} from 'lucide-react';

type AdminPage =
    | 'dashboard'
    | 'projects'
    | 'media'
    | 'hero'
    | 'pages'
    | 'messages'
    | 'settings';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activePage: AdminPage;
    onNavigate: (page: AdminPage) => void;
}

const navigationItems = [
    {
        id: 'dashboard',
        label: 'لوحة المعلومات',
        icon: LayoutDashboard,
    },
    {
        id: 'projects',
        label: 'المشاريع',
        icon: FolderKanban,
    },
    {
        id: 'media',
        label: 'الصور والوسائط',
        icon: Images,
    },
    {
        id: 'pages',
        label: 'الصفحات',
        icon: FileText,
    },
    {
        id: 'messages',
        label: 'رسائل التواصل',
        icon: MessageSquare,
    },
    {
        id: 'settings',
        label: 'الإعدادات',
        icon: Settings,
    },
    {
        id: 'hero',
        label: 'الواجهة الرئيسية',
        icon: PanelsTopLeft,
    },
] as const;

export default function AdminSidebar({
    isOpen,
    onClose,
    activePage,
    onNavigate,
}: AdminSidebarProps) {
    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="إغلاق القائمة"
                    onClick={onClose}
                    className="fixed inset-0 z-40 cursor-pointer bg-black/60 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-[#505050] bg-[#202020] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex h-20 items-center justify-between border-b border-[#505050] px-6">
                    <div>
                        <h2 className="text-xl font-black tracking-wide text-white">
                            JOBI<span className="text-[#ffd500]">CO</span>
                        </h2>

                        <p className="mt-1 text-xs text-[#BDBDBD]">
                            لوحة الإدارة
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="إغلاق القائمة"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-2 text-[#BDBDBD] transition hover:bg-[#333333] hover:text-[#ffd500] lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    onNavigate(item.id);
                                    onClose();
                                }}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm font-semibold transition duration-200 ${
                                    isActive
                                        ? 'border-[#ffd500]/50 bg-[#ffd500] text-[#202020] shadow-lg shadow-black/20'
                                        : 'border-transparent text-[#BDBDBD] hover:border-[#505050] hover:bg-[#292929] hover:text-[#ffd500]'
                                }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t border-[#505050] p-5">
                    <p className="text-xs leading-6 text-[#BDBDBD]">
                        إدارة محتوى ومشاريع الجوبي
                    </p>
                    <div className="mt-3 h-1 w-12 rounded-full bg-[#ffd500]" />
                </div>
            </aside>
        </>
    );
}
