import React, { useState } from 'react';
import { LayoutDashboard, PieChart } from 'lucide-react';
import DashboardHome from '../home/DashboardHome';
import BusinessControl from './BusinessControl';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';

interface MetricsWrapperProps {
    onNavigate: (view: any, params?: any) => void;
    availableYears?: number[];
    targetUserId?: string;
    selectedTab?: 'home' | 'control';
}

const MetricsWrapper = React.memo(function MetricsWrapper({
    onNavigate,
    availableYears = [2024, 2025, 2026, 2027, 2028],
    targetUserId,
    selectedTab
}: MetricsWrapperProps) {
    const {
        currentYear, isHistoricalView, googleEvents
    } = useBusinessStore(useShallow(state => ({
        currentYear: state.selectedYear,
        isHistoricalView: state.isHistoricalView,
        googleEvents: state.googleEvents
    })));

    const [internalTab, setInternalTab] = useState<'home' | 'control'>('home');
    const activeTab = selectedTab || internalTab;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-[#AA895F] p-2.5 rounded-2xl text-white shadow-lg shadow-[#AA895F]/20">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#364649] tracking-tight">Métricas de Negocio</h2>
                        <p className="text-xs font-bold text-[#AA895F] uppercase tracking-[0.2em]">{isHistoricalView ? 'VISTA HISTÓRICA' : `AÑO ${currentYear}`}</p>
                    </div>
                </div>

                {!selectedTab && (
                    <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl border border-[#364649]/10 shadow-sm">
                        <button
                            onClick={() => setInternalTab('home')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-[#364649] text-white shadow-md' : 'text-[#364649]/60 hover:bg-gray-50'}`}
                        >
                            Enfoque Semanal
                        </button>
                        <button
                            onClick={() => setInternalTab('control')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'control' ? 'bg-[#AA895F] text-white shadow-md' : 'text-[#364649]/60 hover:bg-gray-100'}`}
                        >
                            <div className="flex items-center gap-2">
                                <PieChart size={16} /> Control Negocio
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'home' && (
                <DashboardHome
                    googleEvents={googleEvents || []}
                    targetUserId={targetUserId}
                />
            )}

            {activeTab === 'control' && (
                <BusinessControl
                    onNavigateToCalendar={() => onNavigate('calendar')}
                    availableYears={availableYears}
                />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.selectedTab === nextProps.selectedTab &&
        prevProps.targetUserId === nextProps.targetUserId;
});

export default MetricsWrapper;
