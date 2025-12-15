
import React, { useState, useEffect } from 'react';
import { ClosingRecord, ActivityRecord, PropertyRecord, ClientRecord, BuyerClientRecord } from '../../types';
import { Plus, DollarSign, Award, Percent, TrendingUp, TrendingDown, Calendar, Search, ExternalLink, User, ThumbsUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import ClosingForm from './ClosingForm';

interface ClosingsDashboardProps {
    closings: ClosingRecord[];
    activities: ActivityRecord[];
    properties: PropertyRecord[];
    clients: ClientRecord[];
    buyers: BuyerClientRecord[];
    onAddClosing: (record: ClosingRecord) => void;
    exchangeRate: number;
    onUpdateExchangeRate: (rate: number) => void;
}

const ClosingsDashboard: React.FC<ClosingsDashboardProps> = ({
    closings, activities, properties, clients, buyers, onAddClosing,
    exchangeRate, onUpdateExchangeRate
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClosing, setEditingClosing] = useState<ClosingRecord | null>(null);
    const [commissionSplit, setCommissionSplit] = useState(45);

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

    // --- METRICS CALCULATION ---
    const totalPLPB = activities.filter(a => a.type === 'pre_listing' || a.type === 'pre_buying').length;
    const totalClosings = closings.length;

    // Ratio Logic
    const ratioVal = totalClosings > 0 ? (totalPLPB / totalClosings) : totalPLPB;
    const ratio = ratioVal.toFixed(1);
    const ratioNum = Number(ratio);

    const effectiveness = totalPLPB > 0 ? ((totalClosings / totalPLPB) * 100).toFixed(1) : '0.0';

    // Totals (Normalized to USD)
    const totalBilling = closings.reduce((acc, c) => acc + normalizeToUSD(c.totalBilling, c.currency), 0);
    const totalIncome = closings.reduce((acc, c) => acc + normalizeToUSD(c.agentHonorarium, c.currency), 0);
    const totalEnds = closings.reduce((acc, c) => acc + c.sides, 0);

    // Avg Ticket (Weighted by Sales Price, normalized)
    const avgTicket = totalClosings > 0
        ? closings.reduce((acc, c) => acc + normalizeToUSD(c.salePrice, c.currency), 0) / totalClosings
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
                        <p className="text-[#364649]/60 text-sm font-medium">Facturación y Efectividad</p>
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

            {/* 1. METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#364649] rounded-2xl p-6 shadow-lg text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} /></div>
                    <p className="text-xs font-bold uppercase text-[#AA895F] mb-1">Facturación Total (Norm.)</p>
                    <h3 className="text-3xl font-bold mb-2">USD {Math.round(totalBilling).toLocaleString()}</h3>
                    <p className="text-[10px] text-white/50">Tu ingreso neto: USD {Math.round(totalIncome).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#364649]/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-[#708F96]"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase text-[#364649]/50 mb-1">Transacciones (Puntas)</p>
                            <h3 className="text-3xl font-bold text-[#364649]">{totalEnds}</h3>
                        </div>
                        <div className="bg-[#708F96]/10 p-2 rounded-lg text-[#708F96]"><Award size={20} /></div>
                    </div>
                    <p className="text-[10px] text-[#364649]/40 mt-2">Registros de Cierre: {totalClosings}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#364649]/5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase text-[#364649]/50 mb-1">Ticket Promedio (USD)</p>
                            <h3 className="text-3xl font-bold text-[#364649]">
                                <span className="text-lg text-[#364649]/40">$</span>{Math.round(avgTicket / 1000)}k
                            </h3>
                        </div>
                        <div className="bg-[#AA895F]/10 p-2 rounded-lg text-[#AA895F]"><TrendingUp size={20} /></div>
                    </div>
                    <p className="text-[10px] text-[#364649]/40 mt-2">Valor venta normalizado</p>
                </div>
                <div className={`rounded-2xl p-6 shadow-sm border bg-white border-[#364649]/5`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase text-[#364649]/50 mb-1">Efectividad %</p>
                            <h3 className="text-3xl font-bold text-[#364649]">{effectiveness}%</h3>
                        </div>
                        <div className="bg-white p-2 rounded-lg text-[#364649] border shadow-sm"><Percent size={20} /></div>
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-[#364649]/60">Cierres sobre PL+PB</div>
                </div>
            </div>

            {/* 2. INTELLIGENT RATIO ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Visual Ratio */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#364649]/5 flex flex-col items-center justify-center relative">
                    <p className="text-xs font-bold uppercase text-[#364649]/40 mb-2 tracking-widest">TU RATIO ACTUAL</p>
                    <div className="text-5xl font-black text-[#364649] flex items-baseline">
                        {ratio}<span className="text-xl font-medium text-[#364649]/40 ml-1">a 1</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full mt-6 relative overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${ratioNum <= 6 ? 'bg-emerald-500' : ratioNum <= 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min((ratioNum / 12) * 100, 100)}%` }}
                        ></div>
                        <div className="absolute top-0 bottom-0 w-0.5 bg-[#364649] left-[50%] z-10" title="Límite Saludable (6)"></div>
                    </div>
                    <div className="w-full flex justify-between text-[10px] text-[#364649]/40 mt-1 font-bold">
                        <span>0 (Stock Risk)</span>
                        <span className="text-[#364649]">6 (Saludable)</span>
                        <span>12+ (Ineficiente)</span>
                    </div>
                </div>

                {/* Business Diagnosis */}
                <div className={`lg:col-span-2 rounded-3xl p-8 border shadow-sm flex items-start gap-4 ${analysis.color}`}>
                    <div className="bg-white/50 p-3 rounded-xl shrink-0">
                        <Lightbulb size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                            Diagnóstico: {analysis.title}
                        </h3>
                        <p className="text-sm font-medium leading-relaxed opacity-90">
                            {analysis.text}
                        </p>
                        {ratioNum > 6 && (
                            <div className="mt-4 pt-4 border-t border-black/5 text-xs font-bold uppercase tracking-wide opacity-70">
                                Acción recomendada: Aumentar prospección en Objetivos
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. CLOSINGS TABLE */}
            <div className="bg-white rounded-3xl border border-[#364649]/10 overflow-hidden shadow-xl" style={{ animationDelay: '0.2s' }}>
                <div className="p-6 border-b border-[#364649]/5 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-[#364649]">Registro de Operaciones</h3>
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
                            {closings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-[#364649]/40 italic">
                                        No hay cierres registrados aún.
                                    </td>
                                </tr>
                            ) : (
                                closings.map((c) => {
                                    const dateObj = new Date(c.date);
                                    const month = dateObj.toLocaleString('es-ES', { month: 'long' });
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
                                                <button
                                                    onClick={() => handleEdit(c)}
                                                    className="text-[#364649]/40 hover:text-[#AA895F] transition-colors p-2 hover:bg-[#AA895F]/10 rounded-lg"
                                                    title="Editar Cierre"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {closings.length > 0 && (
                            <tfoot className="bg-[#364649]/5 font-bold text-[#364649]">
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-right uppercase text-xs tracking-widest">Totales Normalizados (USD)</td>
                                    <td className="px-4 py-4 text-right border-t border-[#364649]/10">
                                        USD {Math.round(totalBilling).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-right text-[#AA895F] border-t border-[#AA895F]/20">
                                        USD {Math.round(totalIncome).toLocaleString()}
                                    </td>
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
                    initialData={editingClosing}
                    exchangeRate={exchangeRate}
                />
            )}

        </div>
    );
};

export default ClosingsDashboard;
