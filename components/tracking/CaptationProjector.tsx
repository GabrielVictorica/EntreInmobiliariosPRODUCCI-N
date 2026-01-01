import React, { useState, useEffect } from 'react';
import { Target, Calculator, AlertCircle, CheckCircle2, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { DebouncedInput } from '../DebouncedInput';
import { differenceInWeeks, parseISO, isValid, parse, format } from 'date-fns';

interface CaptationProjectorProps {
    captationRatio: number;
    isSufficientData: boolean;
    goalQty: number;
    goalPeriod?: 'month' | 'quarter';
    captationStartDate?: string;
    captationEndDate?: string;
    manualCaptationRatio: number;
    isManualRatio: boolean;
    onUpdate: (key: string, value: any) => void;
    realCriticalNumber: number;
}

// Helper: ISO (YYYY-MM-DD) -> Display (DD/MM/YYYY)
const formatToDisplay = (isoDate: string): string => {
    try {
        const date = parseISO(isoDate);
        if (!isValid(date)) return '';
        return format(date, 'dd/MM/yyyy');
    } catch {
        return '';
    }
};

// Helper: Display (DD/MM/YYYY) -> ISO (YYYY-MM-DD)
const parseFromDisplay = (displayDate: string): string | null => {
    try {
        const date = parse(displayDate, 'dd/MM/yyyy', new Date());
        if (!isValid(date)) return null;
        return format(date, 'yyyy-MM-dd');
    } catch {
        return null;
    }
};

export default function CaptationProjector({
    captationRatio,
    isSufficientData,
    goalQty,
    captationStartDate = new Date().toISOString().split('T')[0],
    captationEndDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    manualCaptationRatio,
    isManualRatio,
    onUpdate,
    realCriticalNumber
}: CaptationProjectorProps) {

    // Local display state for date inputs
    const [startDisplay, setStartDisplay] = useState(formatToDisplay(captationStartDate));
    const [endDisplay, setEndDisplay] = useState(formatToDisplay(captationEndDate));

    // Sync display state when props change
    useEffect(() => {
        setStartDisplay(formatToDisplay(captationStartDate));
    }, [captationStartDate]);

    useEffect(() => {
        setEndDisplay(formatToDisplay(captationEndDate));
    }, [captationEndDate]);

    // Helper to calculate weeks
    const calculateWeeks = (start: string, end: string) => {
        try {
            const startDate = parseISO(start);
            const endDate = parseISO(end);
            if (!isValid(startDate) || !isValid(endDate)) return 4;
            const diff = differenceInWeeks(endDate, startDate);
            return Math.max(diff, 1);
        } catch (e) {
            return 4;
        }
    };

    const weeksDuration = calculateWeeks(captationStartDate, captationEndDate);

    // Calculations
    const finalRatio = isManualRatio ? manualCaptationRatio : captationRatio;
    const preListingsNeeded = goalQty * finalRatio;
    const weeklyPreListingsNeeded = preListingsNeeded / weeksDuration;
    const isGoalDesaligned = weeklyPreListingsNeeded > realCriticalNumber;

    const handleInputUpdate = (val: number, name?: string) => {
        if (name) onUpdate(name, val);
    };

    // Date handlers with format conversion
    const handleStartDateBlur = () => {
        const isoDate = parseFromDisplay(startDisplay);
        if (isoDate) {
            onUpdate('captationStartDate', isoDate);
        } else {
            setStartDisplay(formatToDisplay(captationStartDate)); // Reset to valid
        }
    };

    const handleEndDateBlur = () => {
        const isoDate = parseFromDisplay(endDisplay);
        if (isoDate) {
            onUpdate('captationEndDate', isoDate);
        } else {
            setEndDisplay(formatToDisplay(captationEndDate)); // Reset to valid
        }
    };

    return (
        <div className="bg-white border border-[#364649]/10 rounded-3xl p-6 shadow-xl relative overflow-hidden h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center text-[#364649]">
                <Target className="mr-2" size={20} /> Proyector de Captaciones
            </h2>

            <div className="space-y-5">
                {/* 1. Goal Settings (Quantity) */}
                <div>
                    <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-1">Meta Captaciones</label>
                    <div className="relative">
                        <DebouncedInput
                            name="captationGoalQty"
                            value={goalQty}
                            onChange={handleInputUpdate}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#364649] font-bold"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#364649]/40">Props</span>
                    </div>
                </div>

                {/* 2. Date Range (DD/MM/YYYY Format) */}
                <div>
                    <label className="block text-[10px] font-bold uppercase text-[#364649]/50 mb-2 flex items-center gap-1">
                        <CalendarIcon size={12} /> Periodo de Campaña
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="block text-[9px] text-[#364649]/40 mb-1">Desde</span>
                            <input
                                type="text"
                                value={startDisplay}
                                onChange={(e) => setStartDisplay(e.target.value)}
                                onBlur={handleStartDateBlur}
                                placeholder="DD/MM/AAAA"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#364649] font-medium focus:outline-none focus:border-[#AA895F]"
                            />
                        </div>
                        <div>
                            <span className="block text-[9px] text-[#364649]/40 mb-1">Hasta</span>
                            <input
                                type="text"
                                value={endDisplay}
                                onChange={(e) => setEndDisplay(e.target.value)}
                                onBlur={handleEndDateBlur}
                                placeholder="DD/MM/AAAA"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#364649] font-medium focus:outline-none focus:border-[#AA895F]"
                            />
                        </div>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] uppercase font-bold text-[#AA895F] bg-[#AA895F]/10 px-2 py-1 rounded-full">
                            {weeksDuration} {weeksDuration === 1 ? 'Semana' : 'Semanas'}
                        </span>
                    </div>
                </div>

                {/* 3. Ratio Configuration */}
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
                                name="manualCaptationRatio"
                                value={manualCaptationRatio}
                                onChange={handleInputUpdate}
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

                {/* 4. Results Removed - Managed by Parent */}

            </div>
        </div>
    );
}
