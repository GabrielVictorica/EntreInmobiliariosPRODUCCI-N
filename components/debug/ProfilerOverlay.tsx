
import React, { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';

// --- 1. PROFILER STORE ---
interface ProfilerEvent {
    id: string;
    source: string;
    action: string; // 'MOUNT' | 'RENDER' | 'CLICK' | 'NAVIGATE'
    timestamp: number;
    duration?: number;
    details?: string;
}

interface ProfilerState {
    events: ProfilerEvent[];
    isEnabled: boolean;
    logEvent: (source: string, action: string, duration?: number, details?: string) => void;
    toggle: () => void;
    clear: () => void;
}

export const useProfilerStore = create<ProfilerState>((set) => ({
    events: [],
    isEnabled: true,
    logEvent: (source, action, duration, details) => set((state) => {
        if (!state.isEnabled) return state;
        const newEvent: ProfilerEvent = {
            id: Math.random().toString(36).substr(2, 9),
            source,
            action,
            timestamp: performance.now(),
            duration,
            details
        };
        // Keep last 50 events
        return { events: [newEvent, ...state.events].slice(0, 50) };
    }),
    toggle: () => set((state) => ({ isEnabled: !state.isEnabled })),
    clear: () => set({ events: [] })
}));

// --- 2. MEASUREMENT HOOK ---
export const useMeasureRender = (componentName: string) => {
    const logEvent = useProfilerStore(state => state.logEvent);
    const renderStart = React.useRef(performance.now());

    React.useLayoutEffect(() => {
        const duration = performance.now() - renderStart.current;
        logEvent(componentName, 'RENDER', duration);
        renderStart.current = performance.now(); // Reset for next re-render
    });

    React.useEffect(() => {
        logEvent(componentName, 'MOUNT', undefined, 'Component Mounted');
        return () => {
            logEvent(componentName, 'UNMOUNT', undefined, 'Component Unmounted');
        };
    }, []);
};

// --- 3. OVERLAY COMPONENT ---
export const ProfilerOverlay: React.FC = () => {
    const { events, isEnabled, toggle, clear } = useProfilerStore();
    const [minDurationFilter, setMinDurationFilter] = useState(0);

    if (!isEnabled) {
        return (
            <button
                onClick={toggle}
                className="fixed bottom-4 left-4 z-[9999] bg-red-600 text-white p-2 rounded-full shadow-lg opacity-50 hover:opacity-100 text-xs font-bold"
            >
                REC
            </button>
        );
    }

    const filteredEvents = events.filter(e => (e.duration || 0) >= minDurationFilter);

    return (
        <div className="fixed bottom-0 left-0 z-[9999] w-full md:w-[600px] h-[300px] bg-black/90 text-[#00ff41] font-mono text-[10px] md:text-xs overflow-hidden flex flex-col border-t-2 border-[#AA895F] shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-[#AA895F]">⚡ PERFORMANCE PROFILER</span>
                    <span className="text-gray-500">|</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={minDurationFilter > 0}
                            onChange={(e) => setMinDurationFilter(e.target.checked ? 10 : 0)}
                        />
                        <span>Slow Only ({'>'}10ms)</span>
                    </label>
                </div>
                <div className="flex gap-2">
                    <button onClick={clear} className="text-gray-400 hover:text-white border px-1 rounded">CLEAR</button>
                    <button onClick={toggle} className="text-red-500 hover:text-red-400 font-bold border border-red-900 px-2 rounded bg-red-900/20">HIDE</button>
                </div>
            </div>

            {/* LOG LIST */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono">
                {filteredEvents.map((e) => {
                    let color = 'text-gray-300';
                    if (e.duration && e.duration > 100) color = 'text-red-400 font-bold';
                    else if (e.duration && e.duration > 50) color = 'text-amber-400';

                    return (
                        <div key={e.id} className={`flex items-start gap-2 border-b border-white/5 pb-0.5 ${color}`}>
                            <span className="w-16 text-gray-600 shrink-0">{(e.timestamp % 10000).toFixed(0)}ms</span>
                            <span className="w-24 font-bold shrink-0 truncate" title={e.source}>{e.source}</span>
                            <span className="w-20 shrink-0">{e.action}</span>
                            {e.duration !== undefined && (
                                <span className="w-20 shrink-0 text-right">{e.duration.toFixed(2)}ms</span>
                            )}
                            <span className="text-gray-500 truncate">{e.details}</span>
                        </div>
                    );
                })}
                {filteredEvents.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">No events captured...</div>
                )}
            </div>
        </div>
    );
};
