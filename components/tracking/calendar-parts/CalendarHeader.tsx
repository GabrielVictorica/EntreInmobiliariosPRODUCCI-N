import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    ZoomIn,
    ZoomOut,
    Check,
    Loader2
} from 'lucide-react';

interface CalendarHeaderProps {
    currentDate: Date;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onToday: () => void;
    viewMode: 'week' | 'day' | 'agenda';
    setViewMode: (mode: 'week' | 'day' | 'agenda') => void;
    isSynced: boolean;
    isCheckingSync: boolean;
    isSyncing: boolean;
    onSync: () => void;
    onNewEvent: () => void;
    hourHeight: number;
    setHourHeight: React.Dispatch<React.SetStateAction<number>>;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    onPrevWeek,
    onNextWeek,
    onToday,
    viewMode,
    setViewMode,
    isSynced,
    isCheckingSync,
    isSyncing,
    onSync,
    onNewEvent,
    hourHeight,
    setHourHeight
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black text-[#364649] tracking-tighter">Calendario</h1>
                <p className="text-[#AA895F]/80 text-sm font-semibold tracking-wide uppercase mt-1">Tu Agenda Premium</p>

                <div className="mt-6 flex items-center gap-4 bg-[#F8F5F1]/80 backdrop-blur-md p-2 rounded-2xl border border-[#AA895F]/20 shadow-xl">
                    <button onClick={onPrevWeek} className="p-2 hover:bg-[#AA895F]/10 rounded-xl transition-colors text-[#364649]"><ChevronLeft size={20} /></button>
                    <h2 className="text-lg font-black text-[#364649] capitalize w-52 text-center tracking-tight">{currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={onNextWeek} className="p-2 hover:bg-[#AA895F]/10 rounded-xl transition-colors text-[#364649]"><ChevronRight size={20} /></button>
                    <button onClick={onToday} className="text-xs font-black text-[#AA895F] px-3 py-1 hover:bg-[#AA895F]/10 rounded-lg transition-all uppercase tracking-widest border border-[#AA895F]/20 ml-2">Hoy</button>

                    <div className="h-6 w-px bg-[#AA895F]/10 mx-2"></div>

                    <div className="flex bg-[#AA895F]/5 p-1 rounded-[0.9rem] items-center gap-1">
                        {(['week', 'day', 'agenda'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === mode ? 'bg-white text-[#AA895F] shadow-lg scale-105' : 'text-[#364649]/40 hover:text-[#364649] hover:bg-white/50'}`}
                            >
                                {mode === 'week' ? 'Semana' : mode === 'day' ? 'Día' : 'Agenda'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="hidden md:flex items-center gap-3 bg-[#F8F5F1]/80 backdrop-blur-md rounded-2xl p-2 border border-[#AA895F]/20 shadow-lg">
                    <ZoomOut size={16} onClick={() => setHourHeight(h => Math.max(40, h - 20))} className="cursor-pointer text-[#AA895F]/60 hover:text-[#AA895F] transition-colors" />
                    <span className="text-[9px] font-black text-[#AA895F]/40 w-10 text-center tracking-widest">ZOOM</span>
                    <ZoomIn size={16} onClick={() => setHourHeight(h => Math.min(200, h + 20))} className="cursor-pointer text-[#AA895F]/60 hover:text-[#AA895F] transition-colors" />
                </div>

                <button
                    onClick={onSync}
                    disabled={isCheckingSync || isSyncing}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black transition-all transform active:scale-95 ${isSynced ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xl shadow-emerald-600/5' : 'bg-[#AA895F] text-white shadow-2xl shadow-[#AA895F]/30 hover:brightness-110'}`}
                >
                    {isCheckingSync || isSyncing ? <Loader2 className="animate-spin" size={18} /> : (isSynced ? <Check size={18} strokeWidth={3} /> : <CalendarIcon size={18} />)}
                    <span className="text-xs uppercase tracking-widest">
                        {isCheckingSync || isSyncing ? 'Sincronizando...' : (isSynced ? 'Sincronizado' : 'Sincronizar Google')}
                    </span>
                </button>
                <button onClick={onNewEvent} className="bg-[#364649] text-white px-5 py-2.5 rounded-2xl font-black shadow-2xl shadow-[#364649]/30 flex items-center gap-2 transform active:scale-95 hover:brightness-110 transition-all border border-white/10">
                    <Plus size={18} strokeWidth={3} />
                    <span className="hidden md:inline text-xs uppercase tracking-widest">Nuevo Evento</span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(CalendarHeader);
