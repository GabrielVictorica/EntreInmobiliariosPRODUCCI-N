import React, { useState, useEffect } from 'react';
import { Save, Building2, MapPin, DollarSign, Ruler, FileText, Key, Box, CheckSquare, UploadCloud, Image as ImageIcon, FileBadge, Receipt } from 'lucide-react';
import { PropertyRecord, PropertyType, ClientRecord, ZoningData, LayoutConfig } from '../types';

interface PropertyFormProps {
  clients: ClientRecord[];
  onSave: (property: PropertyRecord) => void;
  onCancel: () => void;
  initialData?: PropertyRecord | null;
  defaultClientId?: string;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ clients, onSave, onCancel, initialData, defaultClientId }) => {
  // --- Form State ---
  const [clientId, setClientId] = useState(defaultClientId || '');
  const [customId, setCustomId] = useState('');
  const [status, setStatus] = useState<PropertyRecord['status']>('disponible');
  const [type, setType] = useState<PropertyType>('departamento');

  // Location
  const [address, setAddress] = useState({ 
    street: '', number: '', floor: '', unit: '', neighborhood: '', nomenclatura: '' 
  });
  
  // New Zoning Object
  const [zoning, setZoning] = useState<ZoningData>({
    code: '', fot: '', fos: '', tps: '', maxHeight: ''
  });
  
  // Financials
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD');
  const [creditEligible, setCreditEligible] = useState(false);

  // Surfaces
  const [surface, setSurface] = useState({ covered: '', semiCovered: '', uncovered: '', lotFront: '', lotDepth: '' });
  const [totalSurface, setTotalSurface] = useState(0); // Read-only

  // Physical
  const [features, setFeatures] = useState<{
    bedrooms: string;
    bathrooms: string;
    toilettes: string;
    age: string;
    condition: PropertyRecord['features']['condition'];
    orientation: PropertyRecord['features']['orientation'];
    disposition: PropertyRecord['features']['disposition'];
    parking: PropertyRecord['features']['parking'];
    parkingType: 'propia' | 'espacio';
  }>({
    bedrooms: '', bathrooms: '', toilettes: '', age: '',
    condition: 'muy_bueno', orientation: 'norte', disposition: 'frente',
    parking: 'none', parkingType: 'propia'
  });

  // Layout Config for Auto-Rooms
  const [layout, setLayout] = useState<LayoutConfig>({
    kitchen: 'separada',
    living: 'integrado' // Integrado means Living-Dining together (1 room)
  });
  const [calculatedRooms, setCalculatedRooms] = useState(0);

  // Amenities & HVAC
  const [amenities, setAmenities] = useState<string[]>([]);
  const [hvac, setHvac] = useState('individual'); // Will be cast to specific enum

  // Legal
  const [legal, setLegal] = useState({ deedStatus: 'escritura', plans: 'aprobados', professionalUse: false, petsAllowed: true });

  // Expenses
  const [expenses, setExpenses] = useState({ ordinary: '', extraordinary: '', extraordinaryEndDate: '', taxesStatus: 'al_dia', services: [] as string[] });

  // Logistics
  const [logistics, setLogistics] = useState({ occupation: 'vacia', contractExpiration: '', keysLocation: 'oficina', signage: false });

  // Files (Simulated)
  const [files, setFiles] = useState<{photos: string[], documents: string[], debts: string[]}>({
    photos: [], documents: [], debts: []
  });

  // --- Population Logic for Edit Mode & Auto ID ---
  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId);
      setCustomId(initialData.customId);
      setStatus(initialData.status);
      setType(initialData.type);
      setAddress({ 
        street: initialData.address.street, 
        number: initialData.address.number, 
        floor: initialData.address.floor || '', 
        unit: initialData.address.unit || '', 
        neighborhood: initialData.address.neighborhood, 
        nomenclatura: initialData.address.nomenclatura || '' 
      });
      setZoning(initialData.address.zoning);
      setPrice(initialData.price.toString());
      setCurrency(initialData.currency);
      setCreditEligible(initialData.creditEligible);
      setSurface({
        covered: initialData.surface.covered.toString(),
        semiCovered: initialData.surface.semiCovered.toString(),
        uncovered: initialData.surface.uncovered.toString(),
        lotFront: initialData.surface.lotFront?.toString() || '',
        lotDepth: initialData.surface.lotDepth?.toString() || ''
      });
      setFeatures({
        bedrooms: initialData.features.bedrooms.toString(),
        bathrooms: initialData.features.bathrooms.toString(),
        toilettes: initialData.features.toilettes.toString(),
        age: initialData.features.age?.toString() || '',
        condition: initialData.features.condition,
        orientation: initialData.features.orientation,
        disposition: initialData.features.disposition,
        parking: initialData.features.parking,
        parkingType: initialData.features.parkingType || 'propia'
      });
      setLayout(initialData.features.layout);
      setAmenities(initialData.amenities);
      setHvac(initialData.hvac);
      setLegal({
        deedStatus: initialData.legal.deedStatus,
        plans: initialData.legal.plans,
        professionalUse: initialData.legal.rules.professionalUse,
        petsAllowed: initialData.legal.rules.petsAllowed
      });
      setExpenses({
        ordinary: initialData.expenses.ordinary?.toString() || '',
        extraordinary: initialData.expenses.extraordinary?.toString() || '',
        extraordinaryEndDate: initialData.expenses.extraordinaryEndDate || '',
        taxesStatus: initialData.expenses.taxesStatus as any,
        services: initialData.expenses.services
      });
      setLogistics({
        occupation: initialData.logistics.occupation,
        contractExpiration: initialData.logistics.contractExpiration || '',
        keysLocation: initialData.logistics.keysLocation,
        signage: initialData.logistics.signage
      });
      setFiles(initialData.files);
    } else {
      // Automatic ID generation for new properties
      if (!customId) {
        setCustomId(`PROP-${Math.floor(100000 + Math.random() * 900000)}`);
      }
      // If defaultClientId is provided (from "Assign Property"), ensure it's set
      if (defaultClientId && !clientId) {
        setClientId(defaultClientId);
      }
    }
  }, [initialData, defaultClientId]);

  // --- Logic Helpers ---
  const isLand = type === 'terreno';
  const isApartment = type === 'departamento';
  const isHouseOrPH = type === 'casa' || type === 'ph' || type === 'terreno';

  // 3. Auto-Calculate Total Surface
  useEffect(() => {
    const total = (Number(surface.covered) || 0) + (Number(surface.semiCovered) || 0) + (Number(surface.uncovered) || 0);
    setTotalSurface(total);
  }, [surface.covered, surface.semiCovered, surface.uncovered]);

  // 4. Auto-Calculate Ambientes (Rooms)
  useEffect(() => {
    const bedrooms = Number(features.bedrooms) || 0;
    let livingRooms = 1; 
    
    if (layout.living === 'separado' || layout.living === 'doble') {
      livingRooms = 2;
    }
    
    setCalculatedRooms(bedrooms + livingRooms);
  }, [features.bedrooms, layout.living]);


  // Toggle helpers
  const toggleAmenity = (item: string) => {
    setAmenities(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleService = (item: string) => {
    setExpenses(prev => ({
       ...prev, 
       services: prev.services.includes(item) ? prev.services.filter(i => i !== item) : [...prev.services, item]
    }));
  };

  const handleFileUpload = (section: 'photos' | 'documents' | 'debts') => {
    // Simulated upload
    const mockImage = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop";
    const fileName = section === 'photos' ? mockImage : `archivo_${section}_${Date.now()}.pdf`;
    
    setFiles(prev => ({...prev, [section]: [...prev[section], fileName]}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
        alert("Debe vincular un propietario");
        return;
    }

    const newProperty: PropertyRecord = {
      id: initialData ? initialData.id : Date.now().toString(),
      clientId,
      customId: customId, // Use the state ID
      status,
      type,
      address: { ...address, zoning },
      price: Number(price) || 0,
      currency,
      creditEligible,
      surface: {
        covered: Number(surface.covered) || 0,
        semiCovered: Number(surface.semiCovered) || 0,
        uncovered: Number(surface.uncovered) || 0,
        total: totalSurface,
        lotFront: Number(surface.lotFront) || 0,
        lotDepth: Number(surface.lotDepth) || 0,
      },
      features: {
        ...features,
        layout,
        rooms: calculatedRooms,
        bedrooms: Number(features.bedrooms),
        bathrooms: Number(features.bathrooms),
        toilettes: Number(features.toilettes),
        age: Number(features.age),
      } as any,
      amenities,
      hvac: hvac as any,
      legal: {
        deedStatus: legal.deedStatus as any,
        plans: legal.plans as any,
        rules: { professionalUse: legal.professionalUse, petsAllowed: legal.petsAllowed }
      },
      expenses: {
        ordinary: Number(expenses.ordinary) || 0,
        extraordinary: Number(expenses.extraordinary) || 0,
        extraordinaryEndDate: expenses.extraordinaryEndDate,
        taxesStatus: expenses.taxesStatus as any,
        services: expenses.services
      },
      logistics: {
        occupation: logistics.occupation as any,
        contractExpiration: logistics.contractExpiration,
        keysLocation: logistics.keysLocation as any,
        signage: logistics.signage
      },
      files,
      createdAt: initialData ? initialData.createdAt : new Date().toISOString(),
      aiAnalysis: initialData ? initialData.aiAnalysis : undefined // Preserve if exists, or undefined
    };

    onSave(newProperty);
  };

  return (
    <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-fade-in-up pb-24">
      
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-[#AA895F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#AA895F]/20 animate-scale-in">
          <Building2 className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#364649]">{initialData ? 'Editar Propiedad' : 'Nueva Propiedad'}</h2>
          <p className="text-[#364649]/60 text-sm font-medium">Carga inteligente con autocalculado.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* 1. Identification & Link */}
        <Section title="1. Identificación y Vinculación" icon={<UserSelectIcon />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-[#AA895F] uppercase mb-1">Propietario (Vinculación)</label>
              <select 
                value={clientId} 
                onChange={e => setClientId(e.target.value)}
                className="w-full bg-[#364649] text-white rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-[#AA895F] outline-none shadow-lg transition-all"
              >
                <option value="">-- Seleccionar Vendedor --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.owners[0].name} {c.owners.length > 1 ? `(+${c.owners.length - 1})` : ''} - {c.profileType.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <Select 
              label="Tipo de Inmueble" 
              value={type} 
              onChange={e => setType(e.target.value as PropertyType)}
              options={[
                {label: 'Departamento', value: 'departamento'},
                {label: 'Casa', value: 'casa'},
                {label: 'PH', value: 'ph'},
                {label: 'Terreno', value: 'terreno'},
                {label: 'Local', value: 'local'},
                {label: 'Oficina', value: 'oficina'},
              ]}
            />

            <Select 
              label="Estado Actual" 
              value={status} 
              onChange={e => setStatus(e.target.value as any)}
              options={[
                {label: 'Disponible', value: 'disponible'},
                {label: 'Reservada', value: 'reservada'},
                {label: 'Vendida', value: 'vendida'},
                {label: 'Suspendida', value: 'suspendida'},
              ]}
            />
            
            <Input 
              label="Código Ref. (ID)" 
              value={customId} 
              onChange={() => {}} 
              placeholder="Generando..." 
              disabled={true} 
            />
          </div>
        </Section>

        {/* 2. Location & Zoning (Split) */}
        <Section title="2. Ubicación y Zonificación" icon={<MapPin size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="md:col-span-2">
                    <Input label="Calle y Número" value={address.street} onChange={v => setAddress({...address, street: v, number: v})} placeholder="Av. Libertador 1234" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Piso" value={address.floor} onChange={v => setAddress({...address, floor: v})} placeholder="PB" />
                    <Input label="Depto" value={address.unit} onChange={v => setAddress({...address, unit: v})} placeholder="A" />
                </div>
                <div className="md:col-span-2">
                   <Input label="Barrio / Localidad" value={address.neighborhood} onChange={v => setAddress({...address, neighborhood: v})} />
                </div>
                <Input label="Nomenclatura Catastral" value={address.nomenclatura} onChange={v => setAddress({...address, nomenclatura: v})} />
            </div>

            {/* Zoning Breakdown - Hidden for Apartments mostly */}
            {!isApartment && (
              <div className="mt-4 p-4 bg-[#AA895F]/5 rounded-xl border border-[#AA895F]/10">
                 <h4 className="text-xs font-bold text-[#AA895F] uppercase mb-3 flex items-center"><Ruler size={14} className="mr-1"/> Detalles de Zonificación</h4>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="md:col-span-1">
                      <Input label="Código/Zona" value={zoning.code} onChange={v => setZoning({...zoning, code: v})} placeholder="USAA" highlight />
                    </div>
                    <Input label="F.O.T." value={zoning.fot} onChange={v => setZoning({...zoning, fot: v})} />
                    <Input label="F.O.S." value={zoning.fos} onChange={v => setZoning({...zoning, fos: v})} />
                    <Input label="T.P.S." value={zoning.tps} onChange={v => setZoning({...zoning, tps: v})} />
                    <Input label="Alt. Máx" value={zoning.maxHeight} onChange={v => setZoning({...zoning, maxHeight: v})} />
                 </div>
              </div>
            )}
        </Section>

        {/* 3. Price & Surfaces (Auto Calc) */}
        <Section title="3. Valor y Superficies" icon={<DollarSign size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                 <div className="md:col-span-2 relative">
                    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Precio Publicación</label>
                    <div className="flex">
                        <select 
                           value={currency} 
                           onChange={e => setCurrency(e.target.value as any)}
                           className="bg-[#364649] text-white rounded-l-lg px-3 py-2 text-sm font-bold outline-none"
                        >
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                        </select>
                        <input 
                            type="number" 
                            value={price} 
                            onChange={e => setPrice(e.target.value)} 
                            className="w-full bg-white border border-[#364649]/10 rounded-r-lg px-3 py-2 outline-none focus:border-[#AA895F] focus:ring-1 focus:ring-[#AA895F]" 
                            placeholder="0.00"
                        />
                    </div>
                 </div>
                 <div className="flex items-center pt-6">
                     <Toggle label="Apto Crédito" checked={creditEligible} onChange={setCreditEligible} />
                 </div>
            </div>
            
            <h4 className="text-xs font-bold text-[#708F96] uppercase tracking-wider mb-4 border-b border-[#708F96]/20 pb-1">Superficies (m²)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <Input label="Cubierta" type="number" value={surface.covered} onChange={v => setSurface({...surface, covered: v})} />
                <Input label="Semicubierta" type="number" value={surface.semiCovered} onChange={v => setSurface({...surface, semiCovered: v})} />
                <Input label="Descubierta" type="number" value={surface.uncovered} onChange={v => setSurface({...surface, uncovered: v})} />
                <div className="bg-[#364649]/5 p-2 rounded-lg border border-[#364649]/10">
                   <label className="block text-[10px] font-bold text-[#364649] uppercase mb-1">TOTAL (Auto)</label>
                   <div className="text-xl font-bold text-[#364649]">{totalSurface} m²</div>
                </div>
            </div>
            
            {isHouseOrPH && (
                <div className="mt-4 p-4 bg-[#AA895F]/10 rounded-xl border border-[#AA895F]/20">
                     <label className="block text-xs font-bold text-[#AA895F] mb-2">Medidas del Lote (Metros)</label>
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Frente" type="number" value={surface.lotFront} onChange={v => setSurface({...surface, lotFront: v})} />
                        <Input label="Fondo" type="number" value={surface.lotDepth} onChange={v => setSurface({...surface, lotDepth: v})} />
                     </div>
                </div>
            )}
        </Section>

        {/* 4. Physical & Layout (Auto Rooms) */}
        {!isLand && (
            <Section title="4. Características y Distribución" icon={<Box size={18} />}>
                
                {/* Layout Configuration */}
                <div className="mb-6 p-4 bg-white/50 rounded-xl border border-[#364649]/5">
                   <h4 className="text-xs font-bold text-[#708F96] uppercase mb-3">Distribución de Ambientes</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select label="Tipo de Living" value={layout.living} onChange={e => setLayout({...layout, living: e.target.value as any})} 
                        options={[{label: 'Integrado (Comedor)', value: 'integrado'}, {label: 'Separado (Living + Comedor)', value: 'separado'}, {label: 'Doble Living', value: 'doble'}]} 
                      />
                      <Select label="Tipo de Cocina" value={layout.kitchen} onChange={e => setLayout({...layout, kitchen: e.target.value as any})} 
                        options={[{label: 'Separada', value: 'separada'}, {label: 'Integrada', value: 'integrada'}, {label: 'Kitchenette', value: 'kitchenette'}]} 
                      />
                      <Input label="Dormitorios" type="number" value={features.bedrooms} onChange={v => setFeatures({...features, bedrooms: v})} />
                   </div>
                   <div className="mt-4 flex justify-end">
                      <div className="bg-[#708F96]/10 px-4 py-2 rounded-lg border border-[#708F96]/20 flex items-center">
                         <span className="text-xs font-bold text-[#708F96] uppercase mr-2">Ambientes Totales (Auto):</span>
                         <span className="text-lg font-bold text-[#364649]">{calculatedRooms}</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <Input label="Baños Completos" type="number" value={features.bathrooms} onChange={v => setFeatures({...features, bathrooms: v})} />
                    <Input label="Toilettes" type="number" value={features.toilettes} onChange={v => setFeatures({...features, toilettes: v})} />
                    
                    <Input label="Antigüedad (años)" type="number" value={features.age} onChange={v => setFeatures({...features, age: v})} />
                    <Select label="Estado" value={features.condition} onChange={e => setFeatures({...features, condition: e.target.value as any})} options={[{label:'A Estrenar', value:'a_estrenar'}, {label:'Muy Bueno', value:'muy_bueno'}, {label:'Bueno', value:'bueno'}, {label:'A Reciclar', value:'a_reciclar'}, {label:'Demolición', value:'demolicion'}]} />
                    <Select label="Orientación" value={features.orientation} onChange={e => setFeatures({...features, orientation: e.target.value as any})} options={[{label:'Norte', value:'norte'}, {label:'Sur', value:'sur'}, {label:'Este', value:'este'}, {label:'Oeste', value:'oeste'}]} />
                    <Select label="Disposición" value={features.disposition} onChange={e => setFeatures({...features, disposition: e.target.value as any})} options={[{label:'Frente', value:'frente'}, {label:'Contrafrente', value:'contrafrente'}, {label:'Lateral', value:'lateral'}, {label:'Interno', value:'interno'}]} />
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="Cocheras" value={features.parking} onChange={e => setFeatures({...features, parking: e.target.value as any})} options={[{label:'No tiene', value:'none'}, {label:'Cubierta', value:'covered'}, {label:'Descubierta', value:'uncovered'}]} />
                    {features.parking !== 'none' && (
                        <Select label="Tipo Cochera" value={features.parkingType} onChange={e => setFeatures({...features, parkingType: e.target.value as any})} options={[{label:'Unidad Propia', value:'propia'}, {label:'Espacio Guardacoche', value:'espacio'}]} />
                    )}
                </div>
            </Section>
        )}

        {/* 5. Amenities & HVAC (Specific Enum) */}
        {!isLand && (
            <Section title="5. Amenities y Detalles" icon={<CheckSquare size={18} />}>
                <div className="flex flex-wrap gap-3 mb-6">
                    {['Seguridad 24hs', 'Pileta', 'SUM', 'Parrilla', 'Gimnasio', 'Laundry', 'Solarium'].map(opt => (
                        <button 
                            key={opt} type="button" onClick={() => toggleAmenity(opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${amenities.includes(opt) ? 'bg-[#708F96] text-white border-[#708F96]' : 'bg-white text-[#364649]/60 border-[#364649]/20 hover:border-[#708F96]'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                <div className="max-w-xs">
                     <Select label="Calefacción" value={hvac} onChange={e => setHvac(e.target.value)} 
                       options={[
                         {label:'Tradicional (Gas/Estufas)', value:'gas'}, 
                         {label:'Radiadores (Caldera)', value:'radiadores'}, 
                         {label:'Losa Radiante', value:'losa'},
                         {label:'Central', value:'central'},
                         {label:'Eléctrica (AA/Paneles)', value:'electrica'}
                       ]} 
                     />
                </div>
            </Section>
        )}

        {/* 6. Legal (Plans removed invalid option) */}
        <Section title="6. Situación Legal" icon={<FileText size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Select label="Documentación" value={legal.deedStatus} onChange={e => setLegal({...legal, deedStatus: e.target.value as any})} options={[{label:'Escritura Perfecta', value:'escritura'}, {label:'Boleto Compraventa', value:'boleto'}, {label:'Cesión de Derechos', value:'cesion'}]} />
                 <Select label="Planos" value={legal.plans} onChange={e => setLegal({...legal, plans: e.target.value as any})} 
                    options={[{label:'Aprobados', value:'aprobados'}, {label:'No tiene', value:'no_tiene'}, {label:'Desactualizados', value:'desactualizados'}]} 
                 />
                 
                 <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold text-[#364649]/60 uppercase">Reglamento</label>
                     <div className="flex gap-4">
                        <Toggle label="Apto Prof." checked={legal.professionalUse} onChange={v => setLegal({...legal, professionalUse: v})} />
                        <Toggle label="Mascotas" checked={legal.petsAllowed} onChange={v => setLegal({...legal, petsAllowed: v})} />
                     </div>
                 </div>
            </div>
        </Section>

        {/* 7. Expenses */}
        <Section title="7. Gastos y Deudas" icon={<DollarSign size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                 <Input label="Expensas Ordinarias ($)" type="number" value={expenses.ordinary} onChange={v => setExpenses({...expenses, ordinary: v})} highlight={isApartment} />
                 <Input label="Extraordinarias ($)" type="number" value={expenses.extraordinary} onChange={v => setExpenses({...expenses, extraordinary: v})} />
                 <Select label="Estado Impuestos (ABL/Rentas)" value={expenses.taxesStatus} onChange={e => setExpenses({...expenses, taxesStatus: e.target.value as any})} options={[{label:'Al día', value:'al_dia'}, {label:'Con Deuda', value:'deuda'}]} />
            </div>
            <div className="flex gap-4 items-center">
                 <span className="text-xs font-bold text-[#364649]/60 uppercase mr-2">Servicios Conectados:</span>
                 {['Luz', 'Gas', 'Agua'].map(s => (
                    <label key={s} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={expenses.services.includes(s)} onChange={() => toggleService(s)} className="accent-[#AA895F]" />
                        <span className="text-sm text-[#364649]">{s}</span>
                    </label>
                 ))}
            </div>
        </Section>

        {/* 8. Logistics (Keys updated) */}
        <Section title="8. Ocupación y Llaves" icon={<Key size={18} />}>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Select label="Situación Ocupación" value={logistics.occupation} onChange={e => setLogistics({...logistics, occupation: e.target.value as any})} options={[{label:'Vacía', value:'vacia'}, {label:'Alquilada (Con Renta)', value:'alquilada'}, {label:'Habitada por Dueño', value:'habitada'}]} />
                 
                 {logistics.occupation === 'alquilada' && (
                     <Input label="Vencimiento Contrato" type="date" value={logistics.contractExpiration} onChange={v => setLogistics({...logistics, contractExpiration: v})} highlight />
                 )}

                 <Select label="Ubicación Llaves" value={logistics.keysLocation} onChange={e => setLogistics({...logistics, keysLocation: e.target.value as any})} 
                   options={[
                     {label:'Oficina', value:'oficina'}, 
                     {label:'Coordinar c/ Dueño/Familiar', value:'dueño'}, 
                     {label:'Coordinar c/ Inquilino', value:'inquilino'}
                   ]} 
                 />
                 
                 <div className="flex items-end pb-2">
                    <Toggle label="Cartel Colocado" checked={logistics.signage} onChange={v => setLogistics({...logistics, signage: v})} />
                 </div>
             </div>
        </Section>

        {/* 9. File Uploads (New Section) */}
        <Section title="9. Archivos y Documentación" icon={<UploadCloud size={18} />}>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Photos */}
              <div className="bg-white/50 rounded-xl p-4 border border-[#364649]/5 flex flex-col items-center text-center">
                 <div className="w-10 h-10 bg-[#AA895F]/10 text-[#AA895F] rounded-full flex items-center justify-center mb-2">
                    <ImageIcon size={20} />
                 </div>
                 <h5 className="font-bold text-sm text-[#364649] mb-1">Fotos Propiedad</h5>
                 <p className="text-xs text-[#364649]/50 mb-3">{files.photos.length} archivos</p>
                 <button type="button" onClick={() => handleFileUpload('photos')} className="text-xs bg-[#AA895F] text-white px-3 py-1.5 rounded-lg hover:bg-[#967851] transition-colors w-full">Subir Fotos</button>
                 {files.photos.length > 0 && (
                    <div className="mt-3 w-full grid grid-cols-3 gap-1">
                      {files.photos.map((f, i) => (
                        <img key={i} src={f} className="w-full h-12 object-cover rounded-md border border-[#364649]/10" alt={`prop-${i}`} />
                      ))}
                    </div>
                 )}
              </div>

              {/* Legal Docs */}
              <div className="bg-white/50 rounded-xl p-4 border border-[#364649]/5 flex flex-col items-center text-center">
                 <div className="w-10 h-10 bg-[#708F96]/10 text-[#708F96] rounded-full flex items-center justify-center mb-2">
                    <FileBadge size={20} />
                 </div>
                 <h5 className="font-bold text-sm text-[#364649] mb-1">Documentación Legal</h5>
                 <p className="text-xs text-[#364649]/50 mb-3">Escrituras, Planos</p>
                 <button type="button" onClick={() => handleFileUpload('documents')} className="text-xs bg-[#708F96] text-white px-3 py-1.5 rounded-lg hover:bg-[#5C7A80] transition-colors w-full">Subir Docs</button>
                 {files.documents.length > 0 && (
                   <ul className="w-full text-left mt-3 text-[10px] text-[#364649]/70 space-y-1">
                      {files.documents.map((f, i) => <li key={i} className="truncate">• {f}</li>)}
                   </ul>
                 )}
              </div>

              {/* Debt Docs */}
              <div className="bg-white/50 rounded-xl p-4 border border-[#364649]/5 flex flex-col items-center text-center">
                 <div className="w-10 h-10 bg-[#364649]/10 text-[#364649] rounded-full flex items-center justify-center mb-2">
                    <Receipt size={20} />
                 </div>
                 <h5 className="font-bold text-sm text-[#364649] mb-1">Libre Deuda / Facturas</h5>
                 <p className="text-xs text-[#364649]/50 mb-3">ABL, Expensas, Servicios</p>
                 <button type="button" onClick={() => handleFileUpload('debts')} className="text-xs bg-[#364649] text-white px-3 py-1.5 rounded-lg hover:bg-[#2A3638] transition-colors w-full">Subir Comprobantes</button>
                 {files.debts.length > 0 && (
                   <ul className="w-full text-left mt-3 text-[10px] text-[#364649]/70 space-y-1">
                      {files.debts.map((f, i) => <li key={i} className="truncate">• {f}</li>)}
                   </ul>
                 )}
              </div>

           </div>
        </Section>

        {/* Actions Footer */}
        <div className="fixed bottom-0 left-0 lg:left-20 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#364649]/10 flex justify-end gap-4 z-50">
           <button 
             type="button" 
             onClick={onCancel}
             className="px-6 py-2 text-[#364649]/60 font-bold hover:text-[#364649] transition-colors"
           >
             Cancelar
           </button>
           <button 
             type="submit"
             className="bg-[#AA895F] text-white px-8 py-2 rounded-xl hover:bg-[#967851] flex items-center font-bold shadow-lg shadow-[#AA895F]/20 transition-all hover:-translate-y-1"
           >
             <Save className="mr-2" size={18} /> {initialData ? 'Actualizar Propiedad' : 'Guardar Propiedad'}
           </button>
        </div>

      </form>
    </div>
  );
};

// --- Helper Components ---

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white/40 border border-white rounded-2xl p-6 hover:shadow-md transition-all duration-500">
     <div className="flex items-center mb-6 pb-2 border-b border-[#364649]/5">
         <div className="text-[#708F96] mr-2">{icon}</div>
         <h3 className="text-lg font-bold text-[#364649]">{title}</h3>
     </div>
     {children}
  </div>
);

const Input = ({ label, value, onChange, placeholder, type="text", highlight, disabled }: any) => (
    <div className={disabled ? "opacity-70" : ""}>
        <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${highlight ? 'text-[#AA895F]' : 'text-[#364649]/60'}`}>{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={e => !disabled && onChange(e.target.value)} 
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm outline-none transition-all shadow-sm
                ${disabled ? 'bg-gray-50 text-[#364649]/50 cursor-not-allowed border-[#364649]/5' : 
                  highlight ? 'border-[#AA895F]/50 ring-1 ring-[#AA895F]/20' : 'border-[#364649]/10 focus:border-[#AA895F]'}
            `}
        />
    </div>
);

const Select = ({ label, value, onChange, options }: any) => (
    <div>
        <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">{label}</label>
        <div className="relative">
            <select 
                value={value} 
                onChange={onChange}
                className="w-full bg-white border border-[#364649]/10 rounded-lg px-3 py-2.5 text-sm text-[#364649] outline-none focus:border-[#AA895F] appearance-none shadow-sm"
            >
                {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#364649]/40 text-xs">▼</div>
        </div>
    </div>
);

const Toggle = ({ label, checked, onChange }: any) => (
    <div className="flex items-center cursor-pointer" onClick={() => onChange(!checked)}>
        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${checked ? 'bg-[#AA895F]' : 'bg-[#364649]/20'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
        <span className="ml-3 text-sm font-medium text-[#364649]">{label}</span>
    </div>
);

const UserSelectIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
);

export default PropertyForm;