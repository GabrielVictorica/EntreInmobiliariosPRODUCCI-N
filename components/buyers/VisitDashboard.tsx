
import React, { useState } from 'react';
import { VisitRecord, PropertyRecord, BuyerClientRecord, VisitStatus } from '../../types';
import { Plus, Calendar, List, MapPin, Clock, User, CheckCircle, AlertCircle, XCircle, ChevronRight, Edit3 } from 'lucide-react';

interface VisitDashboardProps {
  visits: VisitRecord[];
  properties: PropertyRecord[];
  buyers: BuyerClientRecord[];
  onNewVisit: () => void;
  onEditVisit: (id: string) => void;
}

const VisitDashboard: React.FC<VisitDashboardProps> = ({ visits, properties, buyers, onNewVisit, onEditVisit }) => {
  const [viewMode, setViewMode] = useState<'agenda' | 'list'>('agenda');

  // Helpers to resolve IDs to Data
  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getBuyer = (id: string) => buyers.find(b => b.id === id);

  const getStatusBadge = (status: VisitStatus) => {
    switch(status) {
        case 'pendiente': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-200">Pendiente</span>;
        case 'realizada': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-200">Realizada</span>;
        case 'cancelada': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-red-200">Cancelada</span>;
    }
  };

  const sortVisits = (v: VisitRecord[]) => v.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  // Group visits for Agenda
  const today = new Date().toISOString().split('T')[0];
  const sortedVisits = sortVisits([...visits]);
  
  const todayVisits = sortedVisits.filter(v => v.date === today);
  const futureVisits = sortedVisits.filter(v => v.date > today);
  const pastVisits = sortedVisits.filter(v => v.date < today);

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Agenda de Visitas</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#364649]/60 text-sm font-medium">Logística y Recorridos</p>
            <span className="w-1 h-1 rounded-full bg-[#364649]/30"></span>
            <p className="text-[#364649]/40 text-sm font-medium">{visits.length} visitas totales</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="bg-white/40 p-1 rounded-xl flex border border-[#364649]/10">
                <button onClick={() => setViewMode('agenda')} className={`p-2 rounded-lg transition-all ${viewMode === 'agenda' ? 'bg-[#364649] text-white shadow-md' : 'text-[#364649]/60 hover:text-[#364649]'}`}>
                    <Calendar size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#364649] text-white shadow-md' : 'text-[#364649]/60 hover:text-[#364649]'}`}>
                    <List size={18} />
                </button>
            </div>

            <button onClick={onNewVisit} className="btn-hover-effect bg-[#AA895F] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#AA895F]/30 flex items-center active:scale-95">
               <Plus className="mr-2" size={18} /> Agendar Visita
            </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl overflow-hidden shadow-xl animate-fade-in-up min-h-[500px]">
         {visits.length === 0 ? (
             <div className="p-16 text-center">
                <div className="w-16 h-16 bg-[#AA895F]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#AA895F]/20">
                    <Calendar className="text-[#AA895F]" size={24} />
                </div>
                <h3 className="text-[#364649] font-bold text-lg">Agenda Vacía</h3>
                <p className="text-[#364649]/60 text-sm mt-2">No hay visitas programadas.</p>
             </div>
         ) : viewMode === 'list' ? (
             // --- LIST VIEW ---
             <div className="overflow-x-auto">
                 <table className="min-w-full text-left border-collapse">
                     <thead>
                         <tr className="border-b border-[#364649]/10 text-[#364649]/50 text-xs uppercase tracking-wider bg-white/20">
                             <th className="px-6 py-4 font-bold">Fecha/Hora</th>
                             <th className="px-6 py-4 font-bold">Propiedad</th>
                             <th className="px-6 py-4 font-bold">Comprador</th>
                             <th className="px-6 py-4 font-bold">Estado</th>
                             <th className="px-6 py-4"></th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-[#364649]/5">
                         {sortedVisits.map((v, i) => {
                             const p = getProperty(v.propertyId);
                             const b = getBuyer(v.buyerClientId);
                             return (
                                 <tr key={v.id} className="hover:bg-white/50 transition-colors cursor-pointer group" onClick={() => onEditVisit(v.id)}>
                                     <td className="px-6 py-4">
                                         <div className="font-bold text-[#364649]">{new Date(v.date).toLocaleDateString()}</div>
                                         <div className="text-xs text-[#364649]/60 flex items-center"><Clock size={10} className="mr-1"/> {v.time} ({v.duration}m)</div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="font-medium text-[#364649]">{p?.address.street} {p?.address.number}</div>
                                         <div className="text-xs text-[#364649]/50">{p?.customId}</div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="font-medium text-[#364649]">{b?.name}</div>
                                         <span className="text-[10px] bg-[#364649]/5 px-1 rounded uppercase font-bold text-[#364649]/60">{b?.type}</span>
                                     </td>
                                     <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                                     <td className="px-6 py-4 text-right">
                                         <button className="text-[#364649]/40 hover:text-[#AA895F] transition-colors"><Edit3 size={16}/></button>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
         ) : (
             // --- AGENDA VIEW ---
             <div className="p-6 space-y-8">
                 {todayVisits.length > 0 && (
                     <AgendaGroup title="HOY" dateLabel={new Date().toLocaleDateString()} visits={todayVisits} getProperty={getProperty} getBuyer={getBuyer} onEdit={onEditVisit} highlight />
                 )}
                 {futureVisits.length > 0 && (
                     <AgendaGroup title="PRÓXIMAS" dateLabel="Futuro" visits={futureVisits} getProperty={getProperty} getBuyer={getBuyer} onEdit={onEditVisit} />
                 )}
                 {pastVisits.length > 0 && (
                     <AgendaGroup title="HISTORIAL RECIENTE" dateLabel="Pasado" visits={pastVisits} getProperty={getProperty} getBuyer={getBuyer} onEdit={onEditVisit} opacity />
                 )}
             </div>
         )}
      </div>
    </div>
  );
};

const AgendaGroup = ({ title, dateLabel, visits, getProperty, getBuyer, onEdit, highlight, opacity }: any) => (
    <div className={opacity ? 'opacity-60' : ''}>
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center ${highlight ? 'text-[#AA895F]' : 'text-[#364649]/40'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${highlight ? 'bg-[#AA895F] animate-pulse' : 'bg-[#364649]/20'}`}></span>
            {title} <span className="ml-2 font-normal text-[#364649]/30 normal-case">({dateLabel})</span>
        </h3>
        <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#364649]/5">
            {visits.map((v: VisitRecord) => {
                 const p = getProperty(v.propertyId);
                 const b = getBuyer(v.buyerClientId);
                 return (
                     <div key={v.id} onClick={() => onEdit(v.id)} 
                        className="relative ml-10 bg-white/40 border border-white hover:border-[#AA895F]/30 hover:bg-white/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row gap-4 items-start md:items-center"
                     >
                         {/* Time Bubble */}
                         <div className={`absolute -left-[38px] top-1/2 -translate-y-1/2 w-14 py-1 rounded-lg text-center text-xs font-bold z-10 border shadow-sm ${highlight ? 'bg-[#364649] text-white border-[#364649]' : 'bg-white text-[#364649] border-[#364649]/10'}`}>
                            {v.time}
                         </div>

                         <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                                 {v.status === 'realizada' ? <CheckCircle size={14} className="text-emerald-500"/> : 
                                  v.status === 'cancelada' ? <XCircle size={14} className="text-red-500"/> :
                                  <Clock size={14} className="text-blue-500"/>}
                                 <h4 className="font-bold text-[#364649] text-sm">{p?.address.street} {p?.address.number}</h4>
                                 <span className="text-[10px] text-[#364649]/40 uppercase tracking-wider">{v.duration} min</span>
                             </div>
                             <div className="flex items-center text-xs text-[#364649]/70">
                                 <User size={12} className="mr-1"/> {b?.name}
                                 <span className="mx-2 text-[#364649]/20">|</span>
                                 <span className="bg-[#AA895F]/10 text-[#AA895F] px-1.5 rounded text-[10px] font-bold uppercase">{v.meetingPoint}</span>
                             </div>
                         </div>

                         <div className="hidden md:flex items-center">
                             <ChevronRight size={18} className="text-[#364649]/20 group-hover:text-[#AA895F] group-hover:translate-x-1 transition-all"/>
                         </div>
                     </div>
                 );
            })}
        </div>
    </div>
);

export default VisitDashboard;
