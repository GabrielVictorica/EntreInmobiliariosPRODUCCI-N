import React from 'react';
import { Clock, MapPin, Check } from 'lucide-react';

interface AgendaViewProps {
    googleEvents: any[];
    isEventCompleted: (id: string) => boolean;
    toggleEventCompletion: (id: string, title: string, date: string) => void;
    getGoogleColor: (colorId: string) => string;
}

const AgendaView: React.FC<AgendaViewProps> = ({
    googleEvents,
    isEventCompleted,
    toggleEventCompletion,
    getGoogleColor
}) => {
    const agendaData = React.useMemo(() => {
        return Object.entries(googleEvents
            .filter(e => new Date(e.start.dateTime || e.start.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
            .sort((a, b) => new Date(a.start.dateTime || a.start.date).getTime() - new Date(b.start.dateTime || b.start.date).getTime())
            .slice(0, 40)
            .reduce((acc: any, e: any) => {
                const d = new Date(e.start.dateTime || e.start.date);
                const dateStr = d.toISOString().split('T')[0];
                if (!acc[dateStr]) acc[dateStr] = [];
                acc[dateStr].push(e);
                return acc;
            }, {}));
    }, [googleEvents]);

    if (agendaData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-[#AA895F]/40 bg-[#FDFCFB] rounded-[2rem] border-2 border-dashed border-[#AA895F]/10">
                <Clock size={48} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Agenda Despejada</p>
                <p className="text-sm mt-2 font-medium">No hay eventos próximos en tu horizonte</p>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-4xl mx-auto h-[650px] overflow-y-auto custom-scrollbar bg-[#FDFCFB] rounded-[2rem] border border-[#AA895F]/10 shadow-2xl relative">
            <div className="space-y-8">
                {agendaData.map(([dateStr, dayEvents]: [string, any]) => {
                    const dateObj = new Date(dateStr + 'T12:00:00'); // Midday to avoid TZ shifts
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                    return (
                        <div key={dateStr} className="space-y-4">
                            <div className="flex items-center gap-4 px-2">
                                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'bg-[#AA895F] text-white shadow-lg shadow-[#AA895F]/20' : 'bg-[#AA895F]/5 text-[#AA895F]/60'}`}>
                                    {dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#AA895F]/10 via-[#AA895F]/5 to-transparent"></div>
                            </div>
                            <div className="grid gap-2">
                                {dayEvents.map((e: any) => {
                                    const eventTime = new Date(e.start.dateTime || e.start.date);
                                    const isCompleted = isEventCompleted(e.id);
                                    return (
                                        <div key={e.id} className={`group flex items-center gap-5 p-4 rounded-2xl border transition-all duration-300 ${isCompleted ? 'bg-[#AA895F]/5 border-transparent opacity-50 grayscale' : 'bg-[#F8F5F1]/50 border-[#AA895F]/10 hover:border-[#AA895F]/30 hover:shadow-xl hover:bg-white'}`}>
                                            <div className="w-1.5 h-10 rounded-full shadow-inner" style={{ backgroundColor: getGoogleColor(e.colorId) }}></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-base font-black tracking-tight truncate ${isCompleted ? 'text-[#364649]/40 line-through' : 'text-[#364649]'}`}>{e.summary}</h4>
                                                <div className="flex items-center gap-4 text-[11px] font-semibold text-[#AA895F]/60 mt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={13} className="opacity-70" />
                                                        <span className="uppercase tracking-wider">{e.start.dateTime ? eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Todo el día'}</span>
                                                    </div>
                                                    {e.location && (
                                                        <div className="flex items-center gap-1.5 truncate group-hover:text-[#AA895F]">
                                                            <MapPin size={13} className="opacity-70" />
                                                            <span className="truncate">{e.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleEventCompletion(e.id, e.summary || '', dateStr)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white text-[#AA895F]/30 hover:bg-[#AA895F] hover:text-white border border-[#AA895F]/10 hover:shadow-lg active:scale-95'}`}
                                            >
                                                <Check size={18} strokeWidth={3} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(AgendaView);
