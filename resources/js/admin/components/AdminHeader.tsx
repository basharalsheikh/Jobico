import { Menu, LogOut } from 'lucide-react';

interface AdminHeaderProps {
    adminName: string;
    onMenuClick: () => void;
    onLogout: () => void;
}

export default function AdminHeader({
    adminName,
    onMenuClick,
    onLogout,
}: AdminHeaderProps) {
    return (
        <header className="flex h-20 items-center justify-between border-b border-[#505050] bg-[#202020] px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="فتح القائمة"
                    className="cursor-pointer rounded-lg p-2 text-white transition hover:bg-[#FFD500]/20 hover:text-[#FFD500] lg:hidden"
                >
                    <Menu size={22} />
                </button>

                <div>
                    <h1 className="text-lg font-bold text-white sm:text-xl">
                        لوحة الإدارة
                    </h1>
                    <p className="mt-1 hidden text-sm text-[#BDBDBD] sm:block">
                        إدارة محتوى ومشاريع الجوبي
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-white">
                        {adminName}
                    </p>
                    <p className="mt-1 text-xs text-[#BDBDBD]">
                        مدير النظام
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#505050] px-3 py-2 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">تسجيل الخروج</span>
                </button>
            </div>
        </header>
    );
}
