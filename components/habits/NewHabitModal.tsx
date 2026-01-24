import React, { useState, useEffect } from 'react';
import {
    X,
    Clock,
    CalendarDays,
    BrainCircuit,
    Repeat,
    Zap,
    Save,
    Check,
    Loader2
} from 'lucide-react';
import { Habit, HabitCategory, ScheduleType, PreferredBlock, CognitiveLoad } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { useHabitStore } from '../../store/useHabitStore';
import { createRecurringHabitEvent, updateHabitCalendarEvent } from '../../services/habitCalendarService';
import TimePicker from '../ui/TimePicker';

interface NewHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHabitCreated: () => void;
    habitToEdit?: Habit | null;
    googleAccessToken?: string | null;
}

export default function NewHabitModal({
    isOpen,
    onClose,
    onHabitCreated,
    habitToEdit,
    googleAccessToken
}: NewHabitModalProps) {
    const { categories, targetUserId } = useHabitStore();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [icon, setIcon] = useState('📌');

    // Frequency & Schedule
    const [frequency, setFrequency] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    const [scheduleType, setScheduleType] = useState<ScheduleType>('flexible');
    const [preferredBlock, setPreferredBlock] = useState<PreferredBlock>('anytime');
    const [fixedTime, setFixedTime] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState(15);
    const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoad>('medium');

    // Load data for editing
    useEffect(() => {
        if (isOpen && habitToEdit) {
            setName(habitToEdit.name);
            setCategoryId(habitToEdit.categoryId);
            setIcon(habitToEdit.icon);
            setFrequency(habitToEdit.frequency);
            setScheduleType(habitToEdit.scheduleType);
            setPreferredBlock(habitToEdit.preferredBlock);
            setFixedTime(habitToEdit.fixedTime || '');
            setEstimatedDuration(habitToEdit.estimatedDuration);
            setCognitiveLoad(habitToEdit.cognitiveLoad);
        } else if (isOpen && !habitToEdit) {
            // Reset for new habit
            setName('');
            setCategoryId('');
            setIcon('📌');
            setFrequency(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
            setScheduleType('flexible');
            setPreferredBlock('anytime');
            setFixedTime('');
            setEstimatedDuration(15);
            setCognitiveLoad('medium');
        }
    }, [isOpen, habitToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserId || !name.trim() || !categoryId) return;

        setLoading(true);

        const habitData: Partial<Habit> = {
            name,
            categoryId: Number(categoryId),
            icon,
            frequency: frequency as any,
            scheduleType,
            preferredBlock,
            fixedTime: scheduleType === 'fixed' ? fixedTime : undefined,
            estimatedDuration,
            cognitiveLoad,
            active: true
        };

        const { addHabit, updateHabit } = useHabitStore.getState();
        let savedHabit: Habit | null = null;

        try {
            if (habitToEdit) {
                savedHabit = await updateHabit(habitToEdit.id, habitData, googleAccessToken);
            } else {
                savedHabit = await addHabit(habitData, googleAccessToken);
            }
        } catch (error) {
            console.error('Error saving habit:', error);
            alert('Error al guardar el hábito');
            setLoading(false);
            return;
        }

        if (savedHabit) {
            setLoading(false);
            onHabitCreated();
            onClose();
        }
    };

    const handleDayToggle = (day: string) => {
        if (frequency.includes(day)) {
            if (frequency.length > 1) { // Prevent empty frequency
                setFrequency(frequency.filter(d => d !== day));
            }
        } else {
            setFrequency([...frequency, day]);
        }
    };

    const daysMap = [
        { key: 'mon', label: 'L' },
        { key: 'tue', label: 'M' },
        { key: 'wed', label: 'M' },
        { key: 'thu', label: 'J' },
        { key: 'fri', label: 'V' },
        { key: 'sat', label: 'S' },
        { key: 'sun', label: 'D' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-black text-[#364649]">
                            {habitToEdit ? 'Editar Hábito' : 'Nuevo Hábito'}
                        </h2>
                        <p className="text-slate-400 text-sm">Diseña tu rutina, construye tu identidad</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-400 hover:text-[#364649]"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1 overflow-y-auto">

                    {/* 1. Identidad: Nombre y Icono */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Identidad del Hábito</label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-16 h-14 text-center text-2xl border-2 border-gray-200 rounded-xl focus:border-[#AA895F] focus:outline-none bg-gray-50"
                                placeholder="📌"
                            />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 border-2 border-gray-200 rounded-xl px-4 text-lg font-bold text-[#364649] placeholder:text-slate-300 focus:border-[#AA895F] focus:outline-none bg-gray-50"
                                placeholder="Ej: Leer 10 páginas, Meditar, Gym..."
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* 2. Categoría (Esferas) */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Esfera de Vida</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden group ${categoryId === cat.id
                                        ? 'border-[#364649] bg-[#364649] text-white shadow-lg transform scale-[1.02]'
                                        : 'border-gray-100 hover:border-gray-300 text-slate-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{cat.emoji}</div>
                                    <div className="font-bold text-sm">{cat.name}</div>
                                    {categoryId === cat.id && (
                                        <div className="absolute top-2 right-2">
                                            <Check size={14} className="text-[#AA895F]" strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Frecuencia y Horario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Frecuencia */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Repeat size={18} />
                                <label className="text-sm font-bold uppercase tracking-wider">Frecuencia</label>
                            </div>
                            <div className="flex justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                                {daysMap.map(day => (
                                    <button
                                        key={day.key}
                                        type="button"
                                        onClick={() => handleDayToggle(day.key)}
                                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${frequency.includes(day.key)
                                            ? 'bg-[#364649] text-white shadow-md'
                                            : 'text-slate-400 hover:bg-gray-200'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duración */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock size={18} />
                                <label className="text-sm font-bold uppercase tracking-wider">Duración (min)</label>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="120"
                                    value={estimatedDuration}
                                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                                    className="w-full accent-[#AA895F]"
                                />
                                <span className="font-bold text-[#364649] w-12 text-right">{estimatedDuration}'</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Bloque y Tipo */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Momento Ideal & Esfuerzo</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Bloque Horario */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <CalendarDays size={14} /> Bloque del Día
                                </label>
                                <select
                                    value={preferredBlock}
                                    onChange={(e) => setPreferredBlock(e.target.value as PreferredBlock)}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold text-[#364649] focus:border-[#AA895F] focus:outline-none bg-gray-50 hover:bg-white transition-colors"
                                >
                                    <option value="anytime">🌐 Flexible</option>
                                    <option value="morning">🌅 Mañana</option>
                                    <option value="afternoon">☀️ Tarde</option>
                                    <option value="evening">🌙 Noche</option>
                                </select>
                            </div>

                            {/* Hora Fija (Opcional) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <Clock size={14} /> Hora Específica <span className="text-slate-300 font-normal">(opcional)</span>
                                </label>
                                <TimePicker
                                    value={fixedTime}
                                    onChange={(val) => {
                                        setFixedTime(val);
                                        setScheduleType(val ? 'fixed' : 'flexible');
                                    }}
                                    dropDirection="up"
                                />
                            </div>

                            {/* Carga Cognitiva */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    <BrainCircuit size={14} /> Carga Mental
                                </label>
                                <select
                                    value={cognitiveLoad}
                                    onChange={(e) => setCognitiveLoad(e.target.value as CognitiveLoad)}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold text-[#364649] focus:border-[#AA895F] focus:outline-none bg-gray-50 hover:bg-white transition-colors"
                                >
                                    <option value="low">🟢 Baja</option>
                                    <option value="medium">🟡 Media</option>
                                    <option value="high">🔴 Alta</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-3 sticky bottom-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !categoryId || !name}
                        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all ${loading || !categoryId || !name
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-[#364649] hover:bg-[#242f31] hover:shadow-xl hover:scale-105'
                            }`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (habitToEdit ? <><Save size={18} /> Guardar</> : <><Save size={18} /> Crear</>)}
                    </button>
                </div>

            </div>
        </div>
    );
}
