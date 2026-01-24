import React, { useState, useEffect } from 'react';
import { ClosingRecord, PropertyRecord, ClientRecord, BuyerClientRecord } from '../../types';
import { Plus, DollarSign, Award, Percent, TrendingUp, TrendingDown, Calendar, Search, ExternalLink, User, ThumbsUp, AlertTriangle, CheckCircle, Lightbulb, Pencil, Trash2, X } from 'lucide-react';
import ClosingForm from './ClosingForm';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '../../services/supabaseClient';

interface ClosingsDashboardProps {
    availableYears?: number[];
}

const ClosingRow = React.memo(({
    closing,
    onEdit,
    onDelete,
    getPropertyName,
    getBuyerName,
    exchangeRate,
    commissionSplit
}: {
    closing: ClosingRecord,
    onEdit: (c: ClosingRecord) => void,
    onDelete: (id: string) => void,
    getPropertyName: (c: ClosingRecord) => string,
    getBuyerName: (c: ClosingRecord) => string,
    exchangeRate: number,
    commissionSplit: number
}) => {
    const dateStr = closing.date && closing.date.includes(' ') && !closing.date.includes('T') ? closing.date.replace(' ', 'T') : closing.date;
    const dateObj = new Date(dateStr);
    const month = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('es-ES', { month: 'long' }) : 'Mes Desc.';
    const propName = getPropertyName(closing);
    const buyerName = getBuyerName(closing);

    return (
        <tr className="hover:bg-[#AA895F]/5 transition-colors">
            <td className="px-6 py-3 font-medium text-[#364649] border-r border-[#364649]/5">
                {closing.manualProperty ? (
                    <span className="flex items-center text-[#708F96] italic"><ExternalLink size={12} className="mr-1" /> {propName}</span>
                ) : propName}
            </td>
            <td className="px-4 py-3 text-center capitalize text-[#364649]/70 border-r border-[#364649]/5">
                {month}
            </td>
            <td className="px-4 py-3 text-[#364649]/70 border-r border-[#364649]/5">
                {closing.manualBuyer ? (
                    <span className="flex items-center italic text-[#708F96]"><User size={12} className="mr-1" /> {buyerName}</span>
                ) : buyerName}
            </td>
            <td className="px-4 py-3 text-right font-medium text-[#364649] border-r border-[#364649]/5">
                {closing.currency} {closing.salePrice.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-center font-bold text-[#364649] border-r border-[#364649]/5">
                {closing.sides}
            </td>
            <td className="px-4 py-3 text-right font-bold text-[#364649] border-r border-[#364649]/5 bg-gray-50/50">
                {closing.currency} {closing.totalBilling.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-black text-[#AA895F] bg-[#AA895F]/5">
                {closing.currency} {closing.agentHonorarium.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => onEdit(closing)}
                        className="text-[#364649]/40 hover:text-[#AA895F] transition-colors p-2 hover:bg-[#AA895F]/10 rounded-lg"
                        title="Editar Cierre"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(closing.id)}
                        className="text-[#364649]/40 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                        title="Eliminar Cierre"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

const ClosingsDashboard: React.FC<ClosingsDashboardProps> = ({
    availableYears = [2024, 2025, 2026, 2027, 2028]
}) => {
    // Atomic Selectors
    const {
        currentYear, onSelectYear, exchangeRate, commissionSplit, updateSettings,
        getMetricsByYear, addClosing, deleteClosing, properties, buyers
    } = useBusinessStore(useShallow(state => ({
        currentYear: state.selectedYear,
        onSelectYear: state.setSelectedYear,
        exchangeRate: state.exchangeRate,
        commissionSplit: state.commissionSplit,
        updateSettings: state.updateSettings,
        getMetricsByYear: state.getMetricsByYear,
        addClosing: state.addClosing,
        deleteClosing: state.deleteClosing,
        properties: state.properties,
        buyers: state.buyers
    })));

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClosing, setEditingClosing] = useState<ClosingRecord | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Memoize metrics calculation to avoid heavy work on every small state update
    const metrics = React.useMemo(() => getMetricsByYear(currentYear), [getMetricsByYear, currentYear]);

    const {
        totalBillingUSD: totalBilling,
        totalIncomeUSD: totalIncome,
        totalSides: totalEnds,
        ratioPLPB,
        filteredClosings
    } = metrics;

    const ratioNum = Number(ratioPLPB.toFixed(1));

    // Local state for editing rate
    const [localRate, setLocalRate] = useState(exchangeRate.toString());

    useEffect(() => {
        setLocalRate(exchangeRate.toString());
    }, [exchangeRate]);

    const handleRateBlur = React.useCallback(() => {
        const val = parseFloat(localRate);
        if (!isNaN(val) && val > 0 && val !== exchangeRate) {
            updateSettings(val, commissionSplit);
        } else {
            setLocalRate(exchangeRate.toString());
        }
    }, [localRate, exchangeRate, commissionSplit, updateSettings]);

    const handleSave = React.useCallback((record: ClosingRecord) => {
        addClosing(record);
        setIsFormOpen(false);
        setEditingClosing(null);
    }, [addClosing]);

    const handleEdit = React.useCallback((record: ClosingRecord) => {
        setEditingClosing(record);
        setIsFormOpen(true);
    }, []);

    const handleNew = React.useCallback(() => {
        setEditingClosing(null);
        setIsFormOpen(true);
    }, []);

    const getPropertyName = React.useCallback((closing: ClosingRecord) => {
        if (closing.propertyId) {
            const prop = properties.find(p => p.id === closing.propertyId);
            return prop ? `${prop.address.street} ${prop.address.number}` : 'Propiedad eliminada';
        }
        return closing.manualProperty || 'No especificada';
    }, [properties]);

    const getBuyerName = React.useCallback((closing: ClosingRecord) => {
        if (closing.buyerClientId) {
            const b = buyers.find(c => c.id === closing.buyerClientId);
            return b ? b.name : 'Desconocido';
        }
        return closing.manualBuyer || 'Externo';
    }, [buyers]);

    // Centralized Analysis logic can stay here as it's UI/UX related
    const getAnalysis = React.useCallback((r: number) => {
        if (r === 0) return { title: "Sin Datos Suficientes", text: "Registra más actividad para generar un diagnóstico.", color: "bg-gray-100 border-gray-200 text-gray-600" };
        if (r <= 4) return { title: "Riesgo de Stock (Ratio < 4)", text: "Tu efectividad es altísima, pero cuidado: Estás vendiendo todo lo que captas demasiado rápido. CORRES RIESGO DE QUEDARTE SIN INVENTARIO. Prioriza la prospección (PL) urgente.", color: "bg-blue-50 border-blue-200 text-blue-800" };
        if (r <= 6.5) return { title: "Negocio Saludable (Zona 6-1)", text: "Estás en el punto dulce del mercado. Tu equilibrio entre captación y cierre es óptimo. Mantén este ritmo de generación de contactos.", color: "bg-emerald-50 border-emerald-200 text-emerald-800" };
        if (r <= 10) return { title: "Alerta de Eficiencia (Ratio 7-10)", text: "Estás trabajando de más por cada venta. REVISA: 1) ¿Estás calificando bien en la primera llamada? 2) ¿El precio de tus captaciones es correcto?", color: "bg-amber-50 border-amber-200 text-amber-800" };
        return { title: "Cuello de Botella (Ratio > 10)", text: "Cuidado. Necesitas demasiadas gestiones para cerrar una venta. Es probable que estés trabajando con compradores no calificados o propiedades fuera de precio. Detente y analiza tu cartera.", color: "bg-rose-50 border-rose-200 text-rose-800" };
    }, []);

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

            {/* ERROR ALERT BANNER */}
            {useBusinessStore.getState().error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-3" size={24} />
                        <div>
                            <h4 className="text-red-800 font-bold">Error de Conexión</h4>
                            <p className="text-red-700 text-sm">{useBusinessStore.getState().error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => useBusinessStore.getState().fetchBusinessData(
                            useBusinessStore.getState().targetUserId,
                            false, // Re-fetching preserves current global/local state internally if we don't pass explicit overrides, but let's be safe
                            undefined,
                            true // Force
                        )}
                        className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            )}



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
                                    <td colSpan={8} className="px-6 py-10 text-center text-[#364649]/40 italic">
                                        No hay cierres registrados en {currentYear}.
                                    </td>
                                </tr>
                            ) : (
                                filteredClosings.map((c) => (
                                    <ClosingRow
                                        key={c.id}
                                        closing={c}
                                        onEdit={handleEdit}
                                        onDelete={setDeleteConfirmId}
                                        getPropertyName={getPropertyName}
                                        getBuyerName={getBuyerName}
                                        exchangeRate={exchangeRate}
                                        commissionSplit={commissionSplit}
                                    />
                                ))
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
                    onDelete={deleteClosing}
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
                                        deleteClosing(deleteConfirmId);
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

export default React.memo(ClosingsDashboard);
