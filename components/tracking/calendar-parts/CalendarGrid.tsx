import React from 'react';
import { Plus } from 'lucide-react';
import CalendarEventCard from './CalendarEventCard';

interface CalendarGridProps {
    viewMode: 'week' | 'day';
    weekDays: Date[];
    currentDate: Date;
    hours: number[];
    hourHeight: number;
    eventsByDay: Map<string, { dayGoogleEvents: any[], dayGoogleEventsAllDay: any[] }>;
    toggleEventCompletion: (id: string, title: string, date: string) => void;
    isEventCompleted: (id: string) => boolean;
    handleGridClick: (date: Date, hour: number) => void;
    handleDrop: (e: React.DragEvent, date: Date, hour: number) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragStart: (e: React.DragEvent, event: any) => void;
    handleEditClick: (e: React.MouseEvent, event: any) => void;
    handleResizeStart: (e: React.MouseEvent, event: any) => void;
    getGoogleColor: (colorId: string) => string;
    isDragging: boolean;
    resizePreview: any;
    setDeleteConfirmEvent: (event: any) => void;
    getArgentinaNow: () => Date;
    isSameDay: (d1: Date, d2: any) => boolean;
    gridRef: React.RefObject<HTMLDivElement>;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
    viewMode,
    weekDays,
    currentDate,
    hours,
    hourHeight,
    eventsByDay,
    toggleEventCompletion,
    isEventCompleted,
    handleGridClick,
    handleDrop,
    handleDragOver,
    handleDragStart,
    handleEditClick,
    handleResizeStart,
    getGoogleColor,
    isDragging,
    resizePreview,
    setDeleteConfirmEvent,
    getArgentinaNow,
    isSameDay,
    gridRef
}) => {
    const daysToShow = viewMode === 'week' ? weekDays : [currentDate];

    return (
        <div className="bg-[#FDFCFB] rounded-[2rem] shadow-2xl overflow-hidden border border-[#AA895F]/20 backdrop-blur-sm">
            {/* Header Días y Todo el Día */}
            <div className={`grid ${viewMode === 'day' ? 'grid-cols-2' : 'grid-cols-8'} border-b border-[#AA895F]/10 bg-[#F8F5F1]/80 backdrop-blur-md sticky top-0 z-40`}>
                <div className="p-4 bg-[#F8F5F1]/50 border-r border-[#AA895F]/10 flex items-center justify-center text-[10px] font-bold text-[#AA895F]/60 uppercase tracking-widest">Todo el día</div>
                {daysToShow.map((date, i) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const { dayGoogleEventsAllDay } = eventsByDay.get(dateKey) || { dayGoogleEventsAllDay: [] };
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                        <div key={i} className={`p-2 border-r border-[#AA895F]/10 min-h-[90px] transition-colors duration-500 ${isToday ? 'bg-[#AA895F]/10 relative' : ''}`}>
                            {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#AA895F] shadow-[0_0_10px_rgba(170,137,95,0.5)]"></div>}
                            <div className="text-center mb-2">
                                <p className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-[#AA895F]' : 'text-[#364649]/40'}`}>
                                    {date.toLocaleDateString('es-AR', { weekday: viewMode === 'day' ? 'long' : 'short' })}
                                </p>
                                <p className={`text-2xl font-black leading-tight ${isToday ? 'text-[#AA895F] scale-110' : 'text-[#364649]'}`}>{date.getDate()}</p>
                            </div>
                            <div className="space-y-1">
                                {dayGoogleEventsAllDay.map((e: any) => (
                                    <div key={e.id}
                                        onClick={() => toggleEventCompletion(e.id, e.summary || '', date.toISOString().split('T')[0])}
                                        className="text-[9px] p-1.5 rounded-lg bg-[#AA895F] text-white font-bold truncate cursor-pointer shadow-sm hover:brightness-110 transition-all"
                                    >
                                        {isEventCompleted(e.id) ? '✅ ' : ''}{e.summary}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid Horario */}
            <div ref={gridRef} className={`grid ${viewMode === 'day' ? 'grid-cols-2' : 'grid-cols-8'} h-[650px] overflow-y-auto custom-scrollbar relative bg-[#FDFCFB]`}>
                <div className="bg-[#F8F5F1]/80 backdrop-blur-sm border-r border-[#AA895F]/10 sticky left-0 z-20">
                    {hours.map(h => (
                        <div key={h} style={{ height: `${hourHeight}px` }} className="border-b border-[#AA895F]/5 text-[10px] text-[#AA895F]/60 font-black p-2 pr-3 text-right">
                            {h === 24 ? '00' : h}:00
                        </div>
                    ))}
                </div>

                {daysToShow.map((date, i) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const { dayGoogleEvents } = eventsByDay.get(dateKey) || { dayGoogleEvents: [] };
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                        <div key={i} onDragOver={handleDragOver} className={`border-r border-[#AA895F]/10 relative transition-colors duration-700 ${isToday ? 'bg-[#AA895F]/5' : ''}`}>
                            {hours.map(h => (
                                <div key={h}
                                    onClick={() => handleGridClick(date, h)}
                                    onDrop={(e) => handleDrop(e, date, h)}
                                    style={{ height: `${hourHeight}px` }}
                                    className={`border-b border-[#AA895F]/5 cursor-pointer hover:bg-[#AA895F]/10 transition-colors ${isDragging ? 'bg-[#AA895F]/10 animate-pulse' : ''}`}
                                ></div>
                            ))}

                            {/* Indicador de Hora Actual */}
                            {(() => {
                                const argNow = getArgentinaNow();
                                if (isSameDay(date, argNow)) {
                                    const currentHour = argNow.getHours();
                                    const currentMinutes = argNow.getMinutes();
                                    if (currentHour >= 6 && currentHour < 24) {
                                        const topPos = (currentHour - 6) * hourHeight + (currentMinutes / 60) * hourHeight;
                                        return (
                                            <div className="absolute left-0 w-full z-30 pointer-events-none flex items-center" style={{ top: `${topPos}px` }}>
                                                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center -ml-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-pulse"></div>
                                                </div>
                                                <div className="flex-1 h-px bg-gradient-to-r from-red-600 via-red-600/30 to-transparent"></div>
                                                <div className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-l-full shadow-lg ml-auto backdrop-blur-md transform translate-x-1">
                                                    {argNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })()}

                            <div className="absolute top-0 left-0 w-full h-full p-1 pointer-events-none">
                                {dayGoogleEvents.map((e: any) => {
                                    const eventTime = new Date(e.start.dateTime || e.start.date);
                                    const hour = eventTime.getHours();
                                    if (hour < 6 || hour >= 24) return null;
                                    const top = (hour - 6) * hourHeight + (eventTime.getMinutes() / 60) * hourHeight;

                                    let height = hourHeight;
                                    if (e.end?.dateTime) {
                                        const endTime = new Date(e.end.dateTime);
                                        height = ((endTime.getTime() - eventTime.getTime()) / 60000 / 60) * hourHeight;
                                    }

                                    // Apply Resize overrides if active
                                    let displayHeight = height;
                                    if (resizePreview && resizePreview.eventId === e.id) {
                                        displayHeight = resizePreview.height;
                                    }

                                    const isCompleted = isEventCompleted(e.id);
                                    const eventDateStr = date.toISOString().split('T')[0];

                                    const isNarrow = e._style && parseFloat(e._style.width) < 25;
                                    const isVeryNarrow = e._style && parseFloat(e._style.width) < 15;

                                    // DEBUG: Check specific event colors
                                    // if (e.summary?.includes('DOLARES')) console.log('DEBUG COLOR:', e.summary, e.colorId, getGoogleColor(e.colorId));

                                    const baseColor = getGoogleColor(e.colorId);

                                    return (
                                        <CalendarEventCard
                                            key={e.id}
                                            event={e}
                                            top={top}
                                            displayHeight={displayHeight}
                                            baseColor={baseColor}
                                            isCompleted={isCompleted}
                                            isNarrow={isNarrow}
                                            isVeryNarrow={isVeryNarrow}
                                            viewMode={viewMode}
                                            onToggleCompletion={toggleEventCompletion}
                                            onEdit={handleEditClick}
                                            onDragStart={handleDragStart}
                                            onResizeStart={handleResizeStart}
                                            onDeleteClick={(evt) => setDeleteConfirmEvent(evt)}
                                        />
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

export default React.memo(CalendarGrid);
