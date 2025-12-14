import React, { useState } from 'react';
import { X, Clock, MapPin, AlignLeft, Calendar as CalendarIcon, Type } from 'lucide-react';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: any) => Promise<void>;
}

export default function CreateEventModal({ isOpen, onClose, onSubmit }: CreateEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        location: '',
        startDateTime: '',
        duration: '60', // Default 60 minutes
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Calculate endDateTime based on startDateTime + duration
            const startDate = new Date(formData.startDateTime);
            const durationMinutes = parseInt(formData.duration) || 0;
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

            await onSubmit({
                ...formData,
                endDateTime: endDate.toISOString()
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#364649]/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-[#364649]/10">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-bold text-[#364649]">Crear Evento</h3>
                        <p className="text-[#364649]/60 text-sm">Sincronizado con Google Calendar</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-[#364649]/60 hover:text-[#364649]">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Title */}
                    <div className="space-y-3">
                        <label className="block text-sm font-extrabold text-[#364649] flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <Type size={16} /> Título del Evento
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#AA895F] focus:ring-4 focus:ring-[#AA895F]/10 outline-none transition-all font-bold text-[#364649] text-lg placeholder:font-normal placeholder:text-gray-400"
                            placeholder="Ej: Reunión con Cliente"
                            value={formData.summary}
                            onChange={e => setFormData({ ...formData, summary: e.target.value })}
                        />
                    </div>

                    {/* Date & Time Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-extrabold text-[#364649] flex items-center gap-2 uppercase tracking-wide opacity-80">
                                <Clock size={16} /> Inicio
                            </label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#AA895F] focus:ring-4 focus:ring-[#AA895F]/10 outline-none transition-all text-[#364649] font-medium"
                                value={formData.startDateTime}
                                onChange={e => setFormData({ ...formData, startDateTime: e.target.value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-extrabold text-[#364649] flex items-center gap-2 uppercase tracking-wide opacity-80">
                                <Clock size={16} /> Duración (Minutos)
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#AA895F] focus:ring-4 focus:ring-[#AA895F]/10 outline-none transition-all text-[#364649] font-medium"
                                placeholder="Ej: 60"
                                value={formData.duration}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setFormData({ ...formData, duration: val });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <label className="block text-sm font-extrabold text-[#364649] flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <MapPin size={16} /> Ubicación
                        </label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#AA895F] focus:ring-4 focus:ring-[#AA895F]/10 outline-none transition-all font-medium text-[#364649]"
                            placeholder="Ej: Oficinas Centrales o Google Meet"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="block text-sm font-extrabold text-[#364649] flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <AlignLeft size={16} /> Descripción
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-5 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#AA895F] focus:ring-4 focus:ring-[#AA895F]/10 outline-none transition-all font-medium text-[#364649] resize-none"
                            placeholder="Detalles importantes..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-[#364649]/70 hover:bg-gray-100 hover:text-[#364649] transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#AA895F] hover:bg-[#8C704D] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <CalendarIcon size={18} />
                                    Agendar en Google
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
