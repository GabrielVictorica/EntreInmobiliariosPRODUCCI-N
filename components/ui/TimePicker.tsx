import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';

interface TimePickerProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    dropDirection?: 'up' | 'down';
}

export default function TimePicker({ value, onChange, className = '', dropDirection = 'down' }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse current value
    const [selectedHour, setSelectedHour] = useState<string | null>(
        value ? value.split(':')[0] : null
    );
    const [selectedMinute, setSelectedMinute] = useState<string | null>(
        value ? value.split(':')[1] : null
    );

    // Update internal state if value prop changes externally
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setSelectedHour(h);
            setSelectedMinute(m);
        } else {
            setSelectedHour(null);
            setSelectedMinute(null);
        }
    }, [value]);

    // Hours: 00-23
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

    // Minutes: 15min intervals
    const minutes = ['00', '15', '30', '45'];

    const handleHourClick = (h: string) => {
        setSelectedHour(h);
        // If minutes already selected, update value immediately
        if (selectedMinute) {
            onChange(`${h}:${selectedMinute}`);
        } else {
            // Default to 00 if no minute selected yet
            setSelectedMinute('00');
            onChange(`${h}:00`);
        }
    };

    const handleMinuteClick = (m: string) => {
        setSelectedMinute(m);
        if (selectedHour) {
            onChange(`${selectedHour}:${m}`);
            setIsOpen(false); // Close on minute selection for speed
        }
    };

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const dropdownClasses = dropDirection === 'up'
        ? 'bottom-full mb-2 origin-bottom'
        : 'top-full mt-2 origin-top';

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all group ${value
                    ? 'border-[#AA895F] bg-[#AA895F]/10 text-[#364649]'
                    : 'border-gray-200 bg-gray-50 text-slate-400 hover:bg-white hover:border-gray-300'
                    } focus:outline-none`}
            >
                <div className="flex items-center gap-2 font-bold">
                    <Clock size={16} className={value ? 'text-[#AA895F]' : 'text-slate-400'} />
                    <span>{value || 'Seleccionar hora'}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ${dropdownClasses}`}>
                    <div className="flex h-64">
                        {/* Hours Column */}
                        <div className="flex-1 overflow-y-auto no-scrollbar border-r border-gray-100">
                            <div className="sticky top-0 bg-gray-50 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-gray-100">
                                Hora
                            </div>
                            <div className="p-1 space-y-1">
                                {hours.map(h => (
                                    <button
                                        key={h}
                                        type="button"
                                        onClick={() => handleHourClick(h)}
                                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${selectedHour === h
                                            ? 'bg-[#364649] text-white'
                                            : 'text-slate-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Minutes Column */}
                        <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50/30">
                            <div className="sticky top-0 bg-gray-50 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-gray-100">
                                Min
                            </div>
                            <div className="p-1 space-y-1">
                                {minutes.map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleMinuteClick(m)}
                                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 ${selectedMinute === m
                                            ? 'bg-[#AA895F] text-white shadow-md shadow-[#AA895F]/20'
                                            : 'text-slate-500 hover:bg-white hover:shadow-sm'
                                            }`}
                                    >
                                        {m}
                                        {selectedMinute === m && selectedHour && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop for mobile interaction, essentially transparent full screen div behind popover, handled by click outside logic mostly but let's keep it clean */}
        </div>
    );
}
