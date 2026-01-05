import React, { useState } from 'react';
import { X, Battery, Smile, Zap, Save, Calendar, Tag } from 'lucide-react';
import { DailyLog } from '../../types';

interface DailyPulseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<DailyLog>) => void;
    date: Date;
}

const MOODS = [
    { value: 1, emoji: '😡', label: 'Enojado' },
    { value: 2, emoji: '😞', label: 'Triste' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Bien' },
    { value: 5, emoji: '🤩', label: 'Excelente' }
];

const COMMON_TAGS = ['Viaje', 'Enfermo', 'Motivado', 'Cansado', 'Familia', 'Social', 'Trabajo Tarde', 'Resaca', 'Menstruación'];

export default function DailyPulseModal({ isOpen, onClose, onSave, date }: DailyPulseModalProps) {
    const [mood, setMood] = useState<number | null>(null);
    const [energy, setEnergy] = useState<number>(5);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSave = () => {
        onSave({
            date: date.toISOString().split('T')[0],
            mood_score: mood || 3,
            energy_score: energy,
            tags: selectedTags,
            notes
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-black tracking-tight mb-1">Daily Pulse</h2>
                        <p className="text-indigo-100 text-sm font-medium opacity-90">
                            {date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-8">

                    {/* 1. Mood Check */}
                    <div className="text-center">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">¿Cómo te sientes?</label>
                        <div className="flex justify-between px-2">
                            {MOODS.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => setMood(m.value)}
                                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${mood === m.value
                                            ? 'transform scale-125 -translate-y-2'
                                            : 'opacity-40 hover:opacity-100 hover:scale-110'
                                        }`}
                                >
                                    <span className="text-3xl drop-shadow-md">{m.emoji}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Energy Level */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Zap size={12} className="text-amber-500" /> Nivel de Energía
                            </label>
                            <span className="text-xl font-black text-gray-800">{energy}/10</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={energy}
                            onChange={(e) => setEnergy(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium">
                            <span>Zombie 🧟</span>
                            <span>Modo Bestia 🦍</span>
                        </div>
                    </div>

                    {/* 3. Context Tags */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <Tag size={12} /> Contexto del día
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedTags.includes(tag)
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                            <input
                                type="text"
                                placeholder="+ Personalizado"
                                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-dashed border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors focus:ring-0 outline-none w-24"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if (val && !selectedTags.includes(val)) toggleTag(val);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* 4. Notes */}
                    <div>
                        <textarea
                            className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-600 placeholder-gray-400 resize-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                            rows={2}
                            placeholder="¿Alguna nota extra sobre hoy?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={mood === null}
                        className={`w-full py-3.5 rounded-xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 ${mood !== null
                                ? 'bg-gray-900 hover:bg-black hover:scale-[1.02] active:scale-95'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <Save size={18} />
                        GUARDAR
                    </button>
                </div>

            </div>
        </div>
    );
}
