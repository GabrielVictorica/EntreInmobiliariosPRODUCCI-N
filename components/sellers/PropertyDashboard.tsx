
import React, { useState } from 'react';
import { PropertyRecord, ClientRecord, VisitRecord, BuyerClientRecord } from '../../types';
import { Building2, MapPin, Plus, Home, Edit3, ChevronDown, Sparkles, FileText, Calendar, Clock, Star, BarChart3, ShieldCheck } from 'lucide-react';

interface PropertyDashboardProps {
  properties: PropertyRecord[];
  clients: ClientRecord[];
  visits: VisitRecord[]; // Added prop
  buyers: BuyerClientRecord[]; // Added prop for resolving names
  onNewProperty: () => void;
  onEditProperty: (id: string) => void;
  onOpenMarketing: (id: string) => void; // New prop
}

const PropertyDashboard: React.FC<PropertyDashboardProps> = ({ properties, clients, visits, buyers, onNewProperty, onEditProperty, onOpenMarketing }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  
  const getOwnerName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.owners[0].name : 'Desconocido';
  };

  const getBuyerName = (id: string) => {
      return buyers.find(b => b.id === id)?.name || 'Desconocido';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Propiedades</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#364649]/60 text-sm font-medium">Inventario activo</p>
            <span className="w-1 h-1 rounded-full bg-[#364649]/30"></span>
            <p className="text-[#364649]/40 text-sm font-medium">{properties.length} inmuebles</p>
          </div>
        </div>
        <button 
          onClick={onNewProperty}
          className="btn-hover-effect bg-[#AA895F] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#AA895F]/30 flex items-center active:scale-95"
        >
          <Plus className="mr-2" size={18} />
          Nueva Propiedad
        </button>
      </div>

      {/* List */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl overflow-hidden shadow-xl animate-fade-in-up">
        {properties.length === 0 ? (
          <div className="p-16 text-center">
             <div className="w-16 h-16 bg-[#AA895F]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#AA895F]/20">
               <Home className="text-[#AA895F]" size={24} />
             </div>
             <h3 className="text-[#364649] font-bold text-lg">No hay propiedades cargadas</h3>
             <p className="text-[#364649]/60 text-sm mt-2">Comienza vinculando un inmueble a un cliente vendedor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#364649]/10 text-[#364649]/50 text-xs uppercase tracking-wider bg-white/20">
                  <th className="px-6 py-4 font-bold w-20">Foto</th>
                  <th className="px-6 py-4 font-bold">Código / Tipo</th>
                  <th className="px-6 py-4 font-bold">Ubicación</th>
                  <th className="px-6 py-4 font-bold">Propietario</th>
                  <th className="px-6 py-4 font-bold">Precio</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#364649]/5">
                {properties.map((prop, index) => {
                   const isExpanded = expandedRow === prop.id;
                   const mainPhoto = prop.files.photos.length > 0 ? prop.files.photos[0] : null;
                   
                   // Linked Data: Visits
                   const propertyVisits = visits.filter(v => v.propertyId === prop.id);
                   const visitCount = propertyVisits.length;
                   const lastVisit = propertyVisits.length > 0 ? propertyVisits.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;

                   return (
                   <React.Fragment key={prop.id}>
                       <tr 
                         className={`group transition-all duration-300 cursor-pointer ${isExpanded ? 'bg-[#AA895F]/5' : 'hover:bg-white/50'}`}
                         onClick={() => toggleRow(prop.id)}
                       >
                          <td className="px-6 py-4">
                              <div className="w-16 h-12 bg-[#364649]/10 rounded-lg overflow-hidden border border-[#364649]/10 shadow-sm">
                                  {mainPhoto ? (
                                      <img src={mainPhoto} alt="prop" className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#364649]/30">
                                          <Home size={16} />
                                      </div>
                                  )}
                              </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="font-bold text-[#364649]">{prop.customId}</div>
                             <div className="text-xs text-[#364649]/60 uppercase">{prop.type}</div>
                             {prop.createdByEmail && (
                                <div className="flex items-center text-[9px] text-[#708F96] mt-1 bg-white/50 px-1.5 py-0.5 rounded w-fit">
                                    <ShieldCheck size={10} className="mr-1"/> {prop.createdByEmail}
                                </div>
                             )}
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center text-sm text-[#364649]">
                                <MapPin size={14} className="mr-1 text-[#708F96]" />
                                {prop.address.street} {prop.address.number}
                             </div>
                             <div className="text-xs text-[#364649]/50 pl-5">{prop.address.neighborhood}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-sm font-medium text-[#364649]/80 group-hover:text-[#AA895F] transition-colors">
                                {getOwnerName(prop.clientId)}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="font-bold text-[#364649]">
                                {prop.currency} {prop.price.toLocaleString()}
                             </div>
                             {prop.expenses.ordinary ? (
                                 <div className="text-xs text-[#364649]/50">Exp: ${prop.expenses.ordinary}</div>
                             ) : null}
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                ${prop.status === 'disponible' ? 'bg-emerald-100 text-emerald-700' : 
                                  prop.status === 'reservada' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-500'}
                             `}>
                                {prop.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onOpenMarketing(prop.id); }}
                                className="p-2 bg-white border border-[#364649]/10 rounded-full text-[#364649]/60 hover:text-[#AA895F] hover:shadow-md transition-all"
                                title="Métricas de Marketing"
                             >
                                <BarChart3 size={16} />
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onEditProperty(prop.id); }}
                                className="p-2 bg-white border border-[#364649]/10 rounded-full text-[#364649]/60 hover:text-[#AA895F] hover:shadow-md transition-all"
                             >
                                <Edit3 size={16} />
                             </button>
                             <button className={`p-2 hover:bg-[#364649]/10 rounded-full transition-all duration-300 text-[#364649]/50 ${isExpanded ? 'bg-[#364649]/10 rotate-180' : ''}`}>
                               <ChevronDown size={18}/> 
                             </button>
                          </td>
                       </tr>
                       
                       {isExpanded && (
                        <tr className="bg-[#AA895F]/5 animate-fade-in-up">
                           <td colSpan={7} className="px-6 py-6">
                              <div className="bg-white/60 border border-white rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-8">
                                 
                                 {/* 1. Photo & Basics */}
                                 <div className="w-full lg:w-1/4">
                                     <div className="aspect-video bg-[#364649]/10 rounded-xl overflow-hidden shadow-inner mb-4 relative group">
                                         {mainPhoto ? (
                                            <img src={mainPhoto} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Main" />
                                         ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#364649]/40 flex-col">
                                                <Home size={32} className="mb-2"/>
                                                <span className="text-xs uppercase font-bold">Sin Fotos</span>
                                            </div>
                                         )}
                                         <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                                             {prop.features.rooms} Ambientes
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-2 text-center">
                                         <div className="bg-white/50 p-2 rounded-lg border border-[#364649]/5">
                                             <span className="block text-[10px] uppercase text-[#364649]/60 font-bold">Sup. Total</span>
                                             <span className="font-bold text-[#364649]">{prop.surface.total} m²</span>
                                         </div>
                                         <div className="bg-white/50 p-2 rounded-lg border border-[#364649]/5">
                                             <span className="block text-[10px] uppercase text-[#364649]/60 font-bold">Antigüedad</span>
                                             <span className="font-bold text-[#364649]">{prop.features.age || 0} años</span>
                                         </div>
                                     </div>
                                 </div>

                                 {/* 2. AI Analysis */}
                                 <div className="w-full lg:w-1/3 flex flex-col">
                                     <div className="flex items-center mb-4">
                                         <FileText className="text-[#AA895F] mr-2" size={20} />
                                         <h4 className="text-lg font-bold text-[#364649]">Descripción (IA)</h4>
                                     </div>
                                     <div className="bg-white/50 border border-[#364649]/10 rounded-xl p-5 text-[#364649] text-sm leading-relaxed shadow-sm flex-1 overflow-y-auto max-h-[250px] custom-scrollbar">
                                         {prop.aiAnalysis ? (
                                            <div className="whitespace-pre-line font-medium text-[#364649]/80">{prop.aiAnalysis}</div>
                                         ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-[#364649]/40">
                                                <Sparkles size={32} className="mb-2 opacity-50"/>
                                                <p>Generando descripción de venta...</p>
                                            </div>
                                         )}
                                     </div>
                                 </div>

                                 {/* 3. METRICS & VISITS (LINKED DATA) */}
                                 <div className="w-full lg:w-1/3 flex flex-col border-l border-[#364649]/5 pl-8">
                                     <div className="flex items-center mb-4">
                                         <Calendar className="text-[#708F96] mr-2" size={20} />
                                         <h4 className="text-lg font-bold text-[#364649]">Métricas y Visitas</h4>
                                     </div>
                                     
                                     {/* KPI Cards */}
                                     <div className="grid grid-cols-2 gap-3 mb-4">
                                         <div className="bg-white p-3 rounded-lg border border-[#364649]/5 text-center">
                                             <span className="block text-2xl font-bold text-[#364649]">{visitCount}</span>
                                             <span className="text-[10px] uppercase font-bold text-[#364649]/50">Visitas Totales</span>
                                         </div>
                                         <div className="bg-white p-3 rounded-lg border border-[#364649]/5 text-center">
                                             <span className="block text-sm font-bold text-[#364649] mt-1">{lastVisit ? new Date(lastVisit.date).toLocaleDateString() : '-'}</span>
                                             <span className="text-[10px] uppercase font-bold text-[#364649]/50">Última Visita</span>
                                         </div>
                                     </div>

                                     {/* Recent Activity List */}
                                     <div className="bg-white/40 rounded-xl border border-[#364649]/5 flex-1 p-3 overflow-y-auto max-h-[160px] custom-scrollbar">
                                         {propertyVisits.length > 0 ? (
                                             <div className="space-y-2">
                                                 {propertyVisits.map((v) => (
                                                     <div key={v.id} className="text-xs p-2 bg-white rounded border border-[#364649]/5 flex justify-between items-center">
                                                         <div>
                                                             <p className="font-bold text-[#364649]">{getBuyerName(v.buyerClientId)}</p>
                                                             <p className="text-[#364649]/50 flex items-center mt-0.5"><Clock size={10} className="mr-1"/> {new Date(v.date).toLocaleDateString()}</p>
                                                         </div>
                                                         <div className="text-right">
                                                             {v.feedback ? (
                                                                 <div className="flex text-[#AA895F]"><Star size={10} fill="currentColor"/> <span className="ml-1 font-bold">{v.feedback.rating}</span></div>
                                                             ) : (
                                                                 <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">Pendiente</span>
                                                             )}
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         ) : (
                                             <div className="h-full flex items-center justify-center text-xs text-[#364649]/40">
                                                 Sin actividad reciente.
                                             </div>
                                         )}
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
    </div>
  );
};

export default PropertyDashboard;
