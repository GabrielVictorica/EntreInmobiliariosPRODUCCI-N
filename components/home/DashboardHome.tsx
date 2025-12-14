
import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, Users, Home, CheckCircle, ArrowUpRight,
    MoreHorizontal, ArrowDownRight, Filter, Megaphone, Link as LinkIcon,
    Clock, MessageCircle, Target, Star, Search, ChevronDown, Check, Building2
} from 'lucide-react';
import { ClientRecord, PropertyRecord, VisitRecord, MarketingLog, BuyerClientRecord } from '../../types';

interface DashboardHomeProps {
    clients: ClientRecord[];
    properties: PropertyRecord[];
    visits: VisitRecord[];
    marketingLogs: MarketingLog[];
    buyers: BuyerClientRecord[];
}

// --- COMPONENTS ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#364649] text-white text-xs p-3 rounded-lg shadow-xl border border-white/10">
                <p className="font-bold mb-1">{label ? label : payload[0].name}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color || entry.fill }}>
                        {entry.name}: <span className="font-bold ml-1">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const KpiCard = ({ title, value, subtext, trend, icon, color, activeColor }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
        {activeColor && <div className={`absolute top-0 left-0 w-1 h-full ${activeColor}`}></div>}
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
        </div>
        <div className="flex items-center text-xs font-medium">
            {trend !== undefined && (
                trend > 0 ? (
                    <span className="text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full mr-2">
                        <ArrowUpRight size={12} className="mr-1" /> +{trend}%
                    </span>
                ) : (
                    <span className="text-slate-400 flex items-center bg-slate-50 px-2 py-0.5 rounded-full mr-2">
                        {trend === 0 ? '-' : <><ArrowDownRight size={12} className="mr-1" /> {trend}%</>}
                    </span>
                )
            )}
            <span className="text-slate-400 truncate">{subtext}</span>
        </div>
    </div>
);

