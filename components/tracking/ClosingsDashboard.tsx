import React, { useState, useEffect } from 'react';
import { ClosingRecord, ActivityRecord, PropertyRecord, ClientRecord, BuyerClientRecord } from '../../types';
import { Plus, DollarSign, Award, Percent, TrendingUp, TrendingDown, Calendar, Search, ExternalLink, User, ThumbsUp, AlertTriangle, CheckCircle, Lightbulb, Pencil, Trash2, X } from 'lucide-react';
import ClosingForm from './ClosingForm';

interface ClosingsDashboardProps {
    closings: ClosingRecord[];
    activities: ActivityRecord[]; // All time activities
    properties: PropertyRecord[];
    clients: ClientRecord[];
    buyers: BuyerClientRecord[];
    onAddClosing: (record: ClosingRecord) => void;
    onDeleteClosing: (id: string) => void;
    exchangeRate: number;
    onUpdateExchangeRate: (rate: number) => void;
    // Year Props
    availableYears: number[];
    currentYear: number;
    onSelectYear: (year: number) => void;
}

const ClosingsDashboard: React.FC<ClosingsDashboardProps> = ({
    closings, activities, properties, clients, buyers, onAddClosing, onDeleteClosing,
    exchangeRate, onUpdateExchangeRate,
    availableYears, currentYear, onSelectYear
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClosing, setEditingClosing] = useState<ClosingRecord | null>(null);
    const [commissionSplit, setCommissionSplit] = useState(45);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null); // For delete confirmation modal

    // Local state for editing rate (debounced)
    const [localRate, setLocalRate] = useState(exchangeRate.toString());

    useEffect(() => {
        setLocalRate(exchangeRate.toString());
    }, [exchangeRate]);

    const handleRateBlur = () => {
        const val = parseFloat(localRate);
        if (!isNaN(val) && val > 0) {
            onUpdateExchangeRate(val);
        } else {
            setLocalRate(exchangeRate.toString());
        }
    };


    useEffect(() => {
        const saved = localStorage.getItem('objectives_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.commissionSplit) setCommissionSplit(parsed.commissionSplit);
        }
    }, []);

    // --- HELPER: NORMALIZE CURRENCY ---
    const normalizeToUSD = (amount: number, currency: string) => {
        if (currency === 'USD') return amount;
        if (currency === 'ARS') return amount / exchangeRate;
        return amount;
    };

    // --- FILTER BY YEAR ---
    const filteredClosings = closings.filter(c => {
        if (!c.date) return false;
        // Robust parsing: Handle SQL strings with spaces instead of T, and potentially timezone data
        let dateStr = c.date;
        if (dateStr.includes(' ') && !dateStr.includes('T')) {
            dateStr = dateStr.replace(' ', 'T');
        }

        // Force treat as local date to compare year correctly
        const d = new Date(dateStr);
        // Correctly handle UTC dates if needed depending on how they are stored vs local selection
        // But for year comparison, getFullYear() usually suffices if timezone diff doesn't shift year.

        return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
    });

    const filteredPLPB = activities.filter(a => {
        if (!a.date) return false;
        const dateStr = a.date.includes(' ') && !a.date.includes('T') ? a.date.replace(' ', 'T') : a.date;
        const d = new Date(dateStr);
        return (a.type === 'pre_listing' || a.type === 'pre_buying') && !isNaN(d.getTime()) && d.getFullYear() === currentYear;
    });

    // --- METRICS CALCULATION (YEARLY) ---
    const totalPLPB = filteredPLPB.length;
    const totalClosings = filteredClosings.length;

    // Ratio Logic (Yearly)
    const ratioVal = totalClosings > 0 ? (totalPLPB / totalClosings) : totalPLPB;
    const ratio = ratioVal.toFixed(1);
    const ratioNum = Number(ratio);

    const effectiveness = totalPLPB > 0 ? ((totalClosings / totalPLPB) * 100).toFixed(1) : '0.0';

    // Totals (Yearly - Normalized to USD)
    const totalBilling = filteredClosings.reduce((acc, c) => acc + normalizeToUSD(c.totalBilling, c.currency), 0);
    const totalIncome = filteredClosings.reduce((acc, c) => acc + normalizeToUSD(c.agentHonorarium, c.currency), 0);
    const totalEnds = filteredClosings.reduce((acc, c) => acc + c.sides, 0);

    // Avg Ticket (Weighted by Sales Price, normalized) - Yearly
    const avgTicket = totalClosings > 0
        ? filteredClosings.reduce((acc, c) => acc + normalizeToUSD(c.salePrice, c.currency), 0) / totalClosings
        : 0;

    const handleSave = (record: ClosingRecord) => {
        onAddClosing(record);
        setIsFormOpen(false);
        setEditingClosing(null);
    };

    const handleEdit = (record: ClosingRecord) => {
        setEditingClosing(record);
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setEditingClosing(null);
        setIsFormOpen(true);
    };

    const getPropertyName = (closing: ClosingRecord) => {
        if (closing.propertyId) {
            const prop = properties.find(p => p.id === closing.propertyId);
            return prop ? `${prop.address.street} ${prop.address.number}` : 'Propiedad eliminada';
        }
        return closing.manualProperty || 'No especificada';
    };

    const getBuyerName = (closing: ClosingRecord) => {
        if (closing.buyerClientId) {
            const b = buyers.find(c => c.id === closing.buyerClientId);
            return b ? b.name : 'Desconocido';
        }
        return closing.manualBuyer || 'Externo';
    };

    // LOGIC: Analysis Text based on Ratio
    const getAnalysis = (r: number) => {
        if (r === 0) return { title: "Sin Datos Suficientes", text: "Registra más actividad para generar un diagnóstico.", color: "bg-gray-100 border-gray-200 text-gray-600" };
        if (r <= 4) return { title: "Riesgo de Stock (Ratio < 4)", text: "Tu efectividad es altísima, pero cuidado: Estás vendiendo todo lo que captas demasiado rápido. CORRES RIESGO DE QUEDARTE SIN INVENTARIO. Prioriza la prospección (PL) urgente.", color: "bg-blue-50 border-blue-200 text-blue-800" };
        if (r <= 6.5) return { title: "Negocio Saludable (Zona 6-1)", text: "Estás en el punto dulce del mercado. Tu equilibrio entre captación y cierre es óptimo. Mantén este ritmo de generación de contactos.", color: "bg-emerald-50 border-emerald-200 text-emerald-800" };
        if (r <= 10) return { title: "Alerta de Eficiencia (Ratio 7-10)", text: "Estás trabajando de más por cada venta. REVISA: 1) ¿Estás calificando bien en la primera llamada? 2) ¿El precio de tus captaciones es correcto?", color: "bg-amber-50 border-amber-200 text-amber-800" };
        return { title: "Cuello de Botella (Ratio > 10)", text: "Cuidado. Necesitas demasiadas gestiones para cerrar una venta. Es probable que estés trabajando con compradores no calificados o propiedades fuera de precio. Detente y analiza tu cartera.", color: "bg-rose-50 border-rose-200 text-rose-800" };
    };

    const analysis = getAnalysis(ratioNum);

    return (
        <div className="space-y-8 pb-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Cierres y Resultados</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => onSelectYear(year)}
                                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${currentYear === year ? 'bg-[#364649] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                        <div className="h-5 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200">
                            <span className="text-xs font-bold text-emerald-600">USD 1 = ARS</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={localRate}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setLocalRate(val);
                                    }
                                }}
                                onBlur={handleRateBlur}
                                onKeyDown={(e) => e.key === 'Enter' && handleRateBlur()}
                                className="w-16 text-xs font-bold text-[#364649] border-b border-gray-300 focus:border-[#AA895F] outline-none text-center"
                            />
                        </div>
                    </div>
                </div>
                <button onClick={handleNew} className="btn-hover-effect bg-[#AA895F] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#AA895F]/30 flex items-center active:scale-95">
                    <Plus className="mr-2" size={18} /> Registrar Cierre
                </button>
            </div>


            {/* 3. CLOSINGS TABLE */}
            <div className="bg-white rounded-3xl border border-[#364649]/10 overflow-hidden shadow-xl" style={{ animationDelay: '0.2s' }}>
                <div className="p-6 border-b border-[#364649]/5 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-[#364649] flex items-center gap-2">
                        <Calendar size={18} className="text-[#AA895F]" />
                        Registro de Operaciones {currentYear}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="text-[10px] text-[#364649]/40 italic">
                            * Totales convertidos a USD (TC: {exchangeRate})
                        </div>
                        <div className="text-xs text-[#364649]/50 font-medium bg-white px-3 py-1 rounded-full border">
                            Split {commissionSplit}%
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-[#364649] text-white">
                            <tr>
                                <th className="px-6 py-4 font-bold border-r border-white/10">Propiedad</th>
                                <th className="px-4 py-4 font-bold border-r border-white/10 text-center">Mes</th>
                                <th className="px-4 py-4 font-bold border-r border-white/10">Cliente Comprador</th>
                                <th className="px-4 py-4 font-bold border-r border-white/10 text-right">Oferta (Precio)</th>
                                <th className="px-4 py-4 font-bold border-r border-white/10 text-center">Puntas</th>
                                <th className="px-4 py-4 font-bold border-r border-white/10 text-right">Facturación</th>
                                <th className="px-4 py-4 font-bold bg-[#AA895F] text-right">Honorarios</th>
                                <th className="px-4 py-4 font-bold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#364649]/5">
                            {filteredClosings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-[#364649]/40 italic">
                                        No hay cierres registrados en {currentYear}.
                                    </td>
                                </tr>
                            ) : (
                                filteredClosings.map((c) => {
                                    const dateStr = c.date && c.date.includes(' ') && !c.date.includes('T') ? c.date.replace(' ', 'T') : c.date;
                                    const dateObj = new Date(dateStr);
                                    const month = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('es-ES', { month: 'long' }) : 'Mes Desc.';
                                    const propName = getPropertyName(c);
                                    const buyerName = getBuyerName(c);

                                    return (
                                        <tr key={c.id} className="hover:bg-[#AA895F]/5 transition-colors">
                                            <td className="px-6 py-3 font-medium text-[#364649] border-r border-[#364649]/5">
                                                {c.manualProperty ? (
                                                    <span className="flex items-center text-[#708F96] italic"><ExternalLink size={12} className="mr-1" /> {propName}</span>
                                                ) : propName}
                                            </td>
                                            <td className="px-4 py-3 text-center capitalize text-[#364649]/70 border-r border-[#364649]/5">
                                                {month}
                                            </td>
                                            <td className="px-4 py-3 text-[#364649]/70 border-r border-[#364649]/5">
                                                {c.manualBuyer ? (
                                                    <span className="flex items-center italic text-[#708F96]"><User size={12} className="mr-1" /> {buyerName}</span>
                                                ) : buyerName}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-[#364649] border-r border-[#364649]/5">
                                                {c.currency} {c.salePrice.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-[#364649] border-r border-[#364649]/5">
                                                {c.sides}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-[#364649] border-r border-[#364649]/5 bg-gray-50/50">
                                                {c.currency} {c.totalBilling.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-[#AA895F] bg-[#AA895F]/5">
                                                {c.currency} {c.agentHonorarium.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center border-t border-[#364649]/5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(c)}
                                                        className="text-[#364649]/40 hover:text-[#AA895F] transition-colors p-2 hover:bg-[#AA895F]/10 rounded-lg"
                                                        title="Editar Cierre"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(c.id)}
                                                        className="text-[#364649]/40 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                                                        title="Eliminar Cierre"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {filteredClosings.length > 0 && (
                            <tfoot className="bg-[#364649]/5 font-bold text-[#364649]">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-right uppercase text-xs tracking-widest">Totales {currentYear} (USD Norm.)</td>
                                    <td className="px-4 py-4 text-center border-t border-[#364649]/10">
                                        {totalEnds}
                                    </td>
                                    <td className="px-4 py-4 text-right border-t border-[#364649]/10">
                                        USD {Math.round(totalBilling).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-right text-[#AA895F] border-t border-[#AA895F]/20">
                                        USD {Math.round(totalIncome).toLocaleString()}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <ClosingForm
                    properties={properties}
                    buyers={buyers}
                    commissionSplit={commissionSplit}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditingClosing(null); }}
                    onDelete={onDeleteClosing}
                    initialData={editingClosing}
                    exchangeRate={exchangeRate}
                />
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100" style={{ animation: 'scaleUp 0.2s ease-out' }}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="p-2 bg-rose-50 rounded-lg">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-[#364649]">¿Eliminar Cierre?</h3>
                            </div>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-[#364649]/70 mb-6 font-medium text-sm">
                            Esta acción eliminará el registro permanentemente. <br />
                            <span className="text-rose-600 font-bold">No se puede deshacer.</span>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#364649] font-bold rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirmId) {
                                        onDeleteClosing(deleteConfirmId);
                                        setDeleteConfirmId(null);
                                    }
                                }}
                                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ClosingsDashboard;
