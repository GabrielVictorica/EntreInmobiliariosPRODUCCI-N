import React from 'react';
import { Search, Plus } from 'lucide-react';
import { DebouncedInput } from '../DebouncedInput';

interface DashboardHeaderProps {
    title: string;
    subtitle: string;
    count?: {
        value: number;
        label: string;
    };
    searchProps?: {
        placeholder: string;
        value: string;
        onChange: (val: string) => void;
    };
    actionProps?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
}

/**
 * Standardized Header for Dashboards
 * Provides a consistent Title, Search, and Primary Action layout.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title,
    subtitle,
    count,
    searchProps,
    actionProps
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-[#364649] tracking-tight">{title}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-[#364649]/60 text-sm font-medium">{subtitle}</p>
                    {count && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-[#364649]/30"></span>
                            <p className="text-[#364649]/40 text-sm font-medium">
                                {count.value} {count.label}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                {searchProps && (
                    <div className="relative group flex-1 md:min-w-[300px]">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40 group-focus-within:text-[#AA895F] transition-colors"
                            size={18}
                        />
                        <DebouncedInput
                            type="text"
                            placeholder={searchProps.placeholder}
                            value={searchProps.value}
                            onChange={(val) => searchProps.onChange(val as string)}
                            className="w-full bg-white/50 border border-[#364649]/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AA895F]/20 transition-all font-medium"
                        />
                    </div>
                )}

                {actionProps && (
                    <button
                        onClick={actionProps.onClick}
                        className="btn-hover-effect bg-[#AA895F] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#AA895F]/30 flex items-center active:scale-95 whitespace-nowrap"
                    >
                        {actionProps.icon || <Plus className="mr-2" size={18} />}
                        {actionProps.label}
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(DashboardHeader);
