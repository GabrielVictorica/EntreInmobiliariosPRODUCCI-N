import React, { useState, useRef } from 'react';
import { Check, Plus, Minus, ChevronDown, ChevronUp, MessageSquare, Trash2, Pencil } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

// Habit type definition
export interface Habit {
    id: string;
    name: string;
    type: 'binary' | 'quantitative';
    target?: number;
    current?: number;
    completed: boolean;
    notes?: string;
    icon?: string;
    color?: string;
    frequency: number[];      // [0, 1, 2, 3, 4, 5, 6] (0=Sun, 1=Mon, ...)
    duration: 'indefinite' | 'until_date';
    endDate?: string;
    motivation?: string;
    execution_time?: string; // Format "HH:MM:SS" from Postgres
    createdAt: string;
}

interface HabitCardProps {
    habit: Habit;
    onToggle: (id: string) => void;
    onIncrement: (id: string, delta: number) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (habit: Habit) => void;
}

export default function HabitCard({ habit, onToggle, onIncrement, onUpdateNotes, onDelete, onEdit }: HabitCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Swipe threshold to trigger completion
    const SWIPE_THRESHOLD = 120;

    // Progress calculation for quantitative habits
    const progress = habit.type === 'quantitative' && habit.target
        ? Math.min((habit.current || 0) / habit.target * 100, 100)
        : 0;

    // Handle touch start
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    // Handle touch move
    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX.current;
        // Only allow right swipe (positive delta)
        if (deltaX > 0) {
            setSwipeX(Math.min(deltaX, SWIPE_THRESHOLD + 30));
        }
    };

    // Handle touch end
    const handleTouchEnd = () => {
        if (swipeX >= SWIPE_THRESHOLD) {
            // Trigger completion
            if (habit.type === 'quantitative' && habit.target) {
                // Fill to target for quantitative - this will auto-complete via handleIncrementHabit
                const remaining = habit.target - (habit.current || 0);
                if (remaining > 0) {
                    onIncrement(habit.id, remaining);
                } else {
                    // Already at or past target, just toggle
                    onToggle(habit.id);
                }
            } else {
                // Binary habits: just toggle
                onToggle(habit.id);
            }
        }
        // Reset swipe
        setSwipeX(0);
        setIsSwiping(false);
        touchStartX.current = null;
    };

    // Handle increment/decrement for quantitative habits
    const handleIncrement = (delta: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newValue = (habit.current || 0) + delta;
        if (newValue >= 0) {
            onIncrement(habit.id, delta);
            // Note: auto-complete is handled in handleIncrementHabit (parent)
        }
    };

    // Handle checkbox toggle for binary habits
    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(habit.id);
    };

    // Handle card click for accordion
    const handleCardClick = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl mb-3">
            {/* Swipe Background */}
            <div
                className={`absolute inset-0 bg-emerald-500 flex items-center pl-6 transition-opacity ${swipeX > 20 ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                <Check size={32} className="text-white" />
                <span className="ml-3 text-white font-bold">¡Completado!</span>
            </div>

            {/* Card Content */}
            <div
                ref={cardRef}
                className={`relative bg-white/80 backdrop-blur-sm border transition-all duration-200 ${habit.completed
                    ? 'border-emerald-200 bg-emerald-50/80'
                    : 'border-white/50 hover:border-[#AA895F]/30'
                    } rounded-2xl cursor-pointer`}
                style={{
                    transform: `translateX(${swipeX}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleCardClick}
            >
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Icon and Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${habit.completed
                                ? 'bg-emerald-100'
                                : 'bg-[#364649]/5'
                                }`}>
                                {habit.icon || (habit.type === 'binary' ? '✓' : '📊')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-[#364649] truncate ${habit.completed ? 'line-through opacity-60' : ''
                                    }`}>
                                    {habit.name}
                                </h4>

                                {/* Execution Time Display */}
                                {habit.execution_time && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#AA895F] mt-0.5">
                                        <span className="opacity-50 text-[8px] uppercase tracking-tighter">Hora:</span>
                                        {habit.execution_time.substring(0, 5)}
                                    </div>
                                )}

                                {/* Progress Bar for Quantitative */}
                                {habit.type === 'quantitative' && (
                                    <div className="mt-2">
                                        <div className="h-2 bg-[#364649]/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${habit.completed
                                                    ? 'bg-emerald-500'
                                                    : 'bg-gradient-to-r from-[#AA895F] to-[#C4A574]'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Action Area */}
                        <div className="flex items-center gap-2 ml-3">
                            {habit.type === 'binary' ? (
                                /* Binary: Checkbox */
                                <button
                                    onClick={handleCheckboxClick}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${habit.completed
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                        : 'bg-[#364649]/5 text-[#364649]/30 hover:bg-[#364649]/10'
                                        }`}
                                >
                                    <Check size={24} className={habit.completed ? 'animate-bounce-once' : ''} />
                                </button>
                            ) : (
                                /* Quantitative: Counter and Buttons */
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleIncrement(-1, e)}
                                        disabled={habit.current === 0}
                                        className="w-9 h-9 rounded-lg bg-[#364649]/5 flex items-center justify-center text-[#364649] hover:bg-[#364649]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Minus size={18} />
                                    </button>

                                    <div className={`min-w-[60px] text-center font-bold ${habit.completed ? 'text-emerald-600' : 'text-[#364649]'
                                        }`}>
                                        <span className="text-lg">{habit.current || 0}</span>
                                        <span className="text-[#364649]/40">/{habit.target}</span>
                                    </div>

                                    <button
                                        onClick={(e) => handleIncrement(1, e)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${habit.completed
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-[#AA895F]/10 text-[#AA895F] hover:bg-[#AA895F]/20'
                                            }`}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expand Indicator */}
                    <div className="flex items-center justify-center mt-2 text-[#364649]/30">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>

                {/* Accordion: Notes Section */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="px-4 pb-4 pt-3 border-t border-[#364649]/10">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare size={14} className="text-[#AA895F]" />
                            <span className="text-xs font-bold text-[#364649]/60 uppercase tracking-wider">
                                Notas del día
                            </span>
                        </div>
                        <textarea
                            value={habit.notes || ''}
                            onChange={(e) => onUpdateNotes(habit.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Agregar notas..."
                            className="w-full h-20 p-3 text-sm bg-white border border-[#364649]/10 rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#AA895F]/30 focus:border-[#AA895F]/30 placeholder:text-[#364649]/30 transition-all"
                        />

                        {/* Delete Button */}
                        <div className="flex gap-3 mt-4">
                            {onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(habit);
                                    }}
                                    className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[#AA895F]/10 border border-[#AA895F]/20 text-[#AA895F] hover:bg-[#AA895F]/20 hover:border-[#AA895F]/30 rounded-xl transition-all text-sm font-bold"
                                >
                                    <Pencil size={16} />
                                    Editar
                                </button>
                            )}

                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(true);
                                    }}
                                    className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 rounded-xl transition-all text-sm font-bold"
                                >
                                    <Trash2 size={16} />
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Confirm Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => onDelete && onDelete(habit.id)}
                title="Eliminar hábito"
                message={`¿Estás seguro de eliminar "${habit.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
}
