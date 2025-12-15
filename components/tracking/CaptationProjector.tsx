
import React, { useState } from 'react';
import { Target, Calculator, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { DebouncedInput } from '../DebouncedInput';

interface CaptationProjectorProps {
    captationRatio: number;
    isSufficientData: boolean;
    // Lifted State
    goalQty: number;
    goalPeriod: 'month' | 'quarter';
    manualCaptationRatio: number;
    isManualRatio: boolean;
    onUpdate: (key: string, value: any) => void;
    realCriticalNumber: number; // For Alert comparison
}

export default function CaptationProjector({
    captationRatio,
    isSufficientData,
    goalQty,
    goalPeriod,
    manualCaptationRatio,
    isManualRatio,
    onUpdate,
    realCriticalNumber
}: CaptationProjectorProps) {
    // const [goalQty, setGoalQty] = useState(2); // REMOVED
    // const [goalPeriod, setGoalPeriod] = useState<'month' | 'quarter'>('month'); // REMOVED
    // const [manualCaptationRatio, setManualCaptationRatio] = useState(2.5); // REMOVED
    // const [isManualRatio, setIsManualRatio] = useState(false); // REMOVED

    // Calculations
    const months = goalPeriod === 'month' ? 1 : 3;
    const finalRatio = isManualRatio ? manualCaptationRatio : captationRatio;

    // Logic: Goal Listings * Ratio = Pre-Listings Needed
    const preListingsNeeded = goalQty * finalRatio;
    const weeklyPreListingsNeeded = preListingsNeeded / (months * 4);

    // Alert Logic: If Captation Goal requires more PLs than the global Critical Number (PL+PB)
    // This is a rough check but helpful. realCriticalNumber is TOTAL ACTIVITY. 
    // If weeklyPreListingsNeeded > realCriticalNumber, something is off (Goal too high or Billing too low).
    // Let's use a threshold, e.g., if PL needed is > 80% of Total activity, warn? 
    // Or simpler: If PL needed > Real Critical Number, it's mathematically impossible/inconsistent if PB > 0.
    const isGoalDesaligned = weeklyPreListingsNeeded > realCriticalNumber;

    return (
        <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-bold mb-4 flex items-center text-[#364649]">
                <Target className="mr-2" size={20} /> Proyector de Captaciones
            </h2>

            <div className="space-y-5">
                {/* 1. Goal Setting */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Meta Captaciones</label>
                        <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Meta Captaciones</label>
                        <DebouncedInput
                            value={goalQty}
                            onChange={(val) => onUpdate('captationGoalQty', val)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649] font-bold"
                            placeholder="0"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Período</label>
                        <select
                            value={goalPeriod}
                            onChange={(e) => onUpdate('captationGoalPeriod', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649]"
                        >
                            <option value="month">Mensual</option>
                            <option value="quarter">Trimestral</option>
                        </select>
                    </div>
                </div>

                {/* 2. Ratio Configuration */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-[#364649]/50">Ratio Conversión PL : C</label>
                        <button
                            onClick={() => onUpdate('isManualCaptationRatio', !isManualRatio)}
                            className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider transition-colors ${isManualRatio ? 'bg-[#AA895F] text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                        >
                            {isManualRatio ? 'Manual' : 'Auto'}
                        </button>
                    </div>

                    {isManualRatio ? (
                        <div className="relative">
                            <DebouncedInput
                                value={manualCaptationRatio}
                                onChange={(val) => onUpdate('manualCaptationRatio', val)}
                                className="w-full bg-white border border-[#AA895F] rounded-lg px-3 py-2 text-sm text-[#364649] font-bold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#364649]/40">: 1</span>
                        </div>
                    ) : (
                        <div className="bg-gray-100 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span className="text-sm font-bold text-[#364649]">{captationRatio.toFixed(1)} : 1</span>
                            {!isSufficientData && (
                                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                    <AlertCircle size={10} /> Datos insuficientes
                                </span>
                            )}
                            {isSufficientData && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Histórico Real
                                </span>
                            )}
                        </div>
                    )}

                    {!isSufficientData && !isManualRatio && (
                        <p className="text-[9px] text-amber-600 mt-1 leading-tight">
                            Se recomienda usar 'Manual' hasta tener 4 meses de data y 5 captaciones.
                        </p>
                    )}
                </div>

                {/* 3. Results */}
                <div className="bg-[#364649] text-white rounded-xl p-4 shadow-inner">
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                        <span className="text-xs text-white/70 uppercase">Pre-Listings Totales</span>
                        <span className="text-xl font-bold text-white">{preListingsNeeded.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#AA895F] font-bold uppercase">Meta Semanal (PL)</span>
                        <span className="text-2xl font-black text-[#AA895F]">{weeklyPreListingsNeeded.toFixed(1)}</span>
                    </div>
                </div>

                {/* ALERTS */}
                {isGoalDesaligned && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mt-4 animate-pulse">
                        <div className="flex items-start gap-2 text-orange-700">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold leading-tight mb-1">¡Alerta de Coherencia!</p>
                                <p className="text-[10px] leading-tight opacity-90">
                                    Esta meta requiere más actividad (PL) de la que tu facturación proyecta como necesaria ({realCriticalNumber.toFixed(1)} total).
                                    Aumenta tu facturación objetivo o ajusta esta meta.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

