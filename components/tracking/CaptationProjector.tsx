import React, { useState, useEffect } from 'react';
import { Target, Calculator, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { DebouncedInput } from '../DebouncedInput';
import { differenceInWeeks, parseISO, isValid, parse, format } from 'date-fns';
import { calculateWeeks } from '../../utils/dateUtils';

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
    SegmentedToggle: any; // Helper passed from parent
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

function CaptationProjector({
    captationRatio,
    isSufficientData,
    goalQty,
    captationStartDate = new Date().toISOString().split('T')[0],
    captationEndDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    manualCaptationRatio,
    isManualRatio,
    onUpdate,
    realCriticalNumber,
    SegmentedToggle
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

    const weeksDuration = calculateWeeks(captationStartDate, captationEndDate);

    // Calculations
    const finalRatio = isManualRatio ? manualCaptationRatio : captationRatio;
    const preListingsNeeded = goalQty * finalRatio;
    const weeklyPreListingsNeeded = preListingsNeeded / weeksDuration;

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
            <h2 className="text-sm font-black flex items-center text-[#364649] uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
                <Target className="mr-3 text-[#AA895F]" size={18} /> Proyector de Captaciones
            </h2>

            <div className="space-y-6">
                {/* 1. Goal Settings (Quantity) */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-[#364649]/40 mb-2 tracking-widest">Meta Captaciones</label>
                    <div className="relative group">
                        <Calculator size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-[#AA895F]" />
                        <DebouncedInput
                            name="captationGoalQty"
                            value={goalQty}
                            onChange={handleInputUpdate}
                            className="w-full bg-[#364649]/5 border-2 border-transparent focus:bg-white focus:border-[#AA895F] rounded-xl pl-12 pr-4 py-3 text-[#364649] font-black text-xl transition-all shadow-inner"
                        />
                    </div>
                </div>

                {/* 2. Ratio Configuration */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-black uppercase text-[#364649]/40 tracking-widest">Ratio Conversión PL : C</label>
                        <SegmentedToggle
                            value={isManualRatio}
                            onChange={(val: boolean) => onUpdate('isManualCaptationRatio', val)}
                        />
                    </div>

                    <div className="relative">
                        <DebouncedInput
                            name="manualCaptationRatio"
                            value={isManualRatio ? manualCaptationRatio : captationRatio}
                            onChange={handleInputUpdate}
                            className={`w-full border-2 rounded-xl px-4 py-3 text-xl font-black transition-all ${isManualRatio ? 'bg-white border-[#AA895F] text-[#364649] shadow-sm' : 'bg-gray-100 border-transparent text-gray-500'}`}
                            disabled={!isManualRatio}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">: 1</span>
                    </div>

                    <div className="mt-1">
                        {!isManualRatio ? (
                            isSufficientData ? (
                                <span className="text-[9px] font-black uppercase text-emerald-600">HISTÓRICO REAL</span>
                            ) : (
                                <span className="text-[9px] font-black uppercase text-blue-600">ESTÁNDAR 2.5:1 (CARGA DATOS)</span>
                            )
                        ) : (
                            <span className="text-[9px] font-black uppercase text-amber-600">MANUAL</span>
                        )}
                    </div>
                </div>

                {/* 3. Date Range (DD/MM/YYYY Format) */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-[#364649]/40 mb-2 tracking-widest flex items-center gap-2">
                        <CalendarIcon size={12} className="text-[#AA895F]" /> Periodo de Campaña
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <span className="absolute left-3 -top-2 px-1 bg-white text-[8px] font-black text-[#364649]/30 uppercase tracking-tighter">Desde</span>
                            <input
                                type="text"
                                value={startDisplay}
                                onChange={(e) => setStartDisplay(e.target.value)}
                                onBlur={handleStartDateBlur}
                                placeholder="DD/MM/AAAA"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs text-[#364649] font-black focus:outline-none focus:border-[#AA895F] transition-all"
                            />
                        </div>
                        <div className="relative group">
                            <span className="absolute left-3 -top-2 px-1 bg-white text-[8px] font-black text-[#364649]/30 uppercase tracking-tighter">Hasta</span>
                            <input
                                type="text"
                                value={endDisplay}
                                onChange={(e) => setEndDisplay(e.target.value)}
                                onBlur={handleEndDateBlur}
                                placeholder="DD/MM/AAAA"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs text-[#364649] font-black focus:outline-none focus:border-[#AA895F] transition-all"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#AA895F] bg-[#AA895F]/5 px-3 py-1 rounded-full border border-[#AA895F]/10">
                            Duración: {weeksDuration} {weeksDuration === 1 ? 'Semana' : 'Semanas'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(CaptationProjector);
