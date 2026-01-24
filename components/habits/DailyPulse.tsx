import React, { useState, useEffect } from 'react';
import {
    Zap,
    Smile,
    Frown,
    Meh,
    Save,
    Tag,
    Battery,
    BatteryMedium,
    BatteryLow,
    Activity,
    X,
    Loader2
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { DailyLog } from '../../types';
import { useHabitStore } from '../../store/useHabitStore';

interface DailyPulseProps {
    onClose?: () => void;
}

export default function DailyPulse({ onClose }: DailyPulseProps) {
    const dailyLog = useHabitStore(s => s.dailyLog);
    const upsertDailyLog = useHabitStore(s => s.upsertDailyLog);
    const setSelectedDate = useHabitStore(s => s.setSelectedDate);
    const selectedDate = useHabitStore(s => s.selectedDate);

    const [mood, setMood] = useState<number>(dailyLog?.moodScore || 3);
    const [energy, setEnergy] = useState<number>(dailyLog?.energyScore || 5);
    const [notes, setNotes] = useState<string>(dailyLog?.notes || '');
    const [tags, setTags] = useState<string[]>(dailyLog?.tags || []);
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);

    // Update local state if dailyLog changes (e.g. from null to created)
    useEffect(() => {
        if (dailyLog) {
            setMood(dailyLog.moodScore || 3);
            setEnergy(dailyLog.energyScore || 5);
            setNotes(dailyLog.notes || '');
            setTags(dailyLog.tags || []);
        }
    }, [dailyLog]);

    const moods = [
        { value: 1, icon: <Frown size={32} />, label: 'Mal', color: 'text-red-500' },
        { value: 2, icon: <Meh size={32} className="transform rotate-12" />, label: 'Bajo', color: 'text-orange-500' },
        { value: 3, icon: <Meh size={32} />, label: 'Normal', color: 'text-yellow-500' },
        { value: 4, icon: <Smile size={32} />, label: 'Bien', color: 'text-lime-500' },
        { value: 5, icon: <Zap size={32} />, label: 'Excelente', color: 'text-green-500' },
    ];

    const handleSave = async () => {
        setLoading(true);
        const result = await upsertDailyLog({
            moodScore: mood,
            energyScore: energy,
            notes: notes,
            tags: tags
        });

        setLoading(false);
        if (result) {
            // Trigger a refresh of all habit data for the day
            setSelectedDate(selectedDate);
            if (onClose) onClose();
        }
    };

    const addTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const getBatteryIcon = (level: number) => {
        if (level >= 8) return <Battery size={24} className="text-green-500" />;
        if (level >= 4) return <BatteryMedium size={24} className="text-yellow-500" />;
        return <BatteryLow size={24} className="text-red-500" />;
    };

    return (
        <div className="rounded-3xl p-6 shadow-xl relative overflow-hidden bg-gradient-to-br from-[#364649] via-[#3d5154] to-[#2a3738]">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#AA895F]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            )}

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 bg-[#AA895F] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#AA895F]/30">
                    <Activity size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white">Tu Pulso de Hoy</h3>
                    <p className="text-xs text-white/60 font-medium">
                        Registra tu ánimo <span className="text-[#AA895F] font-bold">todos los días</span> para desbloquear la IA.
                    </p>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                {/* Mood Selector */}
                <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Estado de Ánimo</label>
                    <div className="flex justify-between px-2">
                        {moods.map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMood(m.value)}
                                className={`flex flex-col items-center gap-2 transition-all duration-300 ${mood === m.value ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-70 scale-90'
                                    }`}
                            >
                                <div className={`${mood === m.value ? m.color : 'text-white/40'}`}>
                                    {m.icon}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="text-center mt-2 text-sm font-bold text-white">
                        {moods.find(m => m.value === mood)?.label}
                    </div>
                </div>

                {/* Energy Slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Nivel de Energía</label>
                        <span className="text-sm font-black text-white flex items-center gap-1">
                            {getBatteryIcon(energy)} {energy}/10
                        </span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={energy}
                        onChange={(e) => setEnergy(Number(e.target.value))}
                        className="w-full accent-[#AA895F] h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-white/40 mt-1 font-medium">
                        <span>Agotado</span>
                        <span>Imparable</span>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Etiquetas del Día</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map(tag => (
                            <span key={tag} className="bg-white/10 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                                #{tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                    <form onSubmit={addTag} className="relative">
                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Añadir etiqueta (ej: #Lluvia, #Ayuno)..."
                            className="w-full pl-9 pr-3 py-2 bg-white/10 rounded-xl text-sm font-medium text-white placeholder:text-white/30 border border-white/10 focus:border-[#AA895F] focus:outline-none transition-colors"
                        />
                    </form>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Notas Rápidas</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="¿Algo destacable hoy?"
                        rows={2}
                        className="w-full p-3 bg-white/10 rounded-xl text-sm font-medium text-white placeholder:text-white/30 border border-white/10 focus:border-[#AA895F] focus:outline-none transition-colors resize-none"
                    />
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-[#AA895F] text-white font-bold py-3 rounded-xl hover:bg-[#9a7b50] transition-all shadow-lg shadow-[#AA895F]/30 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Guardar Pulso</span>
                </button>
            </div>
        </div>
    );
}
