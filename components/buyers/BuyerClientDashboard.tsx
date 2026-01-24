import React, { useState, useMemo } from 'react';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';
import { BuyerClientRecord, BuyerSearchRecord } from '../../types';
import { Plus, Users, Edit3, Phone, Mail, Search as SearchIcon, ChevronDown, MapPin, Target, Wallet, Calendar, Copy, CheckCircle } from 'lucide-react';
import { DebouncedInput } from '../DebouncedInput';
import { DashboardHeader } from '../ui/DashboardHeader';

interface BuyerClientDashboardProps {
  onNewClient: () => void;
  onEditClient: (id: string) => void;
  onCreateSearch: (clientId: string) => void;
  onEditSearch: (id: string) => void;
}

const BuyerClientDashboard: React.FC<BuyerClientDashboardProps> = ({ onNewClient, onEditClient, onCreateSearch, onEditSearch }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { clients, searches, visits, properties, isLoading } = useBusinessStore(useShallow(state => ({
    clients: state.buyers,
    searches: state.searches,
    visits: state.visits,
    properties: state.properties,
    isLoading: state.isSystemInitializing
  })));

  // 1. Data Structure Optimization: O(1) Lookups
  const searchesByClientId = useMemo(() => {
    const map = new Map<string, typeof searches>();
    searches.forEach(s => {
      if (!map.has(s.buyerClientId)) map.set(s.buyerClientId, []);
      map.get(s.buyerClientId)!.push(s);
    });
    return map;
  }, [searches]);

  const visitsByClientId = useMemo(() => {
    const map = new Map<string, typeof visits>();
    visits.forEach(v => {
      if (!map.has(v.buyerClientId)) map.set(v.buyerClientId, []);
      map.get(v.buyerClientId)!.push(v);
    });
    return map;
  }, [visits]);

  // Internal Filtering
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const lowerQuery = searchQuery.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.dni.includes(lowerQuery)
    );
  }, [clients, searchQuery]);

  // 2. Progressive Rendering Slice
  const displayedClients = useMemo(() => {
    return filteredClients.slice(0, visibleCount);
  }, [filteredClients, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getPropertyAddress = (id: string) => {
    const p = properties.find(prop => prop.id === id);
    return p ? `${p.address.street} ${p.address.number}` : 'Propiedad desconocida';
  };

  const handleCopyNURC = (e: React.MouseEvent, client: BuyerClientRecord, search: BuyerSearchRecord) => {
    e.stopPropagation();

    const sp = search.searchProfile;
    const budgetText = sp.budget.max > 0 ? `${sp.budget.currency} ${sp.budget.max.toLocaleString()}` : 'A definir';

    const formatBool = (val: boolean, label: string) => val ? `• ${label}: SÍ` : '';

    const reqs = [
      formatBool(sp.exclusions.mustHaveGarage, 'Cochera'),
      formatBool(sp.exclusions.mustHaveOutdoor, 'Espacio Exterior'),
      formatBool(sp.exclusions.mortgageRequired, 'Apto Crédito'),
      formatBool(sp.exclusions.acceptsOffPlan, 'Acepta Pozo')
    ].filter(Boolean).join('\n   ');

    const text = `
BUSQUEDA ACTIVA (N.U.R.C.)
--------------------------
CLIENTE: ${client.name}
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
   ${sp.acceptsSwap ? '• Acepta Permuta: SÍ' : ''}
   ${sp.salesCondition.needsToSell ? '• Venta Simultánea: SÍ' : ''}
   > Obs: ${sp.nurcNotes?.r || '-'}

4. CAPACIDAD
   • Decisores: ${sp.decisionMakers || 'Titular'}
   > Obs: ${sp.nurcNotes?.c || '-'}
      `.trim();

    navigator.clipboard.writeText(text);
    setCopiedId(search.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-10">
      <DashboardHeader
        title="Mis Compradores"
        subtitle="Base de contactos"
        count={useMemo(() => ({
          value: filteredClients.length,
          label: "personas"
        }), [filteredClients.length])}
        searchProps={useMemo(() => ({
          placeholder: "Buscar por nombre, email o DNI...",
          value: searchQuery,
          onChange: setSearchQuery
        }), [searchQuery])}
        actionProps={useMemo(() => ({
          label: "Nuevo Cliente",
          onClick: onNewClient
        }), [onNewClient])}
      />

      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl overflow-hidden shadow-xl animate-fade-in-up">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#AA895F]/20 border-t-[#AA895F] rounded-full animate-spin mb-4"></div>
              <p className="text-[#364649]/60 font-medium">Cargando compradores...</p>
            </div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-[#364649]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#364649]/10">
              <Users className="text-[#364649]/40" size={24} />
            </div>
            <h3 className="text-[#364649] font-bold text-lg">No hay clientes encontrados</h3>
            <p className="text-[#364649]/60 text-sm mt-2">Intenta ajustar tu búsqueda o agrega un nuevo prospecto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#364649]/10 text-[#364649]/50 text-xs uppercase tracking-wider bg-white/20">
                  <th className="px-6 py-4 font-bold">Nombre</th>
                  <th className="px-6 py-4 font-bold">Perfil</th>
                  <th className="px-6 py-4 font-bold">Contacto</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#364649]/5">
                {displayedClients.map((c, i) => {
                  const isExpanded = expandedRow === c.id;
                  const clientSearches = searchesByClientId.get(c.id) || [];
                  const clientVisits = visitsByClientId.get(c.id) || [];

                  return (
                    <React.Fragment key={c.id}>
                      <tr onClick={() => toggleRow(c.id)} className={`cursor-pointer transition-colors ${isExpanded ? 'bg-[#AA895F]/5' : 'hover:bg-white/50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-[#364649] text-[#E0D8CC] flex items-center justify-center font-bold mr-3 shadow-md">
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-[#364649]">{c.name}</div>
                              <div className="text-xs text-[#364649]/50">DNI: {c.dni}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded bg-[#AA895F]/10 text-[#AA895F] text-xs font-bold uppercase border border-[#AA895F]/20">
                            {c.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#364649]/70 space-y-1">
                            <div className="flex items-center"><Phone size={12} className="mr-2" /> {c.phone}</div>
                            <div className="flex items-center"><Mail size={12} className="mr-2" /> {c.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end items-center">
                          <button onClick={(e) => { e.stopPropagation(); onCreateSearch(c.id); }} className="mr-2 px-3 py-1.5 bg-[#364649] text-white rounded-lg text-xs font-bold hover:bg-[#2A3638] transition-colors shadow-sm">
                            + Búsqueda
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onEditClient(c.id); }} className="p-2 text-[#364649]/40 hover:text-[#AA895F] transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button className={`ml-2 p-2 hover:bg-[#364649]/10 rounded-full transition-all duration-300 text-[#364649]/50 ${isExpanded ? 'bg-[#364649]/10 rotate-180' : ''}`}>
                            <ChevronDown size={18} />
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED SECTION */}
                      {isExpanded && (
                        <tr className="bg-[#AA895F]/5 animate-fade-in-up">
                          <td colSpan={4} className="px-6 py-6">
                            <div className="bg-white/60 border border-white rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-8">

                              {/* COL 1: ACTIVE SEARCHES */}
                              <div className="flex-1">
                                <h4 className="text-xs font-bold text-[#708F96] uppercase tracking-widest mb-3 flex items-center">
                                  <Target size={14} className="mr-2" /> Búsquedas Activas ({clientSearches.length})
                                </h4>

                                {clientSearches.length > 0 ? (
                                  <div className="space-y-3">
                                    {clientSearches.map(s => (
                                      <div key={s.id} onClick={() => onEditSearch(s.id)} className="bg-white/80 p-4 rounded-xl border border-[#708F96]/10 hover:border-[#708F96] transition-all cursor-pointer group relative">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${s.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                                          <div className="text-xs text-[#364649]/60 flex items-center"><Wallet size={12} className="mr-1" /> {s.searchProfile.budget.currency} {s.searchProfile.budget.max.toLocaleString()}</div>
                                        </div>
                                        <h5 className="font-bold text-[#364649] text-sm mb-1">{s.searchProfile.propertyTypes.join(', ')}</h5>
                                        <p className="text-xs text-[#364649]/60 truncate mb-3"><MapPin size={10} className="inline mr-1" />{s.searchProfile.zones.join(', ')}</p>

                                        <div className="flex justify-end pt-2 border-t border-[#364649]/5">
                                          <button
                                            onClick={(e) => handleCopyNURC(e, c, s)}
                                            className={`flex items-center text-[10px] font-bold px-2 py-1 rounded transition-colors ${copiedId === s.id ? 'bg-emerald-100 text-emerald-700' : 'bg-[#364649]/5 text-[#364649]/60 hover:bg-[#364649]/10 hover:text-[#364649]'}`}
                                          >
                                            {copiedId === s.id ? <CheckCircle size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                                            {copiedId === s.id ? '¡Copiado!' : 'Copiar Perfil NURC'}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-[#708F96]/5 border border-dashed border-[#708F96]/30 rounded-xl p-6 text-center">
                                    <p className="text-xs text-[#364649]/60">Sin perfil de búsqueda activo.</p>
                                    <button onClick={() => onCreateSearch(c.id)} className="mt-2 text-xs text-[#708F96] font-bold hover:underline">+ Crear Perfil NURC</button>
                                  </div>
                                )}
                              </div>

                              {/* COL 2: VISIT HISTORY */}
                              <div className="flex-1 border-l border-[#364649]/5 pl-8">
                                <h4 className="text-xs font-bold text-[#AA895F] uppercase tracking-widest mb-3 flex items-center">
                                  <Calendar size={14} className="mr-2" /> Historial de Visitas ({clientVisits.length})
                                </h4>

                                {clientVisits.length > 0 ? (
                                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {clientVisits.map(v => (
                                      <div key={v.id} className="bg-white/50 p-3 rounded-xl border border-[#364649]/5 flex justify-between items-center text-xs">
                                        <div>
                                          <p className="font-bold text-[#364649]">{getPropertyAddress(v.propertyId)}</p>
                                          <p className="text-[#364649]/50">{new Date(v.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                          {v.status === 'realizada' ? (
                                            <span className="text-emerald-600 font-bold flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></span>Realizada</span>
                                          ) : (
                                            <span className="text-gray-400">{v.status}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#364649]/40 italic mt-4">Este cliente aún no ha realizado visitas.</p>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load More Trigger */}
      {filteredClients.length > visibleCount && (
        <div className="flex justify-center mt-4 pb-8">
          <button
            onClick={handleLoadMore}
            className="text-sm font-bold text-[#AA895F] hover:text-[#364649] transition-colors flex items-center gap-2 border border-[#AA895F]/20 px-4 py-2 rounded-full hover:bg-[#AA895F]/10"
          >
            Cargar más clientes <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(BuyerClientDashboard);
