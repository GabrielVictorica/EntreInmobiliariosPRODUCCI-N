import React, { useState, useEffect } from 'react';
import { Save, User, Wallet, Search, Clock, AlertTriangle, Info, BrainCircuit, RefreshCw } from 'lucide-react';
import { BuyerSearchRecord, SearchStatus, PropertyType, PropertyRecord, Currency, BuyerClientRecord, PaymentMethod } from '../types';

interface BuyerSearchFormProps {
  clients: BuyerClientRecord[]; // To select the person
  properties: PropertyRecord[]; // Stock for linking
  onSave: (record: BuyerSearchRecord) => void;
  onCancel: () => void;
  initialData?: BuyerSearchRecord | null;
  defaultClientId?: string;
}

const BuyerSearchForm: React.FC<BuyerSearchFormProps> = ({ clients, properties, onSave, onCancel, initialData, defaultClientId }) => {
  // --- Form State ---
  const [buyerClientId, setBuyerClientId] = useState(defaultClientId || '');
  const [status, setStatus] = useState<SearchStatus>('activo');
  const [agentName, setAgentName] = useState('');

  // Search Profile (NURC)
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [zones, setZones] = useState(''); 
  const [minReq, setMinReq] = useState({ bedrooms: '', bathrooms: '', totalSurface: '' });
  const [exclusions, setExclusions] = useState({ 
    mustHaveGarage: false, mustHaveOutdoor: false, mortgageRequired: false, acceptsOffPlan: false 
  });

  // Urgency
  const [urgency, setUrgency] = useState<{
    timeline: BuyerSearchRecord['searchProfile']['timeline'];
    trigger: BuyerSearchRecord['searchProfile']['trigger'];
    availability: string;
  }>({
    timeline: 'sin_apuro',
    trigger: 'otro',
    availability: ''
  });

  // Resources
  const [resources, setResources] = useState<{
    maxBudget: string;
    currency: Currency;
    paymentMethod: BuyerSearchRecord['searchProfile']['paymentMethod'];
    acceptsSwap: boolean;
  }>({
    maxBudget: '',
    currency: 'USD',
    paymentMethod: 'contado',
    acceptsSwap: false
  });

  const [salesCondition, setSalesCondition] = useState({
    needsToSell: false,
    isPropertyCaptured: false,
    linkedPropertyId: ''
  });

  // Capacity
  const [decisionMakers, setDecisionMakers] = useState('');

  // NURC Notes (New)
  const [nurcNotes, setNurcNotes] = useState({
    n: '', u: '', r: '', c: '', updates: ''
  });

  // --- Population Logic ---
  useEffect(() => {
    if (initialData) {
      setBuyerClientId(initialData.buyerClientId);
      setStatus(initialData.status);
      setAgentName(initialData.agentName);
      
      const sp = initialData.searchProfile;
      setPropertyTypes(sp.propertyTypes);
      setZones(sp.zones.join(', '));
      setMinReq({
        bedrooms: sp.minRequirements.bedrooms.toString(),
        bathrooms: sp.minRequirements.bathrooms.toString(),
        totalSurface: sp.minRequirements.totalSurface.toString()
      });
      setExclusions(sp.exclusions);
      setUrgency({
        timeline: sp.timeline,
        trigger: sp.trigger,
        availability: sp.availability
      });
      setResources({
        maxBudget: sp.budget.max.toString(),
        currency: sp.budget.currency,
        paymentMethod: sp.paymentMethod,
        acceptsSwap: sp.acceptsSwap
      });
      setSalesCondition({
        needsToSell: sp.salesCondition.needsToSell,
        isPropertyCaptured: sp.salesCondition.isPropertyCaptured,
        linkedPropertyId: sp.salesCondition.linkedPropertyId || ''
      });
      setDecisionMakers(sp.decisionMakers);
      if (sp.nurcNotes) {
        setNurcNotes({
            n: sp.nurcNotes.n || '',
            u: sp.nurcNotes.u || '',
            r: sp.nurcNotes.r || '',
            c: sp.nurcNotes.c || '',
            updates: sp.nurcNotes.updates || ''
        });
      }
    } else if (defaultClientId) {
      setBuyerClientId(defaultClientId);
    }
  }, [initialData, defaultClientId]);

  // --- Handlers ---
  const togglePropertyType = (type: PropertyType) => {
    setPropertyTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerClientId) {
        alert("Debes seleccionar un cliente comprador");
        return;
    }
    
    const record: BuyerSearchRecord = {
      id: initialData ? initialData.id : `BS-${Date.now()}`,
      buyerClientId,
      status,
      agentName: agentName || 'Agente Actual',
      searchProfile: {
        propertyTypes,
        zones: zones.split(',').map(z => z.trim()).filter(z => z !== ''),
        minRequirements: {
          bedrooms: Number(minReq.bedrooms) || 0,
          bathrooms: Number(minReq.bathrooms) || 0,
          totalSurface: Number(minReq.totalSurface) || 0
        },
        exclusions,
        timeline: urgency.timeline,
        trigger: urgency.trigger,
        availability: urgency.availability,
        budget: {
          max: Number(resources.maxBudget) || 0,
          currency: resources.currency
        },
        paymentMethod: resources.paymentMethod,
        salesCondition: {
            needsToSell: salesCondition.needsToSell,
            isPropertyCaptured: salesCondition.isPropertyCaptured,
            linkedPropertyId: salesCondition.linkedPropertyId || undefined
        },
        acceptsSwap: resources.acceptsSwap,
        decisionMakers,
        nurcNotes
      },
      createdAt: initialData ? initialData.createdAt : new Date().toISOString()
    };

    onSave(record);
  };

  const getStatusColor = (s: SearchStatus) => {
    switch(s) {
        case 'activo': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        case 'pausa': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        case 'concretado': return 'bg-[#AA895F]/10 text-[#AA895F] border-[#AA895F]/20';
        case 'caido': return 'bg-red-500/10 text-red-600 border-red-500/20';
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-fade-in-up pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#364649] rounded-2xl flex items-center justify-center shadow-lg shadow-[#364649]/20 animate-scale-in">
              <BrainCircuit className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#364649]">{initialData ? 'Editar Búsqueda' : 'Nueva Búsqueda (NURC)'}</h2>
              <p className="text-[#364649]/60 text-sm font-medium">Guía de entrevista y calificación.</p>
            </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-white/50 p-1.5 rounded-xl border border-[#364649]/10">
            {(['activo', 'pausa', 'concretado', 'caido'] as SearchStatus[]).map((s) => (
                <button
                    key={s} type="button" onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        status === s ? getStatusColor(s) + ' shadow-sm scale-105' : 'text-[#364649]/40 hover:bg-white/50'
                    }`}
                >
                    {s}
                </button>
            ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* SECTION 1: IDENTIFICATION */}
        <Section title="1. Cliente y Responsable" icon={<User size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-bold text-[#AA895F] uppercase mb-1">Cliente Comprador (Vinculación)</label>
                    <select 
                        value={buyerClientId} onChange={e => setBuyerClientId(e.target.value)}
                        className="w-full bg-[#364649] text-white rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-[#AA895F] outline-none shadow-lg transition-all"
                    >
                        <option value="">-- Seleccionar Comprador --</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <Input label="Agente Asignado" value={agentName} onChange={setAgentName} />
            </div>
        </Section>

        {/* --- A) NEED --- */}
        <Section title="A) Necesidad (El Producto)" icon={<Search size={18} />}>
            <InterviewGuide questions={[
                "¿Cuál es el motivo profundo de la compra? (Mudanza, Inversión, etc.)",
                "¿Qué es innegociable? ¿Qué cosa te haría descartar una casa apenas la ves?",
                "¿Ya viste propiedades que te gustaron? ¿Por qué no las compraste?"
            ]} color="#708F96"/>
            
            <div className="mb-6">
                <label className="text-[10px] font-bold text-[#364649]/60 uppercase mb-2 block">Tipo de Propiedad (Múltiple)</label>
                <div className="flex flex-wrap gap-2">
                    {['departamento', 'casa', 'ph', 'terreno', 'local', 'oficina'].map((t) => (
                        <button
                            key={t} type="button" onClick={() => togglePropertyType(t as PropertyType)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                                propertyTypes.includes(t as PropertyType) 
                                ? 'bg-[#708F96] text-white border-[#708F96]' 
                                : 'bg-white border-[#364649]/10 text-[#364649]/60 hover:border-[#708F96]'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input label="Zonas / Barrios de Interés" value={zones} onChange={setZones} placeholder="Ej: Centro, Norte..." />
                <div className="grid grid-cols-3 gap-3">
                    <Input label="Dorm. Min" type="number" value={minReq.bedrooms} onChange={v => setMinReq({...minReq, bedrooms: v})} />
                    <Input label="Baños Min" type="number" value={minReq.bathrooms} onChange={v => setMinReq({...minReq, bathrooms: v})} />
                    <Input label="M² Totales" type="number" value={minReq.totalSurface} onChange={v => setMinReq({...minReq, totalSurface: v})} />
                </div>
            </div>

            <div className="bg-[#AA895F]/5 p-4 rounded-xl border border-[#AA895F]/10 mb-6">
                <h4 className="text-xs font-bold text-[#AA895F] uppercase mb-3">Excluyentes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Toggle label="Cochera" checked={exclusions.mustHaveGarage} onChange={v => setExclusions({...exclusions, mustHaveGarage: v})} />
                    <Toggle label="Exterior" checked={exclusions.mustHaveOutdoor} onChange={v => setExclusions({...exclusions, mustHaveOutdoor: v})} />
                    <Toggle label="Apto Crédito" checked={exclusions.mortgageRequired} onChange={v => setExclusions({...exclusions, mortgageRequired: v})} />
                    <Toggle label="Pozo" checked={exclusions.acceptsOffPlan} onChange={v => setExclusions({...exclusions, acceptsOffPlan: v})} />
                </div>
            </div>

            <NoteArea label="Notas / Observaciones (Necesidad)" value={nurcNotes.n} onChange={v => setNurcNotes({...nurcNotes, n: v})} />
        </Section>

        {/* --- B) URGENCY --- */}
        <Section title="B) Urgencia (El Tiempo)" icon={<Clock size={18} />}>
            <InterviewGuide questions={[
                "¿Si hoy encontramos la casa exacta, estás listo para reservar mañana?",
                "¿Qué consecuencia tenés si no comprás antes de [Fecha]?",
                "¿Tenés disponibilidad real para ver propiedades esta semana?"
            ]} color="#AA895F"/>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                 <Select label="Horizonte Temporal" value={urgency.timeline} onChange={e => setUrgency({...urgency, timeline: e.target.value as any})} 
                    options={[
                        {label: 'Inmediato (< 30 días)', value: 'inmediato'},
                        {label: '30 a 60 días', value: '30_60_dias'},
                        {label: '6 meses', value: '6_meses'},
                        {label: 'Sin apuro', value: 'sin_apuro'}
                    ]}
                 />
                 <Select label="Detonante" value={urgency.trigger} onChange={e => setUrgency({...urgency, trigger: e.target.value as any})} 
                    options={[
                        {label: 'Vencimiento Alquiler', value: 'vencimiento_alquiler'},
                        {label: 'Cambio Familiar', value: 'cambio_familia'},
                        {label: 'Inversión', value: 'inversion'},
                        {label: 'Otro', value: 'otro'}
                    ]}
                 />
                 <Input label="Disponibilidad Visitas" value={urgency.availability} onChange={v => setUrgency({...urgency, availability: v})} placeholder="Ej: Sábados por la mañana" />
            </div>

            <NoteArea label="Notas / Observaciones (Urgencia)" value={nurcNotes.u} onChange={v => setNurcNotes({...nurcNotes, u: v})} />
        </Section>

        {/* --- C) RESOURCES --- */}
        <Section title="C) Recursos (Presupuesto)" icon={<Wallet size={18} />}>
            <InterviewGuide questions={[
                "¿Contás con el capital disponible ya o dependés de una venta/crédito?",
                "¿El dinero está en el país y libre, o hay que traerlo/desarmar inversiones?",
                "¿Hasta qué valor te podés estirar si aparece una oportunidad única?"
            ]} color="#364649"/>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1 relative">
                    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Presupuesto Máximo</label>
                    <div className="flex">
                        <select 
                           value={resources.currency} 
                           onChange={e => setResources({...resources, currency: e.target.value as any})}
                           className="bg-[#364649] text-white rounded-l-lg px-3 py-2 text-sm font-bold outline-none"
                        >
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                        </select>
                        <input 
                            type="number" 
                            value={resources.maxBudget} 
                            onChange={e => setResources({...resources, maxBudget: e.target.value})} 
                            className="w-full bg-white border border-[#364649]/10 rounded-r-lg px-3 py-2 outline-none focus:border-[#AA895F]" 
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <Select label="Forma de Pago" value={resources.paymentMethod} onChange={e => setResources({...resources, paymentMethod: e.target.value as any})} 
                    options={[
                        {label: 'Contado', value: 'contado'},
                        {label: 'Crédito Hipotecario', value: 'credito'},
                        {label: 'Financiación Privada', value: 'financiacion'}
                    ]}
                />
                <div className="flex items-end pb-2">
                    <Toggle label="¿Acepta Permuta?" checked={resources.acceptsSwap} onChange={v => setResources({...resources, acceptsSwap: v})} />
                </div>
            </div>

            <div className="bg-white/50 p-5 rounded-xl border border-[#364649]/10 mb-6">
                <div className="flex justify-between items-center mb-4">
                     <h4 className="text-sm font-bold text-[#364649]">Venta Simultánea</h4>
                     <Toggle label="Necesita vender para comprar" checked={salesCondition.needsToSell} onChange={v => setSalesCondition({...salesCondition, needsToSell: v})} />
                </div>

                {salesCondition.needsToSell && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                         <div>
                            <label className="text-xs font-bold text-[#364649]/60 block mb-2">¿Propiedad Captada?</label>
                            <div className="flex space-x-2">
                                <button type="button" onClick={() => setSalesCondition({...salesCondition, isPropertyCaptured: true})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${salesCondition.isPropertyCaptured ? 'bg-[#364649] text-white border-[#364649]' : 'bg-white text-[#364649] hover:bg-[#364649]/5'}`}>
                                    SÍ, EN STOCK
                                </button>
                                <button type="button" onClick={() => setSalesCondition({...salesCondition, isPropertyCaptured: false})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${!salesCondition.isPropertyCaptured ? 'bg-[#AA895F] text-white border-[#AA895F]' : 'bg-white text-[#AA895F] hover:bg-[#AA895F]/5'}`}>
                                    NO
                                </button>
                            </div>
                        </div>
                        
                        {salesCondition.isPropertyCaptured ? (
                            <div>
                                <label className="text-xs font-bold text-[#364649]/60 block mb-2">Vincular Propiedad</label>
                                <select 
                                    value={salesCondition.linkedPropertyId}
                                    onChange={e => setSalesCondition({...salesCondition, linkedPropertyId: e.target.value})}
                                    className="w-full bg-white border border-[#364649]/20 rounded-lg px-3 py-2 text-sm outline-none"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.customId} - {p.address.street}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center bg-[#AA895F]/10 border border-[#AA895F] rounded-lg p-3 text-[#AA895F] text-xs font-bold">
                                <AlertTriangle size={16} className="mr-2" />
                                <span>¡Oportunidad! Agendar tasación urgente.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <NoteArea label="Notas / Observaciones (Recursos)" value={nurcNotes.r} onChange={v => setNurcNotes({...nurcNotes, r: v})} />
        </Section>

        {/* --- D) CAPACITY --- */}
        <Section title="D) Capacidad (Decisores)" icon={<User size={18} />}>
            <InterviewGuide questions={[
                "¿Quién más, además de vos, tiene que ver la propiedad para dar el OK?",
                "¿Están todos los titulares de acuerdo y listos para firmar?",
                "¿Hay alguna inhibición o traba legal que debamos saber?"
            ]} color="#708F96"/>

            <div className="mb-6">
                <label className="text-[10px] font-bold text-[#364649]/60 uppercase mb-1 block">Decisores y Firmantes</label>
                <Input value={decisionMakers} onChange={setDecisionMakers} placeholder="Ej: Decide él, paga la empresa, firma el apoderado..." />
            </div>

            <NoteArea label="Notas / Observaciones (Capacidad)" value={nurcNotes.c} onChange={v => setNurcNotes({...nurcNotes, c: v})} />
        </Section>
        
        {/* --- E) AJUSTES (UPDATES) --- */}
        <div className="bg-white/40 border border-white rounded-2xl p-6 hover:shadow-md transition-all duration-500">
             <div className="flex items-center mb-6 pb-2 border-b border-[#364649]/5">
                 <div className="text-orange-700 mr-2"><RefreshCw size={18} /></div>
                 <h3 className="text-lg font-bold text-[#364649]">5. Ajustes y Correcciones (Feedback)</h3>
             </div>
             <p className="text-xs text-[#364649]/60 mb-3">Historial de cambios realizados automáticamente desde el módulo de Visitas o manualmente.</p>
             <NoteArea label="Bitácora de Ajustes" value={nurcNotes.updates} onChange={v => setNurcNotes({...nurcNotes, updates: v})} />
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 lg:left-20 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#364649]/10 flex justify-end gap-4 z-50">
           <button type="button" onClick={onCancel} className="px-6 py-2 text-[#364649]/60 font-bold hover:text-[#364649] transition-colors">Cancelar</button>
           <button type="submit" className="bg-[#364649] text-white px-8 py-2 rounded-xl hover:bg-[#2A3638] flex items-center font-bold shadow-lg shadow-[#364649]/20 transition-all hover:-translate-y-1">
             <Save className="mr-2" size={18} /> {initialData ? 'Actualizar Búsqueda' : 'Guardar Búsqueda'}
           </button>
        </div>
      </form>
    </div>
  );
};

// --- Sub-Components ---
const InterviewGuide = ({ questions, color }: { questions: string[], color: string }) => (
    <div className="mb-6 p-4 rounded-xl border-l-4 bg-white/40 shadow-sm" style={{ borderColor: color }}>
        <h5 className="font-bold text-xs uppercase flex items-center mb-3" style={{ color: color }}>
            <Info size={14} className="mr-2" /> Sugerencias de Entrevista
        </h5>
        <ul className="space-y-2">
            {questions.map((q, i) => (
                <li key={i} className="text-sm text-[#364649]/80 italic flex items-start">
                    <span className="mr-2 text-[10px] mt-1">•</span>
                    {q}
                </li>
            ))}
        </ul>
    </div>
);
const NoteArea = ({ label, value, onChange }: any) => (
    <div>
        <label className="text-[10px] font-bold text-[#364649]/60 uppercase mb-2 block">{label}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/50 border border-[#364649]/10 rounded-xl p-3 text-[#364649] text-sm h-20 outline-none focus:border-[#708F96] focus:bg-white resize-none" placeholder="Observaciones..." />
    </div>
);
const Section = ({ title, icon, children }: any) => (
  <div className="bg-white/40 border border-white rounded-2xl p-6 hover:shadow-md transition-all duration-500">
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
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] outline-none focus:border-[#708F96] transition-all shadow-sm" />
  </div>
);
const Select = ({ label, value, onChange, options }: any) => (
    <div>
        <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{label}</label>
        <div className="relative">
            <select value={value} onChange={onChange} className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] outline-none focus:border-[#708F96] appearance-none shadow-sm">
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

export default BuyerSearchForm;