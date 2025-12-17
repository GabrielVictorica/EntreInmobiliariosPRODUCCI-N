
import React, { useState } from 'react';
import { PropertyRecord, MarketingLog, MarketingMetrics } from '../../types';
import { X, Save, TrendingUp, BarChart3, Megaphone, Facebook, Instagram, MousePointer, Eye, MessageCircle, Info } from 'lucide-react';

interface MarketingModalProps {
    property: PropertyRecord;
    logs: MarketingLog[];
    onSave: (log: MarketingLog) => void;
    onClose: () => void;
}

const MarketingModal: React.FC<MarketingModalProps> = ({ property, logs, onSave, onClose }) => {
    const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');

    // Entry Form State
    const [marketplace, setMarketplace] = useState<MarketingMetrics>({ publications: 0, impressions: 0, clicks: 0, inquiries: 0 });
    const [social, setSocial] = useState<MarketingMetrics>({ publications: 0, impressions: 0, clicks: 0, inquiries: 0 });
    const [ads, setAds] = useState<MarketingMetrics>({ publications: 0, impressions: 0, clicks: 0, inquiries: 0 });

    // Funnel Calculations
    const totalImpressions = logs.reduce((acc, log) => acc + log.marketplace.impressions + log.social.impressions + log.ads.impressions, 0);
    const totalClicks = logs.reduce((acc, log) => acc + log.marketplace.clicks + log.social.clicks + log.ads.clicks, 0);
    const totalInquiries = logs.reduce((acc, log) => acc + log.marketplace.inquiries + log.social.inquiries + log.ads.inquiries, 0);

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
    const conversionRate = totalClicks > 0 ? ((totalInquiries / totalClicks) * 100).toFixed(2) : '0';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newLog: MarketingLog = {
            id: crypto.randomUUID(),
            propertyId: property.id,
            date: new Date().toISOString(),
            period: '14_days',
            marketplace: {
                publications: Number(marketplace.publications),
                impressions: Number(marketplace.impressions),
                clicks: Number(marketplace.clicks),
                inquiries: Number(marketplace.inquiries)
            },
            social: {
                publications: Number(social.publications),
                impressions: Number(social.impressions),
                clicks: Number(social.clicks),
                inquiries: Number(social.inquiries)
            },
            ads: {
                publications: Number(ads.publications),
                impressions: Number(ads.impressions),
                clicks: Number(ads.clicks),
                inquiries: Number(ads.inquiries)
            }
        };
        onSave(newLog);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-[#E0D8CC] rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-white/20">

                {/* Header */}
                <div className="bg-[#364649] p-6 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 size={24} className="text-[#AA895F]" /> Proyección de Ventas & Marketing
                        </h2>
                        <p className="text-white/60 text-sm mt-1">{property.address.street} {property.address.number} • {property.customId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-[#364649]/10 bg-white/50 shrink-0">
                    <button
                        onClick={() => setActiveTab('entry')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'entry' ? 'text-[#AA895F] border-b-4 border-[#AA895F] bg-white' : 'text-[#364649]/60 hover:text-[#364649] hover:bg-white/30'}`}
                    >
                        Carga Quincenal
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'history' ? 'text-[#AA895F] border-b-4 border-[#AA895F] bg-white' : 'text-[#364649]/60 hover:text-[#364649] hover:bg-white/30'}`}
                    >
                        Historial & Embudo
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">

                    {activeTab === 'entry' ? (
                        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-blue-800">
                                    Ingresa los datos acumulados de los <strong>últimos 14 días</strong>. Esta información es vital para calcular la efectividad de los canales y predecir el tiempo de venta.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* 1. Marketplace */}
                                <MetricGroup
                                    title="Marketplace"
                                    icon={<Megaphone size={20} />}
                                    color="text-purple-600"
                                    bgColor="bg-purple-50"
                                    data={marketplace}
                                    onChange={setMarketplace}
                                    labelPub="Publicaciones Activas"
                                />

                                {/* 2. Organic Social */}
                                <MetricGroup
                                    title="Redes (Orgánico)"
                                    icon={<div className="flex"><Facebook size={16} /><Instagram size={16} className="ml-1" /></div>}
                                    color="text-pink-600"
                                    bgColor="bg-pink-50"
                                    data={social}
                                    onChange={setSocial}
                                    labelPub="Posteos / Reels"
                                />

                                {/* 3. Meta Ads */}
                                <MetricGroup
                                    title="Meta Ads (Pago)"
                                    icon={<TrendingUp size={20} />}
                                    color="text-blue-600"
                                    bgColor="bg-blue-50"
                                    data={ads}
                                    onChange={setAds}
                                    labelPub="Anuncios Activos"
                                />
                            </div>

                            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-[#364649]/10 flex justify-end gap-4 rounded-b-3xl">
                                <button type="button" onClick={onClose} className="px-6 py-2 text-[#364649]/60 font-bold hover:text-[#364649]">Cancelar</button>
                                <button type="submit" className="bg-[#364649] text-white px-8 py-2 rounded-xl hover:bg-[#2A3638] flex items-center font-bold shadow-lg shadow-[#364649]/20 transition-transform hover:-translate-y-1">
                                    <Save className="mr-2" size={18} /> Guardar Métricas
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-8 animate-fade-in-up">

                            {/* FUNNEL SUMMARY */}
                            <div>
                                <h3 className="text-lg font-bold text-[#364649] mb-4 flex items-center">
                                    <TrendingUp className="mr-2 text-[#AA895F]" /> Embudo de Ventas (Histórico)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Stage 1 */}
                                    <FunnelCard
                                        label="Total Impresiones"
                                        value={totalImpressions}
                                        icon={<Eye size={24} />}
                                        color="bg-blue-500"
                                        subtext="Alcance Total"
                                    />

                                    {/* Arrow */}
                                    <div className="hidden md:flex flex-col items-center justify-center -mx-3 z-10">
                                        <div className="bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-[#364649] border border-[#364649]/10">
                                            CTR {ctr}%
                                        </div>
                                    </div>

                                    {/* Stage 2 */}
                                    <FunnelCard
                                        label="Total Clicks"
                                        value={totalClicks}
                                        icon={<MousePointer size={24} />}
                                        color="bg-purple-500"
                                        subtext="Interés Inicial"
                                    />

                                    {/* Arrow */}
                                    <div className="hidden md:flex flex-col items-center justify-center -mx-3 z-10">
                                        <div className="bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-[#364649] border border-[#364649]/10">
                                            Conv. {conversionRate}%
                                        </div>
                                    </div>

                                    {/* Stage 3 */}
                                    <FunnelCard
                                        label="Total Consultas"
                                        value={totalInquiries}
                                        icon={<MessageCircle size={24} />}
                                        color="bg-emerald-500"
                                        subtext="Prospectos Reales"
                                    />
                                </div>
                            </div>

                            {/* HISTORY TABLE */}
                            <div className="bg-white/60 border border-white rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-[#364649]/10 bg-white/40">
                                    <h4 className="font-bold text-[#364649] text-sm">Historial de Registros</h4>
                                </div>
                                {logs.length === 0 ? (
                                    <div className="p-10 text-center text-[#364649]/40 text-sm">No hay registros cargados aún.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-[#364649]/5 text-[#364649]/60 uppercase text-xs">
                                                    <th className="px-4 py-3">Fecha</th>
                                                    <th className="px-4 py-3 text-center">Marketplace (Pub/Imp/Click/Cons)</th>
                                                    <th className="px-4 py-3 text-center">Social (Pub/Imp/Click/Cons)</th>
                                                    <th className="px-4 py-3 text-center">Ads (Pub/Imp/Click/Cons)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#364649]/5">
                                                {logs.map(log => (
                                                    <tr key={log.id} className="hover:bg-white/50">
                                                        <td className="px-4 py-3 font-medium text-[#364649]">{new Date(log.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-center text-[#364649]/70">
                                                            {log.marketplace.publications} / {log.marketplace.impressions} / {log.marketplace.clicks} / <strong>{log.marketplace.inquiries}</strong>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[#364649]/70">
                                                            {log.social.publications} / {log.social.impressions} / {log.social.clicks} / <strong>{log.social.inquiries}</strong>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[#364649]/70">
                                                            {log.ads.publications} / {log.ads.impressions} / {log.ads.clicks} / <strong>{log.ads.inquiries}</strong>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// Sub-components
const MetricGroup = ({ title, icon, color, bgColor, data, onChange, labelPub }: any) => {
    const handleChange = (field: keyof MarketingMetrics, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="bg-white/60 border border-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`flex items-center gap-2 font-bold mb-4 uppercase text-xs tracking-wider ${color}`}>
                <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
                {title}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{labelPub}</label>
                    <input type="number" min="0" value={data.publications} onChange={e => handleChange('publications', e.target.value)} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#AA895F]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Impresiones</label>
                        <input type="number" min="0" value={data.impressions} onChange={e => handleChange('impressions', e.target.value)} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#AA895F]" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Clicks</label>
                        <input type="number" min="0" value={data.clicks} onChange={e => handleChange('clicks', e.target.value)} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#AA895F]" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1 text-emerald-600">Consultas Generadas</label>
                    <input type="number" min="0" value={data.inquiries} onChange={e => handleChange('inquiries', e.target.value)} className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm font-bold text-emerald-800 outline-none focus:border-emerald-500" />
                </div>
            </div>
        </div>
    );
};

const FunnelCard = ({ label, value, icon, color, subtext }: any) => (
    <div className="bg-white border border-[#364649]/5 rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className={`absolute right-0 top-0 bottom-0 w-2 ${color} opacity-80`}></div>
        <div>
            <p className="text-[#364649]/50 text-xs font-bold uppercase mb-1">{label}</p>
            <p className="text-3xl font-bold text-[#364649]">{value.toLocaleString()}</p>
            <p className="text-[#364649]/40 text-[10px] mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-full ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
    </div>
);

export default MarketingModal;