const DashboardHome: React.FC<DashboardHomeProps> = ({ clients, properties, visits, marketingLogs, buyers }) => {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');

    // Custom Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterSearch, setFilterSearch] = useState('');

    const isGlobal = selectedPropertyId === 'all';

    // --- 1. FILTERING DATA ---

    // Filter Options Logic
    const filteredOptions = useMemo(() => {
        const term = filterSearch.toLowerCase();
        // SAFEGUARD: Ensure properties exist and have required fields
        if (!properties || !Array.isArray(properties)) return [];

        return properties.filter(p => {
            try {
                const street = p?.address?.street?.toLowerCase() || '';
                const hood = p?.address?.neighborhood?.toLowerCase() || '';
                const cid = p?.customId?.toLowerCase() || '';
                return street.includes(term) || hood.includes(term) || cid.includes(term);
            } catch (e) {
                console.warn("Error filtering property:", p, e);
                return false;
            }
        });
    }, [properties, filterSearch]);

    const handleSelectProperty = (id: string) => {
        setSelectedPropertyId(id);
        setIsFilterOpen(false);
        setFilterSearch('');
    };

    const getSelectedLabel = () => {
        if (selectedPropertyId === 'all') return 'Global (Toda la cartera)';
        const p = properties.find(i => i.id === selectedPropertyId);
        return p ? `${p.address.street} ${p.address.number}` : 'Seleccionar Propiedad...';
    };

    // KPI Data Filtering
    const filteredLogs = useMemo(() => {
        if (isGlobal) return marketingLogs;
        return marketingLogs.filter(l => l.propertyId === selectedPropertyId);
    }, [marketingLogs, selectedPropertyId, isGlobal]);

    const filteredVisits = useMemo(() => {
        if (isGlobal) return visits;
        return visits.filter(v => v.propertyId === selectedPropertyId);
    }, [visits, selectedPropertyId, isGlobal]);

    const filteredProperties = useMemo(() => {
        if (isGlobal) return properties;
        return properties.filter(p => p.id === selectedPropertyId);
    }, [properties, selectedPropertyId, isGlobal]);

    // --- 2. CALCULATE KPIS (DYNAMIC LOGIC) ---

    // COMMON METRICS
    const totalSales = filteredProperties.filter(p => p.status === 'vendida').length;
    const visitCount = filteredVisits.length;
    const totalInquiries = filteredLogs.reduce((acc, l) => acc + l.marketplace.inquiries + l.social.inquiries + l.ads.inquiries, 0);

    // LOGIC SWITCHER (SAFEGUARDED)
    const kpis = useMemo(() => {
        try {
            if (isGlobal) {
                // --- GLOBAL METRICS ---
                const activeProps = filteredProperties.filter(p => p?.status === 'disponible').length;

                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const newBuyers = (buyers || []).filter(b => {
                    if (!b?.createdAt) return false;
                    const d = new Date(b.createdAt);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                }).length;

                const now = new Date();
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const weeklyVisits = (filteredVisits || []).filter(v => v?.date && new Date(v.date) >= startOfWeek).length;

                const closingRate = visitCount > 0 ? ((totalSales / visitCount) * 100).toFixed(1) : "0.0";

                return [
                    { title: "Propiedades Activas", value: activeProps, sub: "Cartera Total", icon: <Home size={20} />, color: "bg-[#364649]", active: "bg-[#364649]" },
                    { title: "Nuevos Compradores", value: newBuyers, sub: "Este Mes", icon: <Users size={20} />, color: "bg-[#AA895F]", active: "bg-[#AA895F]", trend: 10 },
                    { title: "Visitas Semanales", value: weeklyVisits, sub: "Últimos 7 días", icon: <CheckCircle size={20} />, color: "bg-[#708F96]", active: "bg-[#708F96]", trend: weeklyVisits > 0 ? 5 : 0 },
                    { title: "Tasa de Cierre", value: `${closingRate}%`, sub: "Ventas / Visitas", icon: <TrendingUp size={20} />, color: "bg-emerald-500", active: "bg-emerald-500", trend: Number(closingRate) > 1 ? 2 : 0 }
                ];
            } else {
                // --- SINGLE PROPERTY METRICS ---
                const prop = filteredProperties[0];
                if (!prop) {
                    return [
                        { title: "Error", value: 0, sub: "No Property", icon: <Home size={20} />, color: "bg-red-500", active: "bg-red-500" }
                    ];
                }

                // Days on Market
                const created = new Date(prop.createdAt || new Date());
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - created.getTime());
                const daysOnMarket = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Conversion (Inquiries -> Visits)
                const conversionRate = totalInquiries > 0 ? ((visitCount / totalInquiries) * 100).toFixed(1) : "0.0";

                return [
                    { title: "Días en Mercado", value: daysOnMarket, sub: `Desde ${created.toLocaleDateString()}`, icon: <Clock size={20} />, color: "bg-[#364649]", active: "bg-[#364649]" },
                    { title: "Consultas Totales", value: totalInquiries, sub: "Acumulado Mkt.", icon: <MessageCircle size={20} />, color: "bg-[#AA895F]", active: "bg-[#AA895F]", trend: totalInquiries > 10 ? 15 : 0 },
                    { title: "Visitas Realizadas", value: visitCount, sub: "Interesados físicos", icon: <CheckCircle size={20} />, color: "bg-[#708F96]", active: "bg-[#708F96]" },
                    { title: "Efectividad Mkt", value: `${conversionRate}%`, sub: "Consultas a Visitas", icon: <Target size={20} />, color: "bg-emerald-500", active: "bg-emerald-500", trend: Number(conversionRate) > 5 ? 5 : -2 }
                ];
            }
        } catch (err) {
            console.error("Error calculating KPIs:", err);
            return [];
        }
    }, [isGlobal, filteredProperties, buyers, filteredVisits, visitCount, totalSales, totalInquiries]);


    // --- 3. CHART DATA ---

    // Funnel Data
    const funnelStats = useMemo(() => {
        const imps = filteredLogs.reduce((acc, l) => acc + l.marketplace.impressions + l.social.impressions + l.ads.impressions, 0);
        const clicks = filteredLogs.reduce((acc, l) => acc + l.marketplace.clicks + l.social.clicks + l.ads.clicks, 0);
        // Inquiries & Visits calculated above
        const offers = filteredVisits.filter(v => v.nextSteps?.action === 'ofertar').length;

        return [
            { name: 'Impresiones', value: imps, fill: '#3b82f6' },
            { name: 'Clicks', value: clicks, fill: '#6366f1' },
            { name: 'Consultas', value: totalInquiries, fill: '#8b5cf6' },
            { name: 'Visitas', value: visitCount, fill: '#d946ef' },
            { name: 'Ofertas', value: offers, fill: '#f43f5e' },
            { name: 'Ventas', value: totalSales, fill: '#AA895F' }
        ];
    }, [filteredLogs, filteredVisits, totalInquiries, visitCount, totalSales]);

    // Secondary Chart Logic (Pie vs Feedback)
    const secondaryChartData = useMemo(() => {
        if (isGlobal) {
            // Global: Inventory Composition
            const counts: Record<string, number> = {};
            filteredProperties.forEach(p => {
                const type = p.type.charAt(0).toUpperCase() + p.type.slice(1);
                counts[type] = (counts[type] || 0) + 1;
            });
            const colors = ['#364649', '#AA895F', '#708F96', '#94a3b8', '#cbd5e1', '#64748b'];
            return Object.keys(counts).map((key, i) => ({
                name: key, value: counts[key], color: colors[i % colors.length]
            }));
        } else {
            // Single: Feedback Ratings (1-5 Stars)
            const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            filteredVisits.forEach(v => {
                if (v.feedback?.rating) {
                    // @ts-ignore
                    counts[v.feedback.rating] = (counts[v.feedback.rating] || 0) + 1;
                }
            });
            // Colors from Red to Green
            const ratingColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
            return Object.keys(counts).map((key, i) => ({
                name: `${key} Estrellas`, value: counts[key as any], color: ratingColors[i]
            }));
        }
    }, [isGlobal, filteredProperties, filteredVisits]);

    // Marketing Channels Breakdown
    const channelStats = useMemo(() => {
        const initial = {
            marketplace: { imp: 0, click: 0, inq: 0 },
            social: { imp: 0, click: 0, inq: 0 },
            ads: { imp: 0, click: 0, inq: 0 }
        };
        return filteredLogs.reduce((acc, l) => {
            acc.marketplace.imp += l.marketplace.impressions;
            acc.marketplace.click += l.marketplace.clicks;
            acc.marketplace.inq += l.marketplace.inquiries;

            acc.social.imp += l.social.impressions;
            acc.social.click += l.social.clicks;
            acc.social.inq += l.social.inquiries;

            acc.ads.imp += l.ads.impressions;
            acc.ads.click += l.ads.clicks;
            acc.ads.inq += l.ads.inquiries;
            return acc;
        }, initial);
    }, [filteredLogs]);

    // Visit Source Stats
    const sourceStats = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredVisits.forEach(v => {
            const src = v.source || 'otro';
            const label = src.charAt(0).toUpperCase() + src.slice(1);
            counts[label] = (counts[label] || 0) + 1;
        });

        const data = Object.keys(counts).map(key => {
            let color = '#708F96';
            const k = key.toLowerCase();
            if (k.includes('marketplace')) color = '#9333ea';
            else if (k.includes('social')) color = '#db2777';
            else if (k.includes('ads')) color = '#2563eb';
            else if (k.includes('cartel')) color = '#AA895F';

            return { name: key, value: counts[key], fill: color };
        }).sort((a, b) => b.value - a.value);

        return data;
    }, [filteredVisits]);

    return (
        <div className="space-y-8 pb-10">

            {/* 1. HEADER & FILTER */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Tablero de Control</h1>
                    <p className="text-[#364649]/60 text-sm font-medium mt-1">
                        {isGlobal ? 'Visión General del Negocio' : 'Análisis de Propiedad Individual'}
                    </p>
                </div>

                {/* CUSTOM SEARCHABLE DROPDOWN */}
                <div className="relative min-w-[320px] z-50">
                    {/* Overlay to close on click outside */}
                    {isFilterOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                    )}

                    {/* Trigger Button */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="w-full bg-white border border-slate-200 text-slate-700 pl-4 pr-10 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center justify-between hover:border-[#AA895F] transition-all relative z-50 focus:outline-none focus:ring-2 focus:ring-[#AA895F]/30"
                    >
                        <div className="flex flex-col text-left truncate">
                            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider mb-0.5">Filtrar Vista</span>
                            <span className="truncate text-[#364649]">{getSelectedLabel()}</span>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 p-1 rounded-full">
                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    {/* Dropdown Panel */}
                    {isFilterOpen && (
                        <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up z-50">
                            {/* Search Input */}
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar calle, barrio, ID..."
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-[#AA895F] focus:ring-1 focus:ring-[#AA895F] transition-all"
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {/* Global Option */}
                                <button
                                    onClick={() => handleSelectProperty('all')}
                                    className={`w-full text-left px-4 py-3 flex items-center hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedPropertyId === 'all' ? 'bg-[#AA895F]/5' : ''}`}
                                >
                                    <div className={`p-2 rounded-lg mr-3 shadow-sm ${selectedPropertyId === 'all' ? 'bg-[#AA895F] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${selectedPropertyId === 'all' ? 'text-[#AA895F]' : 'text-[#364649]'}`}>Visión Global</p>
                                        <p className="text-[10px] text-slate-400">Todas las propiedades de la cartera</p>
                                    </div>
                                    {selectedPropertyId === 'all' && <Check size={16} className="ml-auto text-[#AA895F]" />}
                                </button>

                                {/* Filtered Properties */}
                                {filteredOptions.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center">
                                        <Search size={24} className="mb-2 opacity-20" />
                                        No se encontraron propiedades.
                                    </div>
                                ) : (
                                    filteredOptions.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectProperty(p.id)}
                                            className={`w-full text-left px-4 py-3 flex items-center hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group ${selectedPropertyId === p.id ? 'bg-[#AA895F]/5' : ''}`}
                                        >
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg mr-3 overflow-hidden shrink-0 border border-slate-200 group-hover:border-[#AA895F]/30 transition-colors">
                                                {p.files.photos[0] ? (
                                                    <img src={p.files.photos[0]} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><Home size={14} className="text-slate-300" /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <p className={`truncate text-sm font-bold ${selectedPropertyId === p.id ? 'text-[#AA895F]' : 'text-[#364649]'}`}>{p.address.street} {p.address.number}</p>
                                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 whitespace-nowrap ${p.status === 'disponible' ? 'bg-emerald-100 text-emerald-700' :
                                                        p.status === 'reservada' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {p.status.slice(0, 4)}.
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 truncate flex items-center">
                                                    {p.address.neighborhood} <span className="mx-1">•</span> {p.customId}
                                                </p>
                                            </div>
                                            {selectedPropertyId === p.id && <Check size={16} className="ml-auto text-[#AA895F] shrink-0 pl-2" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. KPI CARDS (Context Aware) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <KpiCard
                        key={idx}
                        title={kpi.title}
                        value={kpi.value}
                        subtext={kpi.sub}
                        trend={kpi.trend}
                        icon={kpi.icon}
                        color={kpi.color}
                        activeColor={kpi.active}
                    />
                ))}
            </div>

            {/* 3. MIDDLE ROW: CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* FUNNEL CHART */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-700 text-lg">Embudo de {isGlobal ? 'Ventas Integrado' : 'Conversión Propiedad'}</h3>
                        <button className="text-slate-400 hover:text-[#AA895F]"><MoreHorizontal size={20} /></button>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={funnelStats}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {funnelStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SECONDARY CHART: PIE (GLOBAL) OR RATINGS (SINGLE) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-700 text-lg">{isGlobal ? 'Inventario' : 'Satisfacción Visitas'}</h3>
                        {isGlobal ? <Home size={18} className="text-[#AA895F]" /> : <Star size={18} className="text-[#AA895F]" />}
                    </div>

                    <div className="flex-1 relative min-h-[250px]">
                        {secondaryChartData.length > 0 && secondaryChartData.some(d => d.value > 0) ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    {isGlobal ? (
                                        <PieChart>
                                            <Pie
                                                data={secondaryChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                                cornerRadius={4}
                                            >
                                                {secondaryChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    ) : (
                                        <BarChart data={secondaryChartData} layout="vertical" margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                                {secondaryChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>

                                {isGlobal && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-4xl font-bold text-slate-800">{filteredProperties.length}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                <p>Sin datos suficientes</p>
                                {!isGlobal && <p className="text-xs mt-1">(Requiere feedback de visitas)</p>}
                            </div>
                        )}
                    </div>

                    {isGlobal && (
                        <div className="flex justify-center gap-2 mt-2 flex-wrap">
                            {secondaryChartData.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex items-center text-[10px]">
                                    <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-slate-500 font-medium">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. VISITS SOURCE CHART & MARKETING CHANNELS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animationDelay: '0.25s' }}>

                {/* VISIT SOURCE CHART */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-[#364649] mb-6 flex items-center">
                        <LinkIcon className="mr-2 text-[#708F96]" size={20} /> Origen de {isGlobal ? 'Leads (Global)' : 'Interesados (Esta Propiedad)'}
                    </h3>
                    <div className="h-[250px] w-full">
                        {sourceStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sourceStats} layout="vertical" margin={{ top: 0, left: 20, right: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                        {sourceStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sin datos de origen.</div>
                        )}
                    </div>
                </div>

                {/* MARKETING CHANNELS DETAIL */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-[#364649] mb-6 flex items-center">
                        <Megaphone className="mr-2 text-[#AA895F]" size={20} /> Rendimiento Marketing {isGlobal ? '(Global)' : '(Específico)'}
                    </h3>
                    <div className="space-y-4">
                        <ChannelDetailSmall
                            name="Marketplace"
                            color="text-purple-600"
                            barColor="bg-purple-500"
                            stats={channelStats.marketplace}
                            totalImp={funnelStats[0].value}
                        />
                        <ChannelDetailSmall
                            name="Redes Sociales"
                            color="text-pink-600"
                            barColor="bg-pink-500"
                            stats={channelStats.social}
                            totalImp={funnelStats[0].value}
                        />
                        <ChannelDetailSmall
                            name="Meta Ads"
                            color="text-blue-600"
                            barColor="bg-blue-500"
                            stats={channelStats.ads}
                            totalImp={funnelStats[0].value}
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};

// Sub-component for Channel Stats (Small Version)
const ChannelDetailSmall = ({ name, color, barColor, stats, totalImp }: any) => {
    const percentImp = totalImp > 0 ? (stats.imp / totalImp) * 100 : 0;

    return (
        <div className="flex items-center gap-4">
            <div className="w-24 text-xs font-bold text-slate-600 truncate">{name}</div>
            <div className="flex-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percentImp}%` }}></div>
                </div>
            </div>
            <div className="text-xs text-slate-500 w-28 text-right">
                <span className="font-bold text-slate-700">{stats.inq}</span> Cons. <span className="text-slate-300">|</span> <span className="font-bold text-slate-700">{stats.click}</span> Clicks
            </div>
        </div>
    );
};

export default DashboardHome;
