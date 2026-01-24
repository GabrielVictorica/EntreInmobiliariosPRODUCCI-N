import React, { memo } from 'react';
import { Plus } from 'lucide-react';

// Static style object - transitions handled by CSS for instant hover
const eventCardStyle = {
    backfaceVisibility: 'hidden' as 'hidden',
    transformOrigin: 'center center'
};

interface CalendarEventCardProps {
    event: any;
    top: number;
    displayHeight: number;
    baseColor: string;
    isCompleted: boolean;
    isNarrow: boolean;
    isVeryNarrow: boolean;
    viewMode: 'week' | 'day';
    onToggleCompletion: (id: string, summary: string, date: string) => void;
    onEdit: (e: React.MouseEvent, event: any) => void;
    onDragStart: (e: React.DragEvent, event: any) => void;
    onResizeStart: (e: React.MouseEvent, event: any) => void;
    onDeleteClick: (event: any) => void;
}

const CalendarEventCard = memo(({
    event,
    top,
    displayHeight,
    baseColor,
    isCompleted,
    isNarrow,
    isVeryNarrow,
    viewMode,
    onToggleCompletion,
    onEdit,
    onDragStart,
    onResizeStart,
    onDeleteClick
}: CalendarEventCardProps) => {

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (event.isSystem) return;
        const eventDateStr = new Date(event.start.dateTime || event.start.date).toISOString().split('T')[0];
        onToggleCompletion(event.id, event.summary || '', eventDateStr);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteClick(event);
    };

    // Calculate font size once
    const fontSize = isVeryNarrow ? '9px' : isNarrow ? '10px' : (viewMode === 'day' ? '14px' : '12px');

    return (
        <div
            draggable={!event.isSystem}
            onDragStart={(ev) => onDragStart(ev, event)}
            onDoubleClick={(ev) => !event.isSystem && onEdit(ev, event)}
            onClick={handleToggle}
            className={`
                group absolute overflow-hidden calendar-card
                border border-white/20 shadow-md cursor-pointer pointer-events-auto text-white
                ${isCompleted ? 'opacity-40 grayscale' : ''}
                ${isVeryNarrow ? 'p-1 rounded-md' : isNarrow ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'}
                hover:z-[100]
            `}
            style={{
                top: `${top}px`,
                height: `${Math.max(displayHeight, 30)}px`,
                minHeight: `${Math.max(displayHeight, 30)}px`,
                backgroundColor: isCompleted ? '#94a3b8' : baseColor,
                ...event._style,
                fontSize,
                lineHeight: '1.2',
                borderLeftWidth: '4px',
                borderLeftColor: 'rgba(255,255,255,0.4)',
                zIndex: (10 + (event._col || 0)),
                '--card-glow': `${baseColor}80`,
                ...eventCardStyle
            } as any}
        >
            <div className="flex flex-col w-full gap-1 h-full relative">
                <div className="flex justify-between items-start w-full gap-1">
                    <p className={`font-bold tracking-tight break-words flex-1 ${isCompleted ? 'line-through opacity-60' : ''}`} style={{
                        display: '-webkit-box',
                        WebkitLineClamp: Math.max(1, Math.floor(displayHeight / 14)),
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                    }}>
                        {event.summary}
                    </p>
                    {!isVeryNarrow && (
                        <div className="flex-shrink-0 opacity-90 text-sm">
                            {isCompleted ? '✅' : '⬜'}
                        </div>
                    )}
                </div>

                {event.isAuto && !isNarrow && (
                    <div className="flex items-center gap-1 opacity-80">
                        <span className="bg-white/20 px-1 py-0.5 rounded text-[8px] font-bold uppercase">
                            Auto
                        </span>
                    </div>
                )}
            </div>

            {!event.isSystem && (
                <>
                    {!isVeryNarrow && (
                        <div onMouseDown={(ev) => onResizeStart(ev, event)} className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-white/30 flex justify-center items-end pb-0.5">
                            <div className="w-8 h-1 bg-white/40 rounded-full"></div>
                        </div>
                    )}
                    <button
                        onClick={handleDelete}
                        className={`absolute ${isNarrow ? 'top-0.5 right-0.5' : 'top-2 right-2'} p-1 bg-red-500/90 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 shadow-lg z-[70]`}
                    >
                        <Plus className="rotate-45" size={isNarrow ? 10 : 12} />
                    </button>
                </>
            )}
        </div>
    );
}, (prev, next) => {
    // Custom comparison for performance
    return (
        prev.event.id === next.event.id &&
        prev.event.summary === next.event.summary &&
        prev.top === next.top &&
        prev.displayHeight === next.displayHeight &&
        prev.baseColor === next.baseColor &&
        prev.isCompleted === next.isCompleted &&
        prev.event._style?.width === next.event._style?.width &&
        prev.event._style?.left === next.event._style?.left && // Check positioning changes
        prev.event._col === next.event._col
    );
});

CalendarEventCard.displayName = 'CalendarEventCard';

export default CalendarEventCard;
