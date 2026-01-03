import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Clock, MapPin, AlignLeft, Calendar as CalendarIcon, Type, Palette } from 'lucide-react';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: any) => Promise<void>;
    initialDate?: Date | null;
    eventToEdit?: any | null;
}

const formatDateTimeLocal = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

// Google Calendar Colors
const GOOGLE_COLORS = [
    { id: '1', bg: '#7986cb', name: 'Lavanda' },
    { id: '2', bg: '#33b679', name: 'Salvia' },
    { id: '3', bg: '#8e24aa', name: 'Uva' },
    { id: '4', bg: '#e67c73', name: 'Flamingo' },
    { id: '5', bg: '#f6bf26', name: 'Banana' },
    { id: '6', bg: '#f4511e', name: 'Mandarina' },
    { id: '7', bg: '#039be5', name: 'Pavo Real' }, // Default Blue-ish
    { id: '8', bg: '#616161', name: 'Grafito' },
    { id: '9', bg: '#3f51b5', name: 'Arándano' },
    { id: '10', bg: '#0b8043', name: 'Albahaca' },
    { id: '11', bg: '#d50000', name: 'Tomate' },
];

export default function CreateEventModal({ isOpen, onClose, onSubmit, initialDate, eventToEdit }: CreateEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        location: '',
        startDateTime: '',
        duration: '60', // Default 60 minutes
        colorId: '7', // Default to Peacock (Blue)
    });

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                // Formatting for Edit Mode
                const start = new Date(eventToEdit.start.dateTime || eventToEdit.start.date);
                const end = new Date(eventToEdit.end.dateTime || eventToEdit.end.date);
                const durationMs = end.getTime() - start.getTime();
                const durationMin = Math.round(durationMs / 60000);

                setFormData({
                    summary: eventToEdit.summary || '',
                    description: eventToEdit.description || '',
                    location: eventToEdit.location || '',
                    startDateTime: formatDateTimeLocal(start),
                    duration: durationMin.toString(),
                    colorId: eventToEdit.colorId || '7'
                });
            } else {
                // Formatting for Create Mode
                const startDate = initialDate ? new Date(initialDate) : new Date();

                // If no specific initial date provided (just opened generic), round to next 30 min
                if (!initialDate) {
                    const minutes = startDate.getMinutes();
                    const rounded = Math.ceil(minutes / 30) * 30;
                    startDate.setMinutes(rounded, 0, 0);
                }

                setFormData({
                    summary: '',
                    description: '',
                    location: '',
                    startDateTime: formatDateTimeLocal(startDate),
                    duration: '60',
                    colorId: '7'
                });
            }
        }
    }, [isOpen, initialDate, eventToEdit]);

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
                id: eventToEdit?.id, // Pass ID if editing
                endDateTime: endDate.toISOString()
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#364649]/20 backdrop-blur-[3px]">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in border border-[#364649]/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-bold text-[#364649]">
                            {eventToEdit ? 'Editar Evento' : 'Crear Evento'}
                        </h3>
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
                            autoFocus={!eventToEdit}
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-3">
                        <label className="block text-sm font-extrabold text-[#364649] flex items-center gap-2 uppercase tracking-wide opacity-80">
                            <Palette size={16} /> Color
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {GOOGLE_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, colorId: c.id })}
                                    className={`w-8 h-8 rounded-full transition-all border-2 ${formData.colorId === c.id ? 'border-[#364649] scale-110 shadow-md' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c.bg }}
                                    title={c.name}
                                />
                            ))}
                        </div>
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
                                <Clock size={16} /> Duración (Min)
                            </label>
                            <div className="relative">
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
                                {/* Quick Presets */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    {[15, 30, 45, 60].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, duration: m.toString() })}
                                            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${formData.duration === m.toString() ? 'bg-[#AA895F] text-white' : 'bg-gray-100 text-[#364649] hover:bg-gray-200'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
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
                                    {eventToEdit ? 'Guardar Cambios' : 'Agendar en Google'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
