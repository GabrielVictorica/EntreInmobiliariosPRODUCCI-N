
import React, { useState, useMemo } from 'react';
import { MarketingLog, PropertyRecord, VisitRecord } from '../../types';
import { 
  Filter, 
  Megaphone, 
  Facebook, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  MessageCircle, 
  Calendar,
  CheckCircle,
  Award
} from 'lucide-react';

interface MarketingDashboardProps {
  logs: MarketingLog[];
  properties: PropertyRecord[];
  visits: VisitRecord[];
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ logs, properties, visits }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');

  // --- Calculations ---
  
  // 1. Marketing Data (Top of Funnel)
  const filteredLogs = useMemo(() => {
    if (selectedPropertyId === 'all') return logs;
    return logs.filter(log => log.propertyId === selectedPropertyId);
  }, [logs, selectedPropertyId]);

  // 2. Visits Data (Middle of Funnel)
  const filteredVisits = useMemo(() => {
      if (selectedPropertyId === 'all') return visits;
      return visits.filter(v => v.propertyId === selectedPropertyId);
  }, [visits, selectedPropertyId]);

  // 3. Offers Data (Bottom of Funnel - Derived from Visits)
  const totalOffers = useMemo(() => {
      return filteredVisits.filter(v => v.nextSteps?.action === 'ofertar').length;
  }, [filteredVisits]);

  // 4. Sales Data (Closing - Derived from Property Status)
  const totalSales = useMemo(() => {
      if (selectedPropertyId === 'all') {
          return properties.filter(p => p.status === 'vendida').length;
      }
      const prop = properties.find(p => p.id === selectedPropertyId);
      return prop?.status === 'vendida' ? 1 : 0;
  }, [properties, selectedPropertyId]);


  const stats = useMemo(() => {
    const initial = {
        impressions: 0,
        clicks: 0,
        inquiries: 0,
        marketplace: { impressions: 0, clicks: 0, inquiries: 0, publications: 0 },
        social: { impressions: 0, clicks: 0, inquiries: 0, publications: 0 },
        ads: { impressions: 0, clicks: 0, inquiries: 0, publications: 0 }
    };

    return filteredLogs.reduce((acc, log) => {
        // Global
        acc.impressions += (log.marketplace.impressions + log.social.impressions + log.ads.impressions);
        acc.clicks += (log.marketplace.clicks + log.social.clicks + log.ads.clicks);
        acc.inquiries += (log.marketplace.inquiries + log.social.inquiries + log.ads.inquiries);

        // Channels
        acc.marketplace.impressions += log.marketplace.impressions;
        acc.marketplace.clicks += log.marketplace.clicks;
        acc.marketplace.inquiries += log.marketplace.inquiries;
        acc.marketplace.publications += log.marketplace.publications;

        acc.social.impressions += log.social.impressions;
        acc.social.clicks += log.social.clicks;
        acc.social.inquiries += log.social.inquiries;
        acc.social.publications += log.social.publications;

        acc.ads.impressions += log.ads.impressions;
        acc.ads.clicks += log.ads.clicks;
        acc.ads.inquiries += log.ads.inquiries;
        acc.ads.publications += log.ads.publications;

        return acc;
    }, initial);
  }, [filteredLogs]);

  // Funnel Data Array for Rendering
  const funnelData = [
      { id: 1, label: 'Impresiones', value: stats.impressions, color: 'bg-blue-500' },
      { id: 2, label: 'Clicks', value: stats.clicks, color: 'bg-purple-500' },
      { id: 3, label: 'Consultas', value: stats.inquiries, color: 'bg-indigo-500' },
      { id: 4, label: 'Visitas', value: filteredVisits.length, color: 'bg-emerald-500' },
      { id: 5, label: 'Ofertas', value: totalOffers, color: 'bg-amber-500' },
      { id: 6, label: 'Ventas', value: totalSales, color: 'bg-[#AA895F]' }
  ];

  // Max value for width calculation
  const maxFunnelValue = Math.max(stats.impressions, 1); // Avoid division by zero

  const getPropertyName = (id: string) => {
      const p = properties.find(p => p.id === id);
      return p ? `${p.address.street} ${p.address.number}` : 'Propiedad desconocida';
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. Header & Property Filter */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Analítica & Rendimiento</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#364649]/60 text-sm font-medium">Ciclo de vida completo</p>
            <span className="w-1 h-1 rounded-full bg-[#364649]/30"></span>
            <p className="text-[#364649]/40 text-sm font-medium">Marketing • Comercial • Cierre</p>
          </div>
        </div>
        
        <div className="relative group min-w-[280px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/50">
                <Filter size={16} />
            </div>
            <select 
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full bg-white/60 border border-white rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-[#364649] outline-none focus:ring-2 focus:ring-[#AA895F] shadow-lg shadow-[#364649]/5 cursor-pointer appearance-none"
            >
                <option value="all">Todas las Propiedades</option>
                {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.customId} - {p.address.street}</option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#364649]/40 text-xs">▼</div>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
          <MetricCard 
             label="Alcance Total" 
             value={stats.impressions} 
             sub={`CTR: ${stats.impressions > 0 ? ((stats.clicks / stats.impressions)*100).toFixed(2) : 0}%`}
             icon={<Eye size={20}/>}
             color="text-blue-600"
             bg="bg-blue-100"
          />
          <MetricCard 
             label="Prospectos (Leads)" 
             value={stats.inquiries} 
             sub={`${stats.inquiries > 0 ? ((filteredVisits.length / stats.inquiries)*100).toFixed(1) : 0}% a Visita`}
             icon={<MessageCircle size={20}/>}
             color="text-indigo-600"
             bg="bg-indigo-100"
          />
          <MetricCard 
             label="Visitas Realizadas" 
             value={filteredVisits.length} 
             sub={`${filteredVisits.length > 0 ? ((totalOffers / filteredVisits.length)*100).toFixed(1) : 0}% a Oferta`}
             icon={<Calendar size={20}/>}
             color="text-emerald-600"
             bg="bg-emerald-100"
          />
          <MetricCard 
             label="Cierres / Ventas" 
             value={totalSales} 
             sub={totalSales > 0 ? '¡Objetivo Cumplido!' : 'En proceso'}
             icon={<Award size={20}/>}
             color="text-[#AA895F]"
             bg="bg-[#AA895F]/20"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 3. VISUAL FUNNEL CHART */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-xl animate-fade-in-up min-h-[500px]" style={{animationDelay: '0.1s'}}>
              <h3 className="text-lg font-bold text-[#364649] mb-8 flex items-center">
                  <TrendingUp className="mr-2 text-[#AA895F]" size={20}/> Embudo de Ventas (Funnel)
              </h3>
              
              <div className="flex flex-col items-center space-y-2 w-full max-w-2xl mx-auto">
                  {funnelData.map((step, index) => {
                      // Calculate width percentage relative to max, but keep a min width for visibility
                      const widthPercent = Math.max((step.value / maxFunnelValue) * 100, 10); 
                      // For visual funnel effect, we can clamp the max width of lower steps based on the step above to enforce the visual "V" shape if strictly needed, 
                      // but typically showing real data bars centered looks cleaner.
                      
                      const prevValue = index > 0 ? funnelData[index - 1].value : 0;
                      const conversionRate = index > 0 && prevValue > 0 
                        ? ((step.value / prevValue) * 100).toFixed(1) + '%' 
                        : null;

                      return (
                          <div key={step.id} className="w-full flex flex-col items-center relative group">
                              {/* Conversion Badge between steps */}
                              {conversionRate && (
                                  <div className="text-[10px] font-bold text-[#364649]/40 bg-white/80 px-2 py-0.5 rounded-full border border-[#364649]/5 -my-2 z-10 shadow-sm relative">
                                      ↓ {conversionRate}
                                  </div>
                              )}

                              {/* Funnel Bar */}
                              <div 
                                  className={`h-12 rounded-lg flex items-center justify-between px-4 text-white shadow-lg transition-all duration-500 hover:scale-105 ${step.color} relative z-0`}
                                  style={{ width: `${widthPercent}%`, minWidth: '220px' }}
                              >
                                  <span className="font-bold text-sm uppercase tracking-wider text-white/90">{step.label}</span>
                                  <span className="font-bold text-lg bg-white/20 px-2 py-0.5 rounded text-white">{(step.value || 0).toLocaleString()}</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
              <p className="text-center text-xs text-[#364649]/40 mt-8 italic">
                  * Datos consolidados de marketing y gestión comercial (CRM).
              </p>
          </div>

          {/* 4. CHANNEL COMPARISON (BAR CHART) */}
          <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-xl animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <h3 className="text-lg font-bold text-[#364649] mb-6 flex items-center">
                  <Megaphone className="mr-2 text-[#708F96]" size={20}/> Efectividad por Canal
              </h3>
              
              <div className="space-y-6">
                  <ChannelRow 
                      name="Marketplace" 
                      color="bg-purple-500" 
                      textColor="text-purple-700"
                      metrics={stats.marketplace} 
                      totalImp={stats.impressions}
                  />
                  <ChannelRow 
                      name="Redes Sociales" 
                      color="bg-pink-500" 
                      textColor="text-pink-700"
                      metrics={stats.social} 
                      totalImp={stats.impressions}
                  />
                  <ChannelRow 
                      name="Meta Ads" 
                      color="bg-blue-500" 
                      textColor="text-blue-700"
                      metrics={stats.ads} 
                      totalImp={stats.impressions}
                  />
              </div>

              <div className="mt-8 bg-white/50 p-4 rounded-xl border border-[#364649]/5">
                  <h4 className="text-xs font-bold text-[#364649] uppercase mb-2">Resumen de Inversión</h4>
                  <div className="flex justify-between text-xs text-[#364649]/70 border-b border-[#364649]/5 pb-2 mb-2">
                      <span>Publicaciones Activas:</span>
                      <span className="font-bold">{(stats.marketplace.publications + stats.social.publications + stats.ads.publications) || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#364649]/70">
                      <span>Eficiencia (Clicks/Consulta):</span>
                      <span className="font-bold text-emerald-600">
                          {stats.inquiries > 0 ? (stats.clicks / stats.inquiries).toFixed(0) : 0} clicks
                      </span>
                  </div>
              </div>
          </div>
      </div>

      {/* 5. Detailed Logs Table (Auditoria) */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl overflow-hidden shadow-xl animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <div className="p-6 border-b border-[#364649]/5 flex justify-between items-center bg-white/40">
              <h3 className="text-lg font-bold text-[#364649]">Auditoría de Cargas (Marketing)</h3>
          </div>
          
          {filteredLogs.length === 0 ? (
              <div className="p-10 text-center text-[#364649]/40">No hay registros de marketing cargados.</div>
          ) : (
              <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                      <thead>
                          <tr className="bg-[#364649]/5 text-[#364649]/50 uppercase text-[10px] tracking-wider font-bold">
                              <th className="px-6 py-4">Fecha</th>
                              <th className="px-6 py-4">Propiedad</th>
                              <th className="px-6 py-4 text-center">Impresiones</th>
                              <th className="px-6 py-4 text-center">Clicks</th>
                              <th className="px-6 py-4 text-center">Consultas</th>
                              <th className="px-6 py-4 text-right">Canal Dominante</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#364649]/5">
                          {filteredLogs.map(log => {
                              const totalImp = log.marketplace.impressions + log.social.impressions + log.ads.impressions;
                              const totalClick = log.marketplace.clicks + log.social.clicks + log.ads.clicks;
                              const totalInq = log.marketplace.inquiries + log.social.inquiries + log.ads.inquiries;
                              
                              // Determine dominant channel based on Inquiries
                              let dominant = 'N/A';
                              let maxVal = -1;
                              if (log.marketplace.inquiries > maxVal) { maxVal = log.marketplace.inquiries; dominant = 'Marketplace'; }
                              if (log.social.inquiries > maxVal) { maxVal = log.social.inquiries; dominant = 'Social'; }
                              if (log.ads.inquiries > maxVal) { maxVal = log.ads.inquiries; dominant = 'Ads'; }

                              return (
                                  <tr key={log.id} className="hover:bg-white/50 transition-colors">
                                      <td className="px-6 py-4 font-bold text-[#364649]">{new Date(log.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 text-[#364649] text-xs">
                                          {getPropertyName(log.propertyId)}
                                      </td>
                                      <td className="px-6 py-4 text-center text-[#364649]">{totalImp.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-center text-[#364649]">{totalClick.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-center">
                                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">{totalInq}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right text-xs font-bold text-[#364649]/60">
                                          {totalInq > 0 ? dominant : '-'}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

    </div>
  );
};

// --- Sub-Components ---

const MetricCard = ({ label, value, sub, icon, color, bg }: any) => (
    <div className="bg-white/80 border border-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[#364649]/50 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-[#364649]">{(value || 0).toLocaleString()}</h3>
            </div>
            <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
                {icon}
            </div>
        </div>
        <p className={`text-xs font-bold mt-2 ${color} opacity-80`}>{sub}</p>
    </div>
);

const ChannelRow = ({ name, color, textColor, metrics, totalImp }: any) => {
    // Avoid NaN
    const safeMetrics = metrics || { impressions: 0, clicks: 0, inquiries: 0 };
    const percentImp = totalImp > 0 ? (safeMetrics.impressions / totalImp) * 100 : 0;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold ${textColor}`}>{name}</span>
                <span className="text-xs text-[#364649]/50">{(safeMetrics.impressions || 0).toLocaleString()} imp.</span>
            </div>
            {/* Visual Bar for Impressions Share */}
            <div className="h-2 w-full bg-[#364649]/5 rounded-full overflow-hidden mb-2">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${percentImp}%` }}></div>
            </div>
            {/* Detailed Stats */}
            <div className="flex justify-between text-[10px] text-[#364649]/60">
                <div>
                    <span className="font-bold text-[#364649]">{safeMetrics.clicks || 0}</span> Clicks
                </div>
                <div>
                    <span className="font-bold text-[#364649]">{safeMetrics.inquiries || 0}</span> Consultas
                </div>
                <div className="font-bold text-emerald-600">
                    {safeMetrics.clicks > 0 ? ((safeMetrics.inquiries/safeMetrics.clicks)*100).toFixed(1) : 0}% Conv.
                </div>
            </div>
        </div>
    );
};

export default MarketingDashboard;
