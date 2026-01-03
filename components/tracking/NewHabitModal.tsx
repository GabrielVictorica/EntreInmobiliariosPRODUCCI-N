import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, ArrowRight, ArrowLeft, Target, Calendar, Sparkles, Heart } from 'lucide-react';
import { Habit } from './HabitCard';

interface NewHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (habitData: Partial<Habit>) => void;
    initialData?: Habit | null;
}

const WEEK_DAYS = [
    { label: 'D', value: 0 },
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'M', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 }
];

const HABIT_ICONS = ['🏃', '💪', '📚', '🧘', '💧', '🥗', '💤', '📞', '✍️', '🎯', '⏰', '🏠', '💼', '🎨', '🎵', '🧹'];
const DEFAULT_FORM_STATE = {
    name: '',
    type: 'binary' as 'binary' | 'quantitative',
    target: 1,
    frequency: [1, 2, 3, 4, 5],
    duration: 'indefinite' as 'indefinite' | 'until_date',
    endDate: '',
    motivation: '',
    icon: '🎯',
    executionTime: '',
};

export default function NewHabitModal({ isOpen, onClose, onSave, initialData }: NewHabitModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setStep(1);
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    type: initialData.type || 'binary',
                    target: initialData.target || 1,
                    frequency: initialData.frequency || [1, 2, 3, 4, 5],
                    duration: initialData.duration || 'indefinite',
                    endDate: initialData.endDate || '',
                    motivation: initialData.motivation || '',
                    icon: initialData.icon || '🎯',
                    executionTime: initialData.execution_time ? initialData.execution_time.substring(0, 5) : '',
                });
            } else {
                setFormData(DEFAULT_FORM_STATE);
            }
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen, initialData]);

    if (!isVisible) return null;

    const handleBack = () => setStep(prev => prev - 1);
    const handleNext = () => setStep(prev => prev + 1);

    const toggleDay = (day: number) => {
        setFormData(prev => ({
            ...prev,
            frequency: prev.frequency.includes(day)
                ? prev.frequency.filter(d => d !== day)
                : [...prev.frequency, day]
        }));
    };

    const handleSave = () => {
        onSave({
            ...formData,
            id: initialData?.id,
            execution_time: formData.executionTime ? `${formData.executionTime}:00` : null,
            current: initialData?.current || 0,
            completed: initialData?.completed || false,
            createdAt: initialData?.createdAt || new Date().toISOString()
        } as Partial<Habit>);
        onClose();
    };

    const isStepValid = () => {
        if (step === 1) return formData.name.trim().length > 0;
        if (step === 2 && formData.type === 'quantitative') return formData.target > 0;
        if (step === 3 && formData.duration === 'until_date') return formData.endDate !== '';
        return true;
    };

    const modalContent = (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop - Subtle dark overlay visible on beige background */}
            <div
                className="absolute inset-0 bg-[#364649]/20 backdrop-blur-[3px]"
                onClick={onClose}
            />

            {/* Centered Modal Card */}
            <div
                className={`relative w-full max-w-xl bg-white rounded-3xl shadow-2xl shadow-[#364649]/20 transition-all duration-300 ease-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                style={{ maxHeight: '85vh', overflowY: 'auto' }}
            >

                {/* Header */}
                <div className="px-8 pt-8 flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#364649] flex items-center gap-2">
                            <Sparkles className="text-[#AA895F]" size={24} />
                            {initialData ? 'Editar Hábito' : 'Nuevo Hábito'}
                        </h2>
                        <p className="text-[#364649]/40 text-sm font-bold uppercase tracking-widest">Paso {step} de 4</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-[#364649]/5 rounded-full text-[#364649]/60 hover:bg-[#364649]/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Steps Content */}
                <div className="px-8 pb-10">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#364649]/60 uppercase tracking-wider mb-2">Nombre del Hábito</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ej: Meditación diaria"
                                    className="w-full text-lg font-bold p-4 bg-[#364649]/5 border-2 border-transparent focus:border-[#AA895F]/30 rounded-2xl outline-none transition-all placeholder:text-[#364649]/20"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[#364649]/60 uppercase tracking-wider">Hora de ejecución</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={formData.executionTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, executionTime: e.target.value }))}
                                            className="w-full text-lg font-bold p-4 bg-[#364649]/5 border-2 border-transparent focus:border-[#AA895F]/30 rounded-2xl outline-none transition-all pr-12"
                                        />
                                        <Target className="absolute right-4 top-1/2 -translate-y-1/2 text-[#364649]/20" size={20} />
                                    </div>
                                    <p className="text-[10px] text-[#364649]/40 font-bold uppercase tracking-wider ml-1">Opcional</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[#364649]/60 uppercase tracking-wider">Elige un Icono</label>
                                    <div className="grid grid-cols-5 gap-2 p-3 bg-gradient-to-br from-[#f8f6f3] to-[#f0ebe4] rounded-2xl border border-[#364649]/10 max-h-[160px] overflow-y-auto scrollbar-hide">
                                        {HABIT_ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                                className={`aspect-square flex items-center justify-center text-xl rounded-xl transition-all duration-200 border-2 ${formData.icon === icon
                                                    ? 'bg-[#AA895F] border-[#AA895F] scale-105 shadow-md shadow-[#AA895F]/20'
                                                    : 'bg-white border-transparent hover:border-[#AA895F]/30'
                                                    }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <label className="block text-sm font-bold text-[#364649]/60 uppercase tracking-wider mb-3">Tipo de meta</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'binary' }))}
                                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${formData.type === 'binary' ? 'border-[#AA895F] bg-[#AA895F]/5 scale-[1.02]' : 'border-transparent bg-[#364649]/5 hover:bg-[#364649]/10'}`}
                                >
                                    <Check size={32} className={formData.type === 'binary' ? 'text-[#AA895F]' : 'text-[#364649]/20'} />
                                    <span className="font-bold text-[#364649]">Check simple</span>
                                    <span className="text-[10px] text-[#364649]/40 uppercase font-bold">Hecho / No hecho</span>
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'quantitative' }))}
                                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${formData.type === 'quantitative' ? 'border-[#AA895F] bg-[#AA895F]/5 scale-[1.02]' : 'border-transparent bg-[#364649]/5 hover:bg-[#364649]/10'}`}
                                >
                                    <Target size={32} className={formData.type === 'quantitative' ? 'text-[#AA895F]' : 'text-[#364649]/20'} />
                                    <span className="font-bold text-[#364649]">Numérico</span>
                                    <span className="text-[10px] text-[#364649]/40 uppercase font-bold">Meta cuantificable</span>
                                </button>
                            </div>

                            {formData.type === 'quantitative' && (
                                <div className="animate-fade-in-up mt-4">
                                    <label className="block text-sm font-bold text-[#364649]/60 uppercase tracking-wider mb-3">¿Cuál es tu meta diaria?</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={formData.target}
                                            onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                            className="w-32 text-2xl font-bold p-4 bg-[#364649]/5 border-2 border-transparent focus:border-[#AA895F]/30 rounded-2xl outline-none"
                                        />
                                        <span className="text-[#364649]/40 font-bold uppercase text-sm tracking-wider">Unidades</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-[#364649]/60 uppercase tracking-wider mb-4">¿Qué días lo harás?</label>
                                <div className="flex justify-between items-center gap-2 p-3 rounded-3xl">
                                    {WEEK_DAYS.map(day => (
                                        <button
                                            key={day.value}
                                            onClick={() => toggleDay(day.value)}
                                            className={`w-11 h-11 rounded-full font-bold text-sm transition-all duration-200 border-2 ${formData.frequency.includes(day.value)
                                                ? 'bg-[#364649] text-white border-[#364649] shadow-lg scale-105'
                                                : 'bg-white text-[#364649]/50 border-[#364649]/20 hover:border-[#AA895F]/50 hover:text-[#364649]'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#364649]/60 uppercase tracking-wider mb-4">Duración del objetivo</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, duration: 'indefinite' }))}
                                        className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${formData.duration === 'indefinite'
                                            ? 'border-[#AA895F] bg-[#AA895F]/10 shadow-md'
                                            : 'border-[#364649]/15 bg-white hover:border-[#AA895F]/40'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={20} className={formData.duration === 'indefinite' ? 'text-[#AA895F]' : 'text-[#364649]/30'} />
                                            <span className="font-bold text-sm text-[#364649]">Indefinido</span>
                                        </div>
                                        {formData.duration === 'indefinite' && (
                                            <div className="w-5 h-5 bg-[#AA895F] rounded-full flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, duration: 'until_date' }))}
                                        className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${formData.duration === 'until_date'
                                            ? 'border-[#AA895F] bg-[#AA895F]/10 shadow-md'
                                            : 'border-[#364649]/15 bg-white hover:border-[#AA895F]/40'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ArrowRight size={20} className={formData.duration === 'until_date' ? 'text-[#AA895F]' : 'text-[#364649]/30'} />
                                            <span className="font-bold text-sm text-[#364649]">Hasta fecha</span>
                                        </div>
                                        {formData.duration === 'until_date' && (
                                            <div className="w-5 h-5 bg-[#AA895F] rounded-full flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {formData.duration === 'until_date' && (
                                    <div className="mt-4 animate-fade-in-up">
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="w-full text-lg font-bold p-4 bg-[#364649]/5 border-2 border-transparent focus:border-[#AA895F]/30 rounded-2xl outline-none"
                                        />
                                        {formData.endDate && (
                                            <p className="mt-2 text-xs font-bold text-[#AA895F] uppercase flex items-center gap-2">
                                                <Calendar size={12} />
                                                Finaliza el: {new Date(formData.endDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-[#AA895F]/5 border border-[#AA895F]/20 p-6 rounded-3xl mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Heart className="text-[#AA895F]" size={20} />
                                    <h4 className="font-bold text-[#364649]">Tu "Por qué"</h4>
                                </div>
                                <p className="text-[#364649]/60 text-sm leading-relaxed">
                                    ¿Por qué es importante este hábito para ti? Tu motivación te ayudará a mantener la constancia en los días difíciles.
                                </p>
                            </div>

                            <textarea
                                autoFocus
                                value={formData.motivation}
                                onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                                placeholder="Ej: Para tener más energía y claridad mental en mi trabajo..."
                                className="w-full h-32 text-lg p-5 bg-[#364649]/5 border-2 border-transparent focus:border-[#AA895F]/30 rounded-3xl outline-none resize-none placeholder:text-[#364649]/20 italic"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 pb-12 flex items-center gap-4">
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="p-5 bg-[#364649]/5 text-[#364649] rounded-2xl font-bold flex items-center gap-2 hover:bg-[#364649]/10 transition-all"
                        >
                            <ArrowLeft size={20} />
                            Atrás
                        </button>
                    )}

                    <button
                        disabled={!isStepValid()}
                        onClick={step === 4 ? handleSave : handleNext}
                        className={`flex-1 p-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${!isStepValid()
                            ? 'bg-[#364649]/10 text-[#364649]/20 cursor-not-allowed'
                            : 'bg-[#364649] text-white shadow-xl shadow-[#364649]/20 hover:scale-[1.02] active:scale-95'
                            }`}
                    >
                        {step === 4 ? (
                            <>{initialData ? 'Guardar Cambios' : 'Crear Hábito'} <Sparkles size={20} /></>
                        ) : (
                            <>Siguiente <ArrowRight size={20} /></>
                        )}
                    </button>
                </div>
            </div>
        </div >
    );

    // Use portal to render at body level for full-screen coverage
    return ReactDOM.createPortal(modalContent, document.body);
}
