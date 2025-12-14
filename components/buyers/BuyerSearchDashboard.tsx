
import React, { useState } from 'react';
import { BuyerSearchRecord, BuyerClientRecord } from '../../types';
import { Plus, Search, ChevronDown, Edit3, FileText, Clock, Wallet, CheckCircle, XCircle, AlertTriangle, Users, Copy, RefreshCw } from 'lucide-react';

interface BuyerSearchDashboardProps {
  searches: BuyerSearchRecord[];
  clients: BuyerClientRecord[];
  onNewSearch: () => void;
  onEditSearch: (id: string) => void;
}

const BuyerSearchDashboard: React.FC<BuyerSearchDashboardProps> = ({ searches, clients, onNewSearch, onEditSearch }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  
  const getClientName = (id: string) => {
    return clients.find(c => c.id === id)?.name || 'Desconocido';
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'activo': return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold uppercase border border-emerald-200">Activo</span>;
        case 'pausa': return <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold uppercase border border-gray-200">En Pausa</span>;
        case 'concretado': return <span className="px-2 py-1 rounded bg-[#AA895F]/20 text-[#AA895F] text-xs font-bold uppercase border border-[#AA895F]/30">Concretado</span>;
        case 'caido': return <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-bold uppercase border border-red-200">Caído</span>;
        default: return null;
    }
  };

  const renderBoolean = (val: boolean, label: string) => (
      <div className={`flex items-center text-xs ${val ? 'text-[#364649] font-bold' : 'text-[#364649]/40'}`}>
          {val ? <CheckCircle size={12} className="mr-1 text-[#708F96]" /> : <XCircle size={12} className="mr-1" />}
          {label}
      </div>
  );

  const handleCopyNURC = (e: React.MouseEvent, search: BuyerSearchRecord) => {
      e.stopPropagation();
      const clientName = getClientName(search.buyerClientId);
      const sp = search.searchProfile;
      const budgetText = sp.budget.max > 0 ? `${sp.budget.currency} ${sp.budget.max.toLocaleString()}` : 'A definir';
      
      const formatBool = (val: boolean, label: string) => val ? `• ${label}: SÍ` : '';
      
      const reqs = [
        formatBool(sp.exclusions.mustHaveGarage, 'Cochera'),
        formatBool(sp.exclusions.mustHaveOutdoor, 'Espacio Exterior'),
        formatBool(sp.exclusions.mortgageRequired, 'Apto Crédito'),
        formatBool(sp.exclusions.acceptsOffPlan, 'Acepta Pozo')
      ].filter(Boolean).join('\n   ');

      const conditions = [
        formatBool(sp.acceptsSwap, 'Acepta Permuta'),
        sp.salesCondition.needsToSell ? `• Venta Simultánea: SÍ` : ''
      ].filter(Boolean).join('\n   ');

      const text = `
BUSQUEDA ACTIVA (N.U.R.C.)
--------------------------
CLIENTE: ${clientName}
TIPO: ${sp.propertyTypes.map(t => t.toUpperCase()).join(', ')}
ZONAS: ${sp.zones.join(', ') || 'A definir'}

1. NECESIDAD
   • Mínimos: ${sp.minRequirements.bedrooms} Dorms | ${sp.minRequirements.totalSurface} m²
   ${reqs ? reqs : '• Sin excluyentes marcados.'}
   > Obs: ${sp.nurcNotes?.n || '-'}

2. URGENCIA
   • Plazo: ${sp.timeline.replace(/_/g, ' ').toUpperCase()}
   • Motivo: ${sp.trigger.replace(/_/g, ' ').toUpperCase()}
   > Obs: ${sp.nurcNotes?.u || '-'}

3. RECURSOS
   • Presupuesto: ${budgetText}
   • Pago: ${sp.paymentMethod.toUpperCase()}
   ${conditions ? conditions : ''}
   > Obs: ${sp.nurcNotes?.r || '-'}

4. CAPACIDAD
   • Decisores: ${sp.decisionMakers || 'Titular'}
   > Obs: ${sp.nurcNotes?.c || '-'}

5. AJUSTES (Feedback)
   ${sp.nurcNotes?.updates || 'Sin correcciones registradas.'}
      `.trim();

      navigator.clipboard.writeText(text);
      setCopiedId(search.id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Búsquedas Activas</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#364649]/60 text-sm font-medium">Demanda calificada</p>
            <span className="w-1 h-1 rounded-full bg-[#364649]/30"></span>
            <p className="text-[#364649]/40 text-sm font-medium">{searches.length} búsquedas</p>
          </div>
        </div>
        <button onClick={onNewSearch} className="btn-hover-effect bg-[#364649] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#364649]/30 flex items-center active:scale-95">
          <Plus className="mr-2" size={18} /> Nueva Búsqueda
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl overflow-hidden shadow-xl animate-fade-in-up">
        {searches.length === 0 ? (
          <div className="p-16 text-center">
             <div className="w-16 h-16 bg-[#364649]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#364649]/10">
               <Search className="text-[#364649]/40" size={24} />
             </div>
             <h3 className="text-[#364649] font-bold text-lg">No hay búsquedas activas</h3>
             <p className="text-[#364649]/60 text-sm mt-2">Crea una nueva búsqueda para tus clientes compradores.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6">
             {searches.map((search, index) => {
                 const isExpanded = expandedRow === search.id;
                 const clientName = getClientName(search.buyerClientId);
                 const sp = search.searchProfile;

                 return (
                 <div key={search.id} className="animate-slide-in-right" style={{ animationDelay: `${index * 0.05}s` }}>
                     <div 
                        className={`group bg-white/40 border border-white rounded-2xl p-5 hover:bg-white/80 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-white/80 shadow-lg ring-1 ring-[#364649]/5' : ''}`}
                        onClick={() => toggleRow(search.id)}
                     >
                        <div className="flex items-center min-w-[200px]">
                            <div className="w-12 h-12 rounded-full bg-[#364649] text-[#E0D8CC] flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                                {clientName.charAt(0)}
                            </div>
                            <div className="ml-4">
                                <h4 className="font-bold text-[#364649] text-lg group-hover:text-[#AA895F] transition-colors">{clientName}</h4>
                                <div className="mt-1">{getStatusBadge(search.status)}</div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-[#364649]/40 mb-1">Busca</span>
                                <span className="text-sm font-medium text-[#364649] truncate">
                                    {sp.propertyTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-[#364649]/40 mb-1">Presupuesto</span>
                                <span className="text-sm font-bold text-[#364649] flex items-center">
                                    {sp.budget.currency} {sp.budget.max.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-[#364649]/40 mb-1">Zonas</span>
                                <span className="text-sm font-medium text-[#364649] truncate max-w-[150px]">
                                    {sp.zones.join(', ') || 'Sin definir'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                             <button onClick={(e) => { e.stopPropagation(); onEditSearch(search.id); }} className="p-2 bg-white border border-[#364649]/10 rounded-full text-[#364649]/60 hover:text-[#AA895F] hover:shadow-md transition-all">
                                <Edit3 size={18} />
                             </button>
                             <button className={`p-2 hover:bg-[#364649]/10 rounded-full transition-all duration-300 text-[#364649]/50 ${isExpanded ? 'bg-[#364649]/10 rotate-180' : ''}`}>
                                <ChevronDown size={20} />
                             </button>
                        </div>
                     </div>

                     {isExpanded && (
                         <div className="mt-2 mx-2 bg-white/60 border border-white rounded-2xl p-6 shadow-inner animate-fade-in-up">
                            
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#364649]/10">
                                <h3 className="text-sm font-bold text-[#364649] uppercase tracking-widest">Perfil Completo N.U.R.C.</h3>
                                <button 
                                  onClick={(e) => handleCopyNURC(e, search)}
                                  className={`flex items-center text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm ${copiedId === search.id ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-[#364649] text-white hover:bg-[#2A3638] border border-transparent'}`}
                                >
                                  {copiedId === search.id ? <CheckCircle size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                                  {copiedId === search.id ? '¡Copiado!' : 'Copiar Perfil NURC'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                
                                {/* 1. NECESIDAD */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#708F96] uppercase flex items-center">
                                        <Search size={14} className="mr-2"/> 1. Necesidad
                                    </h4>
                                    <div className="bg-white/50 p-4 rounded-xl border border-[#708F96]/10 text-sm space-y-3 h-full">
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Tipología & Zona</span>
                                            <p className="font-medium text-[#364649]">{sp.propertyTypes.join(', ')}</p>
                                            <p className="text-[#364649]/80 text-xs">{sp.zones.join(', ')}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Mínimos</span>
                                            <p className="text-[#364649]/80 text-xs">
                                                {sp.minRequirements.bedrooms} Dorms • {sp.minRequirements.bathrooms} Baños • {sp.minRequirements.totalSurface} m²
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#364649]/5">
                                            {renderBoolean(sp.exclusions.mustHaveGarage, 'Cochera')}
                                            {renderBoolean(sp.exclusions.mustHaveOutdoor, 'Exterior')}
                                            {renderBoolean(sp.exclusions.mortgageRequired, 'Apto Créd.')}
                                            {renderBoolean(sp.exclusions.acceptsOffPlan, 'Pozo')}
                                        </div>
                                        {sp.nurcNotes?.n && (
                                            <div className="pt-2 text-xs italic text-[#364649]/70 border-t border-[#364649]/5 mt-2">
                                                "{sp.nurcNotes.n}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. URGENCIA */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#AA895F] uppercase flex items-center">
                                        <Clock size={14} className="mr-2"/> 2. Urgencia
                                    </h4>
                                    <div className="bg-white/50 p-4 rounded-xl border border-[#AA895F]/10 text-sm space-y-3 h-full">
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Horizonte Temporal</span>
                                            <p className="font-medium text-[#AA895F] capitalize">{sp.timeline.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Detonante / Motivo</span>
                                            <p className="text-[#364649] capitalize">{sp.trigger.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Disponibilidad Visitas</span>
                                            <p className="text-[#364649]/80 text-xs">{sp.availability || 'No especificada'}</p>
                                        </div>
                                        {sp.nurcNotes?.u && (
                                            <div className="pt-2 text-xs italic text-[#364649]/70 border-t border-[#364649]/5 mt-2">
                                                "{sp.nurcNotes.u}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. RECURSOS */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#364649] uppercase flex items-center">
                                        <Wallet size={14} className="mr-2"/> 3. Recursos
                                    </h4>
                                    <div className="bg-white/50 p-4 rounded-xl border border-[#364649]/10 text-sm space-y-3 h-full">
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Presupuesto Máximo</span>
                                            <p className="font-bold text-lg text-[#364649]">{sp.budget.currency} {sp.budget.max.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Forma de Pago</span>
                                            <p className="text-[#364649] capitalize">{sp.paymentMethod.replace('_', ' ')}</p>
                                        </div>
                                        <div className="pt-2 border-t border-[#364649]/5 space-y-1">
                                            {renderBoolean(sp.acceptsSwap, 'Acepta Permuta')}
                                            {sp.salesCondition.needsToSell && (
                                                <div className="flex items-center text-xs text-[#AA895F] font-bold mt-1 bg-[#AA895F]/10 px-2 py-1 rounded">
                                                    <AlertTriangle size={12} className="mr-1"/> Venta Simultánea
                                                </div>
                                            )}
                                        </div>
                                        {sp.nurcNotes?.r && (
                                            <div className="pt-2 text-xs italic text-[#364649]/70 border-t border-[#364649]/5 mt-2">
                                                "{sp.nurcNotes.r}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 4. CAPACIDAD */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#708F96] uppercase flex items-center">
                                        <Users size={14} className="mr-2"/> 4. Capacidad
                                    </h4>
                                    <div className="bg-white/50 p-4 rounded-xl border border-[#708F96]/10 text-sm space-y-3 h-full">
                                        <div>
                                            <span className="block text-[10px] uppercase text-[#364649]/50 font-bold">Decisores y Firmantes</span>
                                            <p className="text-[#364649] leading-relaxed">{sp.decisionMakers || 'No especificado'}</p>
                                        </div>
                                        {sp.nurcNotes?.c && (
                                            <div className="pt-2 text-xs italic text-[#364649]/70 border-t border-[#364649]/5 mt-2">
                                                "{sp.nurcNotes.c}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 5. AJUSTES (UPDATES) - THE 5TH SPACE (FULL WIDTH) */}
                                <div className="space-y-4 md:col-span-2 lg:col-span-4 mt-2">
                                    <h4 className="text-xs font-bold text-orange-700 uppercase flex items-center animate-pulse border-b border-orange-200 pb-2">
                                        <RefreshCw size={14} className="mr-2"/> 5. Ajustes y Correcciones (Aprendizajes de Visitas)
                                    </h4>
                                    <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-200 text-sm shadow-inner min-h-[100px]">
                                        {sp.nurcNotes?.updates ? (
                                            <p className="text-[#364649] text-xs whitespace-pre-line leading-relaxed">
                                                {sp.nurcNotes.updates}
                                            </p>
                                        ) : (
                                            <div className="text-[#364649]/40 text-xs italic flex items-center justify-center py-4 h-full">
                                                <RefreshCw size={18} className="mr-2 opacity-50"/>
                                                <span>Aún no se han registrado ajustes basados en feedback de visitas.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                         </div>
                     )}
                 </div>
                 );
             })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerSearchDashboard;
