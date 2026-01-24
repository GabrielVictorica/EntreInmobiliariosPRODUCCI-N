import React, { useMemo } from 'react';
import {
    Lightbulb,
    Zap,
    Clock,
    AlertTriangle,
    TrendingUp,
    BrainCircuit,
    Lock
} from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';

export default function HabitInsights() {
    const getInsights = useHabitStore(s => s.getInsights);
    const getProMetrics = useHabitStore(s => s.getProMetrics);
    const getAnalysisSufficiency = useHabitStore(s => s.getAnalysisSufficiency);
    const analysisRange = useHabitStore(s => s.analysisRange);

    const insights = useMemo(() => getInsights(), [getInsights, analysisRange]);
    const proMetrics = useMemo(() => getProMetrics(), [getProMetrics, analysisRange]);
    const sufficiency = useMemo(() => getAnalysisSufficiency(), [getAnalysisSufficiency]);

    const goldenHourData = insights?.goldenHour;
    const vampireData = insights?.vampire;
    const kryptoniteData = insights?.kryptonite;

    const renderPlaceholder = (title: string, icon: React.ReactNode, reason: string) => (
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-2 text-slate-300">
                {icon}
            </div>
            <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1">{title}</h4>
            <p className="text-[10px] text-slate-400 max-w-[120px] leading-tight">
                {reason}
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Elite Performance Section (Pro Metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Life Investment (Time ROI) */}
                <div className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock size={80} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Clock size={18} />
                            </div>
                            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Inversión de Vida</h4>
                        </div>

                        {proMetrics ? (
                            <>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-black text-white">{proMetrics.timeROI.hours}h</span>
                                    <span className="text-xl font-bold text-slate-400">{proMetrics.timeROI.mins}m</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Tiempo total invertido en construir tu nueva realidad este periodo.
                                </p>
                            </>
                        ) : (
                            <div className="h-10 flex items-center text-slate-500 text-xs italic">Calculando inversión...</div>
                        )}
                    </div>
                </div>

                {/* 2. Growth Momentum */}
                <div className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <TrendingUp size={18} />
                            </div>
                            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Crecimiento</h4>
                        </div>

                        {proMetrics ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-3xl font-black ${proMetrics.momentum.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {proMetrics.momentum.isPositive ? '+' : ''}{proMetrics.momentum.value}%
                                    </span>
                                    {proMetrics.momentum.isPositive ? (
                                        <div className="bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <TrendingUp size={12} className="text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="bg-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 rotate-180">
                                            <TrendingUp size={12} className="text-rose-400" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Variación de tu tasa de éxito comparado con el periodo anterior.
                                </p>
                            </>
                        ) : (
                            <div className="h-10 flex items-center text-slate-500 text-xs italic">Analizando tendencia...</div>
                        )}
                    </div>
                </div>

                {/* 3. Cognitive Focus Index */}
                <div className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap size={80} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                <Zap size={18} />
                            </div>
                            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Eficacia Cognitiva</h4>
                        </div>

                        {proMetrics?.focusIndex !== null ? (
                            <>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-black text-white">{proMetrics?.focusIndex}%</span>
                                    <span className="text-xs font-bold text-amber-400 ml-1">Focus</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Hábitos complejos completados en tus picos de energía biológica.
                                </p>
                            </>
                        ) : (
                            <div className="h-10 flex items-center text-slate-500 text-xs italic">Esperando picos de energía...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Smart Insights Section (Classic Algorithm Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Golden Hour */}
                {goldenHourData ? (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-orange-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Clock size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white rounded-lg text-orange-500 shadow-sm">
                                        <Clock size={16} />
                                    </div>
                                    <h4 className="font-bold text-[#364649] text-xs uppercase tracking-wider">Hora Dorada</h4>
                                </div>
                                <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                    {goldenHourData.biotype} {goldenHourData.biotypeIcon}
                                </span>
                            </div>

                            <p className="text-xl font-black text-[#364649] mb-1">{goldenHourData.hour}</p>
                            <p className="text-[11px] text-slate-600 leading-tight mb-3">
                                Tu mayor enfoque es por la **{goldenHourData.period}**. Aprovecha este pico de claridad.
                            </p>

                            <div className="p-2 bg-white/60 rounded-xl border border-orange-100/50">
                                <p className="text-[10px] text-orange-800 leading-relaxed font-medium">
                                    Ideal para: Trabajo profundo, decisiones y tareas complejas.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    renderPlaceholder("Hora Dorada", <Clock size={20} />, sufficiency.msg)
                )}

                {/* Card 2: Energy Vampire */}
                {vampireData ? (
                    <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-4 border border-rose-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Zap size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white rounded-lg text-rose-500 shadow-sm">
                                        <Zap size={16} />
                                    </div>
                                    <h4 className="font-bold text-[#364649] text-xs uppercase tracking-wider">Vampiro de Energía</h4>
                                </div>
                                <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                                    {vampireData.correlation}% Correlación
                                </span>
                            </div>

                            <p className="text-xl font-black text-[#364649] mb-1 truncate">{vampireData.name}</p>

                            <p className="text-[11px] text-slate-600 leading-tight mb-3">
                                Detectamos baja energía cuando realizas este hábito. ¿Te agota o lo haces cuando ya estás cansado?
                            </p>

                            <div className="p-2.5 bg-white/60 rounded-xl border border-rose-100/50">
                                <p className="text-[10px] text-rose-800 leading-relaxed">
                                    <strong>Estrategia:</strong> Intenta acortar este hábito o moverlo a un bloque de energía más alto.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    renderPlaceholder("Vampiro de Energía", <Zap size={20} />, sufficiency.msg)
                )}

                {/* Card 3: Kryptonite */}
                {kryptoniteData ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <AlertTriangle size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white rounded-lg text-indigo-500 shadow-sm">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <h4 className="font-bold text-[#364649] text-xs uppercase tracking-wider">Día Kriptonita</h4>
                                </div>
                                <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                    {kryptoniteData.rate}% Éxito
                                </span>
                            </div>

                            <p className="text-xl font-black text-[#364649] mb-1">{kryptoniteData.name}</p>

                            <p className="text-[11px] text-slate-600 leading-tight mb-3">
                                Tu rendimiento cae un **{kryptoniteData.gap}%** respecto a tu promedio semanal.
                            </p>

                            <div className="p-2.5 bg-white/60 rounded-xl border border-indigo-100/50">
                                <p className="text-[10px] text-indigo-800 leading-relaxed">
                                    <strong>Estrategia:</strong> Protege este día. Reduce compromisos externos y prioriza lo esencial para no romper rachas.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    renderPlaceholder("Día Kriptonita", <AlertTriangle size={20} />, sufficiency.msg)
                )}

            </div>

            {/* Elite Performance Section */}
            {proMetrics && (
                <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-xl font-black text-[#364649] mb-4 flex items-center gap-2">
                        <TrendingUp className="text-[#364649]" /> Métricas de Alto Rendimiento
                    </h3>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Elite Card 1: Time ROI */}
                        <div className="bg-gradient-to-br from-[#364649] to-[#1a2325] text-white rounded-2xl p-5 border border-[#364649] shadow-xl relative overflow-hidden group">
                            <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Clock size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                        <TrendingUp size={16} className="text-[#AA895F]" />
                                    </div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#AA895F]">Inversión de Vida</h4>
                                </div>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-black tracking-tighter">{proMetrics.timeROI.hours}h</span>
                                    <span className="text-xl font-bold opacity-70">{proMetrics.timeROI.mins}m</span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-snug mb-4">
                                    Es el tiempo total que has "comprado" para tu futuro este mes mediante hábitos productivos.
                                </p>
                                <div className="text-[10px] bg-white/5 p-2 rounded-lg border border-white/10 italic text-slate-400">
                                    "Cada minuto aquí es un depósito en tu capital humano."
                                </div>
                            </div>
                        </div>

                        {/* Elite Card 2: Momentum */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
                                    <Zap size={16} />
                                </div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-xs">Momentum (Growth)</h4>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className={`text-4xl font-black tracking-tight ${proMetrics.momentum.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {proMetrics.momentum.isPositive ? '+' : ''}{proMetrics.momentum.value}%
                                </p>
                                <div className={`p-1 rounded-full ${proMetrics.momentum.isPositive ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                    <TrendingUp size={14} className={proMetrics.momentum.isPositive ? '' : 'rotate-180'} />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug mb-4">
                                {proMetrics.momentum.isPositive
                                    ? "Estás creciendo. Tu tasa de éxito es mayor que el mes pasado."
                                    : "¡Alerta de estancamiento! Tu consistencia está bajando respecto al mes previo."}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                                Comparativa vs. periodo anterior
                            </p>
                        </div>

                        {/* Elite Card 3: Focus Index */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200/50 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm">
                                    <BrainCircuit size={16} />
                                </div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Eficacia Cognitiva</h4>
                            </div>
                            {proMetrics.focusIndex !== null ? (
                                <>
                                    <p className="text-3xl font-black text-[#364649] mb-1">{proMetrics.focusIndex}%</p>
                                    <p className="text-[11px] text-slate-600 leading-tight mb-4">
                                        Mide si estás usando tus "mejores cartuchos" (días de alta energía) para tus "batallas más difíciles" (hábitos complejos).
                                    </p>
                                    <div className="p-2.5 bg-indigo-200/20 rounded-xl border border-indigo-200/30">
                                        <p className="text-[10px] text-indigo-900 leading-relaxed italic">
                                            {proMetrics.focusIndex > 70
                                                ? "¡Excelente Estratega! Estás optimizando tu biología al máximo."
                                                : "Tip: Intenta mover tus hábitos de Alta Carga a tus picos de energía."}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-[11px] text-slate-500 italic mt-4">Calculando alineación cognitiva...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
