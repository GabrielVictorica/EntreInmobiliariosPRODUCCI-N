import React, { useState, useMemo } from 'react';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';
import {
  Plus,
  ChevronDown,
  MapPin,
  Briefcase,
  Users,
  Phone,
  Mail,
  Home,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { DebouncedInput } from '../DebouncedInput';
import { DashboardHeader } from '../ui/DashboardHeader';

interface DashboardProps {
  onNewSeller: () => void;
  onEditClient: (clientId: string) => void;
  onAssignProperty: (clientId: string) => void;
  onEditProperty: (id: string) => void;
}

const SellersDashboard: React.FC<DashboardProps> = ({
  onNewSeller,
  onEditClient,
  onAssignProperty,
  onEditProperty
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { clients, properties, isLoading } = useBusinessStore(useShallow(state => ({
    clients: state.clients,
    properties: state.properties,
    isLoading: state.isSystemInitializing
  })));

  // 1. Data Structure Optimization: O(1) Property Lookup
  const propertiesByClientId = useMemo(() => {
    const map = new Map<string, typeof properties>();
    properties.forEach(p => {
      if (!map.has(p.clientId)) map.set(p.clientId, []);
      map.get(p.clientId)!.push(p);
    });
    return map;
  }, [properties]);

  // 2. Render Virtualization State
  const [visibleCount, setVisibleCount] = useState(10);

  // Internal Filtering
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const lowerQuery = searchQuery.toLowerCase();
    return clients.filter(client => {
      const nameMatch = client.owners.some(owner => owner.name.toLowerCase().includes(lowerQuery));
      const emailMatch = client.contact.email.toLowerCase().includes(lowerQuery);
      return nameMatch || emailMatch;
    });
  }, [clients, searchQuery]);

  // 3. Progressive Rendering Slice
  const displayedClients = useMemo(() => {
    return filteredClients.slice(0, visibleCount);
  }, [filteredClients, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-8 pb-10">

      {/* Standardized Header */}
      {/* Standardized Header */}
      <DashboardHeader
        title="Dashboard"
        subtitle="Gestión de cartera"
        count={useMemo(() => ({
          value: filteredClients.length,
          label: filteredClients.length === 1 ? 'cliente registrado' : 'clientes registrados'
        }), [filteredClients.length])}
        searchProps={useMemo(() => ({
          placeholder: "Buscar por nombre o email...",
          value: searchQuery,
          onChange: setSearchQuery
        }), [searchQuery])}
        actionProps={useMemo(() => ({
          label: "Nuevo Cliente",
          onClick: onNewSeller
        }), [onNewSeller])}
      />

      {/* Main Table / List */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl overflow-hidden shadow-xl" >
        <div className="p-6 border-b border-[#364649]/5 flex justify-between items-center bg-white/40">
          <h2 className="text-xl font-bold text-[#364649]">Clientes Recientes</h2>
          <button className="text-[#708F96] hover:text-[#364649] text-sm font-medium transition-colors duration-300 hover:underline">Ver todos</button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-[#364649]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#364649]/10 animate-pulse">
              <Users className="text-[#364649]/40" size={24} />
            </div>
            <h3 className="text-[#364649] font-bold text-lg">No hay clientes encontrados</h3>
            <p className="text-[#364649]/60 text-sm mt-2">Intenta ajustar la búsqueda o agrega un nuevo prospecto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#364649]/10 text-[#364649]/50 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Cliente</th>
                  <th className="px-6 py-4 font-bold">Perfil</th>
                  <th className="px-6 py-4 font-bold">Contacto</th>
                  <th className="px-6 py-4 font-bold">Ubicación</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#364649]/5">
                {displayedClients.map((client, index) => {
                  const isExpanded = expandedRow === client.id;
                  const clientProperties = propertiesByClientId.get(client.id) || [];

                  return (
                    <React.Fragment key={client.id}>
                      <tr
                        className={`group transition-all duration-300 cursor-pointer ${isExpanded ? 'bg-[#AA895F]/5' : 'hover:bg-white/50'}`}
                        onClick={() => toggleRow(client.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-[#364649] flex items-center justify-center text-[#E0D8CC] font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-300">
                              {client.owners[0].name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="font-bold text-[#364649] group-hover:text-[#AA895F] transition-colors duration-300">{client.owners[0].name}</div>
                              {client.owners.length > 1 && (
                                <div className="text-xs text-[#364649]/60">+{client.owners.length - 1} titulares</div>
                              )}
                              {client.createdByEmail && (
                                <div className="flex items-center text-[9px] text-[#708F96] mt-1 bg-white/50 px-1.5 py-0.5 rounded w-fit">
                                  <ShieldCheck size={10} className="mr-1" /> {client.createdByEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border transition-transform duration-300 hover:scale-105 ${client.profileType === 'investor' ? 'bg-[#AA895F]/10 text-[#AA895F] border-[#AA895F]/20' :
                            client.profileType === 'constructor' ? 'bg-[#364649]/10 text-[#364649] border-[#364649]/20' :
                              client.profileType === 'company' ? 'bg-[#708F96]/10 text-[#708F96] border-[#708F96]/20' :
                                'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            }`}>
                            {client.profileType === 'particular' ? 'Particular' :
                              client.profileType === 'investor' ? 'Inversor' :
                                client.profileType === 'constructor' ? 'Constructor' : 'Empresa'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {client.contact.phone && (
                              <div className="flex items-center text-xs text-[#364649]/70 group-hover:text-[#364649] transition-colors">
                                <Phone size={12} className="mr-2 opacity-50" /> {client.contact.phone}
                              </div>
                            )}
                            {client.contact.email && (
                              <div className="flex items-center text-xs text-[#364649]/70 group-hover:text-[#364649] transition-colors">
                                <Mail size={12} className="mr-2 opacity-50" /> <span className="truncate max-w-[150px]">{client.contact.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-[#364649]/70 text-sm group-hover:text-[#364649] transition-colors">
                            <MapPin size={14} className="mr-2 text-[#708F96] group-hover:scale-110 transition-transform" />
                            {client.contact.city || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></div>
                            <span className="text-xs text-[#364649]/70 font-medium">Activo</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className={`p-2 hover:bg-[#364649]/10 rounded-full transition-all duration-300 text-[#364649]/50 ${isExpanded ? 'bg-[#364649]/10 rotate-180' : ''}`}>
                            <ChevronDown size={18} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#AA895F]/5">
                          <td colSpan={6} className="px-6 py-6">
                            <div className="bg-white/60 border border-white rounded-2xl p-6 shadow-sm animate-fade-in-up">
                              <div className="flex flex-col lg:flex-row gap-8">

                                {/* Column 1: Notes & Details */}
                                <div className="flex-1 space-y-6">
                                  <div>
                                    <h4 className="text-xs font-bold text-[#708F96] uppercase tracking-widest mb-3 flex items-center">
                                      <Briefcase size={14} className="mr-2" /> Observaciones
                                    </h4>
                                    <div className="p-4 rounded-xl bg-white/50 border border-[#364649]/10 text-[#364649] text-sm leading-relaxed shadow-sm min-h-[80px]">
                                      {client.notes || "No hay notas registradas para este cliente."}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="block text-[#364649]/50 text-xs">Fecha de alta</span>
                                      <span className="font-medium text-[#364649]">{new Date(client.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[#364649]/50 text-xs">Preferencia</span>
                                      <span className="font-medium text-[#364649] uppercase">{client.contact.preferredContact}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="block text-[#364649]/50 text-xs">Dirección</span>
                                      <span className="font-medium text-[#364649]">{client.contact.address || 'No especificada'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 2: Assigned Properties (LINKED DATA) */}
                                <div className="flex-1 border-l border-[#364649]/5 pl-8">
                                  <h4 className="text-xs font-bold text-[#AA895F] uppercase tracking-widest mb-3 flex items-center">
                                    <Home size={14} className="mr-2" /> Cartera de Propiedades ({clientProperties.length})
                                  </h4>
                                  {clientProperties.length > 0 ? (
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                      {clientProperties.map(p => (
                                        <div key={p.id} onClick={() => onEditProperty(p.id)} className="bg-white/80 hover:bg-white p-3 rounded-xl border border-[#364649]/10 shadow-sm flex items-center gap-3 cursor-pointer group transition-all hover:scale-[1.02]">
                                          <div className="w-12 h-12 bg-[#364649]/10 rounded-lg overflow-hidden flex-shrink-0">
                                            {p.files.photos[0] ? (
                                              <img src={p.files.photos[0]} className="w-full h-full object-cover" alt="prop" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center"><Home size={16} className="text-[#364649]/30" /></div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#364649] truncate">{p.address.street} {p.address.number}</p>
                                            <p className="text-xs text-[#364649]/60">{p.customId} • {p.status.toUpperCase()}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-bold text-[#364649]">{p.currency} {p.price.toLocaleString()}</p>
                                            <ArrowRight size={14} className="ml-auto text-[#364649]/30 group-hover:text-[#AA895F]" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-[#AA895F]/5 border border-dashed border-[#AA895F]/30 rounded-xl p-6 text-center">
                                      <p className="text-xs text-[#364649]/60 font-medium">Este cliente no tiene propiedades asignadas.</p>
                                      <button onClick={() => onAssignProperty(client.id)} className="mt-2 text-xs text-[#AA895F] font-bold hover:underline">
                                        + Asignar Propiedad
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="w-full lg:w-auto flex lg:flex-col gap-3 justify-center min-w-[160px]">
                                  <button
                                    onClick={() => onAssignProperty(client.id)}
                                    className="flex-1 bg-[#364649] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2A3638] transition-all duration-300 shadow-lg shadow-[#364649]/20 hover:-translate-y-1"
                                  >
                                    Asignar Propiedad
                                  </button>
                                  <button
                                    onClick={() => onEditClient(client.id)}
                                    className="flex-1 border border-[#364649]/20 text-[#364649] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#364649]/5 transition-colors"
                                  >
                                    Editar Cliente
                                  </button>
                                </div>
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

export default React.memo(SellersDashboard);
