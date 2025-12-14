import React, { useState, useEffect } from 'react';
import { Save, Calendar, Clock, MapPin, User, Building2, CheckCircle, Shield, AlertTriangle, Star, ExternalLink, Calendar as CalIcon, UploadCloud, FileText, X, BrainCircuit, Target, Banknote, AlertCircle, Users, PenTool, RefreshCw, Link as LinkIcon, Activity } from 'lucide-react';
import { VisitRecord, PropertyRecord, BuyerClientRecord, VisitStatus, VisitDuration, BuyerSearchRecord, LeadSource } from '../../types';

// Helpers
const Section = ({ title, icon, children }: any) => (
  <div className="bg-white/40 border border-white rounded-2xl p-6 hover:shadow-md transition-all duration-500 mb-6">
     <div className="flex items-center mb-6 pb-2 border-b border-[#364649]/5">
         <div className="text-[#708F96] mr-2">{icon}</div>
         <h3 className="text-lg font-bold text-[#364649]">{title}</h3>
     </div>
     {children}
  </div>
);
const Input = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div>
    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] outline-none focus:border-[#AA895F] transition-all shadow-sm" />
  </div>
);
const TextArea = ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] outline-none focus:border-[#AA895F] transition-all shadow-sm resize-none h-20" />
    </div>
);
const Select = ({ label, value, onChange, options }: any) => (
    <div>
        <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{label}</label>
        <div className="relative">
            <select value={value} onChange={onChange} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] outline-none focus:border-[#AA895F] appearance-none shadow-sm">
                {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#364649]/40 text-xs">▼</div>
        </div>
    </div>
);
const Toggle = ({ label, checked, onChange }: any) => (
    <div className="flex items-center cursor-pointer" onClick={() => onChange(!checked)}>
        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${checked ? 'bg-[#708F96]' : 'bg-[#364649]/20'}`}>
            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
        <span className="ml-2 text-xs font-medium text-[#364649]">{label}</span>
    </div>
);

interface VisitFormProps {
  properties: PropertyRecord[];
  buyers: BuyerClientRecord[];
  buyerSearches: BuyerSearchRecord[]; // New Prop to find NURC
  onSave: (visit: VisitRecord) => void;
  onCancel: () => void;
  initialData?: VisitRecord | null;
}

const VisitForm: React.FC<VisitFormProps> = ({ properties, buyers, buyerSearches, onSave, onCancel, initialData }) => {
  // Section 1: Planning
  const [propertyId, setPropertyId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [source, setSource] = useState<LeadSource>('marketplace'); // UPDATED DEFAULT
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<VisitDuration>('30');
  const [meetingPoint, setMeetingPoint] = useState<'propiedad' | 'oficina' | 'otro'>('propiedad');
  const [securityCheck, setSecurityCheck] = useState(false);

  // Section 3: Status
  const [status, setStatus] = useState<VisitStatus>('pendiente');
  const [signedConfirmation, setSignedConfirmation] = useState(false);
  const [signedConfirmationFile, setSignedConfirmationFile] = useState('');

  // Section 4: Feedback
  const [rating, setRating] = useState(0);
  const [pricePerception, setPricePerception] = useState<'barato' | 'justo' | 'caro'>('justo');
  const [interestLevel, setInterestLevel] = useState<'caliente' | 'tibio' | 'frio'>('tibio');
  const [positivePoints, setPositivePoints] = useState('');
  const [objections, setObjections] = useState('');
  const [nurcMatch, setNurcMatch] = useState(true);
  const [searchCriteriaUpdate, setSearchCriteriaUpdate] = useState('');

  // Section 5: Next Steps
  const [action, setAction] = useState<'ofertar' | 'segunda_visita' | 'buscar_similares' | 'descartar'>('buscar_similares');
  const [followUpDate, setFollowUpDate] = useState('');

  // Selected Data (Visual Helpers)
  const selectedProperty = properties.find(p => p.id === propertyId);
  const selectedBuyer = buyers.find(b => b.id === buyerId);
  
  // Find Active Search for this Buyer to show NURC context
  const activeSearch = buyerSearches.find(s => s.buyerClientId === buyerId && s.status === 'activo');

  useEffect(() => {
    if (initialData) {
        setPropertyId(initialData.propertyId);
        setBuyerId(initialData.buyerClientId);
        setAgentName(initialData.agentName);
        setSource(initialData.source || 'otro');
        setDate(initialData.date);
        setTime(initialData.time);
        setDuration(initialData.duration);
        setMeetingPoint(initialData.meetingPoint);
        setSecurityCheck(initialData.securityCheck);
        setStatus(initialData.status);
        setSignedConfirmation(initialData.signedConfirmation);
        setSignedConfirmationFile(initialData.signedConfirmationFile || '');

        if (initialData.feedback) {
            setRating(initialData.feedback.rating);
            setPricePerception(initialData.feedback.pricePerception);
            setInterestLevel(initialData.feedback.interestLevel);
            setPositivePoints(initialData.feedback.positivePoints);
            setObjections(initialData.feedback.objections);
            setNurcMatch(initialData.feedback.nurcMatch);
            setSearchCriteriaUpdate(initialData.feedback.searchCriteriaUpdate || '');
        }

        if (initialData.nextSteps) {
            setAction(initialData.nextSteps.action);
            setFollowUpDate(initialData.nextSteps.followUpDate || '');
        }
    }
  }, [initialData]);

  const generateGoogleCalendarLink = () => {
    if (!selectedProperty || !selectedBuyer || !date || !time) return;

    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

    const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const title = `Visita: ${selectedProperty.address.street} ${selectedProperty.address.number} con ${selectedBuyer.name}`;
    const details = `Cliente: ${selectedBuyer.name}\nTel: ${selectedBuyer.phone}\nPropiedad: ${selectedProperty.address.street}\nAgente: ${agentName}`;
    const location = `${selectedProperty.address.street} ${selectedProperty.address.number}, ${selectedProperty.address.neighborhood}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGCalDate(startDateTime)}/${formatGCalDate(endDateTime)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    
    window.open(url, '_blank');
  };

  const handleFileUpload = () => {
      // Simulated upload logic
      const mockFile = "constancia_visita_firmada.pdf";
      setSignedConfirmationFile(mockFile);
  };

  const removeFile = () => {
      setSignedConfirmationFile('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !buyerId || !date || !time) {
        alert("Completa los datos obligatorios de planificación.");
        return;
    }

    const record: VisitRecord = {
        id: initialData ? initialData.id : `VST-${Date.now()}`,
        propertyId,
        buyerClientId: buyerId,
        agentName,
        source, // Save Source
        date,
        time,
        duration,
        meetingPoint,
        securityCheck,
        status,
        signedConfirmation,
        signedConfirmationFile: signedConfirmation ? signedConfirmationFile : undefined,
        feedback: status !== 'pendiente' ? {
            rating, pricePerception, interestLevel, positivePoints, objections, nurcMatch, searchCriteriaUpdate
        } : undefined,
        nextSteps: status !== 'pendiente' ? {
            action, followUpDate
        } : undefined,
        createdAt: initialData ? initialData.createdAt : new Date().toISOString()
    };
    onSave(record);
  };

  const renderBoolean = (val: boolean, label: string) => (
      <div className={`flex items-center text-[10px] ${val ? 'text-[#364649] font-bold' : 'text-[#364649]/40'}`}>
          {val ? <CheckCircle size={10} className="mr-1 text-[#708F96]" /> : <X size={10} className="mr-1" />}
          {label}
      </div>
  );

  return (
    <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-fade-in-up pb-32">
        <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-[#AA895F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#AA895F]/20 animate-scale-in">
                <Calendar className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-[#364649]">{initialData ? 'Gestionar Visita' : 'Agendar Nueva Visita'}</h2>
                <p className="text-[#364649]/60 text-sm font-medium">Coordinación entre Propiedad y Comprador.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. PLANNING */}
            <Section title="1. Planificación y Logística" icon={<Calendar size={18} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Property Select */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#AA895F] uppercase mb-1">Propiedad</label>
                        <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full bg-[#364649] text-white rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-[#AA895F] outline-none shadow-lg">
                            <option value="">-- Seleccionar Propiedad --</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.customId} - {p.address.street} ({p.type})</option>)}
                        </select>
                        {selectedProperty && (
                            <div className="mt-3 bg-white/50 p-3 rounded-xl border border-[#364649]/10 flex items-center space-x-3 animate-fade-in-up">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${selectedProperty.files.photos[0] || ''})` }}></div>
                                <div>
                                    <p className="text-xs font-bold text-[#364649]">{selectedProperty.address.street} {selectedProperty.address.number}</p>
                                    <p className="text-[10px] text-[#364649]/60 uppercase">{selectedProperty.logistics.occupation}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Buyer Select */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#AA895F] uppercase mb-1">Comprador</label>
                        <select value={buyerId} onChange={e => setBuyerId(e.target.value)} className="w-full bg-[#364649] text-white rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-[#AA895F] outline-none shadow-lg">
                            <option value="">-- Seleccionar Comprador --</option>
                            {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        {selectedBuyer && (
                            <div className="mt-3 bg-white/50 p-3 rounded-xl border border-[#364649]/10 flex items-center space-x-3 animate-fade-in-up">
                                <div className="w-10 h-10 bg-[#708F96] rounded-full flex items-center justify-center text-white font-bold">{selectedBuyer.name.charAt(0)}</div>
                                <div>
                                    <p className="text-xs font-bold text-[#364649]">{selectedBuyer.name}</p>
                                    <span className="text-[10px] bg-[#AA895F]/10 text-[#AA895F] px-2 py-0.5 rounded-full uppercase font-bold">{selectedBuyer.type.replace('_',' ')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date / Time / Origin Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Input label="Fecha" type="date" value={date} onChange={setDate} />
                    <Input label="Hora" type="time" value={time} onChange={setTime} />
                    
                    {/* NEW SOURCE FIELD OPTIONS */}
                    <Select label="¿Origen del contacto?" value={source} onChange={e => setSource(e.target.value as any)} 
                        options={[
                            {label: 'Marketplace (Portales)', value: 'marketplace'},
                            {label: 'Redes Sociales (Orgánico)', value: 'social'},
                            {label: 'Meta Ads (Publicidad)', value: 'ads'},
                            {label: 'Cartel / Guardia', value: 'cartel'},
                            {label: 'Referido / Contacto', value: 'referido'},
                            {label: 'Otro', value: 'otro'},
                        ]} 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Duración" value={duration} onChange={e => setDuration(e.target.value as any)} 
                            options={[{label: '15 min', value: '15'}, {label: '30 min', value: '30'}, {label: '60 min', value: '60'}]} 
                        />
                        <Select label="Punto de Encuentro" value={meetingPoint} onChange={e => setMeetingPoint(e.target.value as any)} 
                            options={[{label: 'En la Propiedad', value: 'propiedad'}, {label: 'En Oficina', value: 'oficina'}, {label: 'Otro', value: 'otro'}]} 
                        />
                    </div>
                    <Input label="Agente Responsable" value={agentName} onChange={setAgentName} placeholder="Nombre del Agente" />
                </div>
                
                {selectedProperty && selectedProperty.logistics.occupation !== 'vacia' && (
                    <div className="mt-4 flex items-center bg-[#AA895F]/10 border border-[#AA895F] p-3 rounded-xl">
                        <Shield className="text-[#AA895F] mr-3" size={20} />
                        <Toggle label="Seguridad: ¿Ocupante Notificado?" checked={securityCheck} onChange={setSecurityCheck} />
                    </div>
                )}
            </Section>
            
            {/* 2. CALENDAR INTEGRATION */}
            {date && time && selectedProperty && selectedBuyer && (
                <div className="flex justify-center animate-fade-in-up">
                    <button type="button" onClick={generateGoogleCalendarLink} className="flex items-center space-x-2 bg-white border border-[#364649]/10 shadow-md hover:shadow-lg px-6 py-3 rounded-xl text-[#364649] font-bold text-sm transition-transform hover:-translate-y-1">
                        <CalIcon size={18} className="text-blue-500" />
                        <span>Agendar en Google Calendar</span>
                        <ExternalLink size={14} className="opacity-50" />
                    </button>
                </div>
            )}

            {/* 3. STATUS & EXECUTION */}
            <Section title="3. Estado y Ejecución" icon={<CheckCircle size={18} />}>
                <div className="flex items-center space-x-4 mb-4">
                    <label className="text-xs font-bold text-[#364649]/60 uppercase">Estado Visita:</label>
                    <div className="flex space-x-2">
                        {['pendiente', 'realizada', 'cancelada'].map((s) => (
                            <button
                                key={s} type="button" onClick={() => setStatus(s as VisitStatus)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                    status === s 
                                    ? s === 'pendiente' ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : s === 'realizada' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-red-100 text-red-700 border-red-200'
                                    : 'bg-white border-[#364649]/10 text-[#364649]/40'
                                } border`}
                            >
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* WEEKLY DASHBOARD SYNC ALERT */}
                {status === 'realizada' && (
                    <div className="flex items-start bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4 animate-fade-in-up">
                        <div className="bg-emerald-100 p-1.5 rounded-full mr-3 text-emerald-600">
                            <Activity size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase mb-1">¡Actividad Verde!</p>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                Al guardar como "Realizada", esta visita se sumará automáticamente a tus estadísticas de <strong>Mí Semana</strong>.
                            </p>
                        </div>
                        <div className="ml-auto">
                            <CheckCircle size={18} className="text-emerald-500" />
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col gap-4">
                    <Toggle label="¿Firmó constancia de visita?" checked={signedConfirmation} onChange={setSignedConfirmation} />
                    
                    {signedConfirmation && (
                        <div className="animate-fade-in-up p-4 bg-white/50 border border-dashed border-[#364649]/30 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-[#364649] uppercase flex items-center">
                                    <FileText size={14} className="mr-2 text-[#708F96]"/> Documento Firmado
                                </h4>
                            </div>
                            
                            {!signedConfirmationFile ? (
                                <button type="button" onClick={handleFileUpload} className="w-full py-4 bg-white hover:bg-[#364649]/5 border border-[#364649]/10 rounded-lg text-[#364649]/60 text-sm flex flex-col items-center justify-center transition-colors">
                                    <UploadCloud size={24} className="mb-2 text-[#AA895F]"/>
                                    <span>Subir Foto / Archivo</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between bg-white border border-[#364649]/10 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center text-sm text-[#364649] font-medium">
                                        <CheckCircle size={16} className="text-emerald-500 mr-2"/>
                                        {signedConfirmationFile}
                                    </div>
                                    <button type="button" onClick={removeFile} className="text-[#364649]/40 hover:text-red-500 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Section>

            {/* 4. FEEDBACK (Conditional) */}
            {status !== 'pendiente' && (
                <div className="animate-fade-in-up">
                    <Section title="4. Feedback y Resultados" icon={<Star size={18} />}>
                        
                        {/* NURC Reality Check - Linked from Search Module (EXPANDED) */}
                        {activeSearch ? (
                            <div className="mb-8 bg-[#364649]/5 p-5 rounded-2xl border border-[#364649]/10 animate-fade-in-up">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#364649]/10">
                                    <h4 className="text-xs font-bold text-[#364649] uppercase flex items-center">
                                        <Target size={14} className="mr-2 text-[#AA895F]"/> Objetivo del Cliente (NURC)
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-white text-[#364649]/60 px-2 py-0.5 rounded border border-[#364649]/10">ID: {activeSearch.id}</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">Activo</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                                    {/* Need */}
                                    <div className="bg-white p-3 rounded-lg border border-[#364649]/5 hover:shadow-sm transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center text-[#708F96] mb-2 font-bold uppercase text-[10px]"><BrainCircuit size={12} className="mr-1"/> Necesidad</div>
                                            <div className="space-y-1.5 text-[#364649]">
                                                <p><span className="font-bold">Busca:</span> {activeSearch.searchProfile.propertyTypes.join(', ')}</p>
                                                <p><span className="font-bold">Zona:</span> {activeSearch.searchProfile.zones.join(', ')}</p>
                                                <p><span className="font-bold">Min:</span> {activeSearch.searchProfile.minRequirements.bedrooms} Dorms, {activeSearch.searchProfile.minRequirements.totalSurface} m²</p>
                                                <div className="grid grid-cols-2 gap-1 pt-1 mt-1 border-t border-[#364649]/5">
                                                     {renderBoolean(activeSearch.searchProfile.exclusions.mustHaveGarage, 'Cochera')}
                                                     {renderBoolean(activeSearch.searchProfile.exclusions.mustHaveOutdoor, 'Exterior')}
                                                     {renderBoolean(activeSearch.searchProfile.exclusions.mortgageRequired, 'Apto Créd.')}
                                                     {renderBoolean(activeSearch.searchProfile.exclusions.acceptsOffPlan, 'Pozo')}
                                                </div>
                                            </div>
                                        </div>
                                        {activeSearch.searchProfile.nurcNotes?.n && (
                                            <div className="pt-2 mt-2 border-t border-[#364649]/10 bg-[#708F96]/5 -mx-3 -mb-3 p-2 rounded-b-lg">
                                                <span className="text-[9px] font-bold uppercase text-[#708F96] block mb-1">Notas / Observaciones:</span>
                                                <p className="text-[10px] italic text-[#364649]/80 whitespace-pre-line">"{activeSearch.searchProfile.nurcNotes.n}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Urgency */}
                                    <div className="bg-white p-3 rounded-lg border border-[#364649]/5 hover:shadow-sm transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center text-[#364649] mb-2 font-bold uppercase text-[10px]"><Clock size={12} className="mr-1"/> Urgencia</div>
                                            <div className="space-y-1.5 text-[#364649]">
                                                <p><span className="font-bold">Plazo:</span> {activeSearch.searchProfile.timeline.replace(/_/g, ' ')}</p>
                                                <p><span className="font-bold">Motivo:</span> {activeSearch.searchProfile.trigger.replace(/_/g, ' ')}</p>
                                                <p><span className="font-bold">Disp:</span> {activeSearch.searchProfile.availability || 'No esp.'}</p>
                                            </div>
                                        </div>
                                        {activeSearch.searchProfile.nurcNotes?.u && (
                                            <div className="pt-2 mt-2 border-t border-[#364649]/10 bg-[#364649]/5 -mx-3 -mb-3 p-2 rounded-b-lg">
                                                <span className="text-[9px] font-bold uppercase text-[#364649] block mb-1">Notas / Observaciones:</span>
                                                <p className="text-[10px] italic text-[#364649]/80">"{activeSearch.searchProfile.nurcNotes.u}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Resources */}
                                    <div className="bg-white p-3 rounded-lg border border-[#364649]/5 hover:shadow-sm transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center text-[#AA895F] mb-2 font-bold uppercase text-[10px]"><Banknote size={12} className="mr-1"/> Recursos</div>
                                            <div className="space-y-1.5 text-[#364649]">
                                                 <p><span className="font-bold">Presupuesto:</span> {activeSearch.searchProfile.budget.currency} {activeSearch.searchProfile.budget.max.toLocaleString()}</p>
                                                 <p><span className="font-bold">Pago:</span> {activeSearch.searchProfile.paymentMethod}</p>
                                                 <div className="pt-1">
                                                    {renderBoolean(activeSearch.searchProfile.acceptsSwap, 'Permuta')}
                                                 </div>
                                                 {activeSearch.searchProfile.salesCondition.needsToSell && (
                                                    <p className="text-[#AA895F] font-bold text-[10px] bg-[#AA895F]/10 p-1 rounded inline-block mt-1">⚠ Venta Simultánea</p>
                                                 )}
                                            </div>
                                        </div>
                                        {activeSearch.searchProfile.nurcNotes?.r && (
                                            <div className="pt-2 mt-2 border-t border-[#364649]/10 bg-[#AA895F]/5 -mx-3 -mb-3 p-2 rounded-b-lg">
                                                <span className="text-[9px] font-bold uppercase text-[#AA895F] block mb-1">Notas / Observaciones:</span>
                                                <p className="text-[10px] italic text-[#364649]/80">"{activeSearch.searchProfile.nurcNotes.r}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Capacity */}
                                    <div className="bg-white p-3 rounded-lg border border-[#364649]/5 hover:shadow-sm transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center text-[#708F96] mb-2 font-bold uppercase text-[10px]"><Users size={12} className="mr-1"/> Capacidad</div>
                                            <div className="space-y-1.5 text-[#364649]">
                                                <p><span className="font-bold">Decisores:</span> {activeSearch.searchProfile.decisionMakers || 'No especificado'}</p>
                                            </div>
                                        </div>
                                        {activeSearch.searchProfile.nurcNotes?.c && (
                                            <div className="pt-2 mt-2 border-t border-[#364649]/10 bg-[#708F96]/5 -mx-3 -mb-3 p-2 rounded-b-lg">
                                                <span className="text-[9px] font-bold uppercase text-[#708F96] block mb-1">Notas / Observaciones:</span>
                                                <p className="text-[10px] italic text-[#364649]/80">"{activeSearch.searchProfile.nurcNotes.c}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-3 text-[10px] text-[#364649]/50 italic text-center border-t border-[#364649]/10 pt-2">
                                    Compara estos datos con la propiedad visitada para evaluar el Match.
                                </div>
                            </div>
                        ) : (
                             <div className="mb-6 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center">
                                 <AlertCircle className="mx-auto text-gray-400 mb-2" size={20} />
                                 <p className="text-xs text-gray-500 font-medium">No se encontró una búsqueda activa para este cliente.</p>
                                 <p className="text-[10px] text-gray-400">Crea un perfil de búsqueda para ver el análisis NURC aquí.</p>
                             </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="flex flex-col items-center justify-center bg-white/50 p-4 rounded-xl border border-[#364649]/5">
                                <label className="text-[10px] font-bold text-[#364649]/60 uppercase mb-2">Calificación Propiedad</label>
                                <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button" onClick={() => setRating(star)} className={`transition-transform hover:scale-125 ${star <= rating ? 'text-[#AA895F]' : 'text-gray-300'}`}>
                                            <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Select label="Percepción de Precio" value={pricePerception} onChange={e => setPricePerception(e.target.value as any)} 
                                options={[{label: 'Barato', value: 'barato'}, {label: 'Justo', value: 'justo'}, {label: 'Caro', value: 'caro'}]} 
                            />
                            <Select label="Interés Real" value={interestLevel} onChange={e => setInterestLevel(e.target.value as any)} 
                                options={[{label: '🔥 Caliente', value: 'caliente'}, {label: '🌤 Tibio', value: 'tibio'}, {label: '❄️ Frío', value: 'frio'}]} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <TextArea label="Feedback Positivo" value={positivePoints} onChange={setPositivePoints} placeholder="¿Qué le gustó?" />
                            <TextArea label="Objeciones / Rechazo" value={objections} onChange={setObjections} placeholder="¿Por qué duda o rechaza?" />
                        </div>
                        
                        <div className="flex flex-col gap-4 bg-[#364649]/5 p-5 rounded-2xl border border-[#364649]/10">
                            <div className="flex justify-between items-center">
                                <h5 className="font-bold text-[#364649] text-sm">Validación NURC</h5>
                                <Toggle label="¿La propiedad cumple con la búsqueda (NURC)?" checked={nurcMatch} onChange={setNurcMatch} />
                            </div>

                            {!nurcMatch && (
                                <div className="mt-2 p-4 bg-white rounded-xl border border-[#AA895F]/20 animate-fade-in-up shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center text-[#AA895F] text-xs font-bold uppercase">
                                            <PenTool size={14} className="mr-2"/> Correcciones al Perfil de Búsqueda
                                        </div>
                                        <div className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                            <RefreshCw size={10} className="mr-1 animate-spin-slow"/> Sincronización Automática
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#364649]/60 mb-3">
                                        Si la propiedad no encaja, es probable que la búsqueda del cliente haya cambiado o madurado. Registra aquí los ajustes necesarios y se <strong>actualizarán en su ficha automáticamente</strong>.
                                    </p>
                                    <textarea 
                                        value={searchCriteriaUpdate} 
                                        onChange={(e) => setSearchCriteriaUpdate(e.target.value)} 
                                        className="w-full bg-[#AA895F]/5 border border-[#AA895F]/20 rounded-lg p-3 text-sm text-[#364649] focus:outline-none focus:ring-1 focus:ring-[#AA895F] resize-none h-24 placeholder-[#AA895F]/40"
                                        placeholder="Ej: El cliente descarta planta baja definitivamente. Ahora prioriza cocina separada..."
                                    />
                                </div>
                            )}
                        </div>
                    </Section>

                    <Section title="5. Próximos Pasos" icon={<AlertTriangle size={18} />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Select label="Acción a Seguir" value={action} onChange={e => setAction(e.target.value as any)} 
                                options={[
                                    {label: 'Ofertar / Reservar', value: 'ofertar'},
                                    {label: 'Segunda Visita', value: 'segunda_visita'},
                                    {label: 'Buscar Similares', value: 'buscar_similares'},
                                    {label: 'Descartar Cliente', value: 'descartar'}
                                ]} 
                            />
                            <Input label="Fecha Seguimiento" type="date" value={followUpDate} onChange={setFollowUpDate} />
                        </div>
                    </Section>
                </div>
            )}

            {/* Actions */}
            <div className="fixed bottom-0 left-0 lg:left-20 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#364649]/10 flex justify-end gap-4 z-50">
                <button type="button" onClick={onCancel} className="px-6 py-2 text-[#364649]/60 font-bold hover:text-[#364649] transition-colors">Cancelar</button>
                <button type="submit" className="bg-[#364649] text-white px-8 py-2 rounded-xl hover:bg-[#2A3638] flex items-center font-bold shadow-lg shadow-[#364649]/20 transition-all hover:-translate-y-1">
                    <Save className="mr-2" size={18} /> {initialData ? 'Actualizar Visita' : 'Agendar Visita'}
                </button>
            </div>

        </form>
    </div>
  );
};

export default VisitForm;