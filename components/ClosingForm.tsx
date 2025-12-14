
import React, { useState, useEffect } from 'react';
import { ClosingRecord, PropertyRecord, Currency, BuyerClientRecord } from '../types';
import { Save, DollarSign, Calendar, X, Building2, User, Globe, Users } from 'lucide-react';

interface ClosingFormProps {
  properties: PropertyRecord[];
  buyers: BuyerClientRecord[];
  onSave: (record: ClosingRecord) => void;
  onCancel: () => void;
  commissionSplit: number;
}

const ClosingForm: React.FC<ClosingFormProps> = ({ properties, buyers, onSave, onCancel, commissionSplit }) => {
  // Modes
  const [isManualProperty, setIsManualProperty] = useState(false);
  const [isManualBuyer, setIsManualBuyer] = useState(false);

  // Form State
  const [propertyId, setPropertyId] = useState('');
  const [manualProperty, setManualProperty] = useState('');
  
  const [buyerClientId, setBuyerClientId] = useState('');
  const [manualBuyer, setManualBuyer] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [salePrice, setSalePrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [sides, setSides] = useState<1 | 2>(1);
  const [commissionPercent, setCommissionPercent] = useState('3'); 
  
  // Shared Deal State
  const [isShared, setIsShared] = useState(false);
  const [customBilling, setCustomBilling] = useState(''); // Allows overriding calculated billing

  // Calculations
  const priceNum = Number(salePrice) || 0;
  const commPercentNum = Number(commissionPercent) || 0;
  
  // Logic: If shared, assume 50% split of the commission unless custom billing is entered
  const grossCommission = priceNum * (commPercentNum / 100);
  const calculatedBilling = isShared ? grossCommission * 0.5 : grossCommission;
  
  // Final Billing to use (Custom overrides Auto)
  const finalTotalBilling = customBilling ? Number(customBilling) : calculatedBilling;
  const agentHonorarium = finalTotalBilling * (commissionSplit / 100);

  // Update custom billing placeholder when inputs change if user hasn't typed manually yet
  useEffect(() => {
      if (!customBilling) {
          // Just let the placeholder handle visualization, logic uses calculatedBilling
      }
  }, [salePrice, commissionPercent, isShared]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualProperty && !propertyId) return alert("Selecciona una propiedad o ingresa una manual.");
    if (isManualProperty && !manualProperty) return alert("Ingresa la dirección de la propiedad.");
    if (!salePrice) return alert("Ingresa el precio de cierre.");

    const record: ClosingRecord = {
      id: `CL-${Date.now()}`,
      propertyId: isManualProperty ? undefined : propertyId,
      manualProperty: isManualProperty ? manualProperty : undefined,
      buyerClientId: isManualBuyer ? undefined : buyerClientId,
      manualBuyer: isManualBuyer ? manualBuyer : undefined,
      date,
      agentName: 'Yo',
      salePrice: priceNum,
      currency,
      commissionPercent: commPercentNum,
      sides,
      isShared,
      totalBilling: finalTotalBilling,
      agentHonorarium,
      createdAt: new Date().toISOString()
    };
    onSave(record);
  };

  const selectedProperty = properties.find(p => p.id === propertyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-white/20 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-2xl font-bold text-[#364649] flex items-center">
                    <DollarSign className="mr-2 text-[#AA895F]" size={28}/> Registrar Cierre
                </h2>
                <p className="text-[#364649]/60 text-sm">Registra la operación para tus métricas.</p>
            </div>
            <button onClick={onCancel} className="text-[#364649]/40 hover:text-[#364649]"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PROPERTY SECTION */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-[#364649]/60 uppercase">Propiedad Cerrada</label>
                    <button 
                        type="button" 
                        onClick={() => { setIsManualProperty(!isManualProperty); setPropertyId(''); setManualProperty(''); }}
                        className="text-[10px] text-[#708F96] font-bold hover:underline flex items-center"
                    >
                        {isManualProperty ? 'Seleccionar de Cartera' : 'Cargar Externa / Colega'}
                    </button>
                </div>
                
                {isManualProperty ? (
                    <div className="relative">
                        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40"/>
                        <input 
                            type="text" 
                            value={manualProperty} 
                            onChange={e => setManualProperty(e.target.value)} 
                            className="w-full pl-10 pr-3 py-3 bg-white border border-[#AA895F]/30 rounded-xl text-sm outline-none focus:border-[#AA895F]"
                            placeholder="Ej: Av. Libertador 2200 (Colega REMAX)"
                            autoFocus
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40"/>
                        <select 
                            value={propertyId} 
                            onChange={e => setPropertyId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-[#AA895F]"
                        >
                            <option value="">-- Seleccionar Propiedad --</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.customId} - {p.address.street} {p.address.number}</option>
                            ))}
                        </select>
                    </div>
                )}
                {!isManualProperty && selectedProperty && (
                    <div className="text-xs text-[#364649]/60 pl-2 border-l-2 border-[#AA895F]">
                        {selectedProperty.type.toUpperCase()} en {selectedProperty.address.neighborhood}. Precio Lista: {selectedProperty.currency} {selectedProperty.price.toLocaleString()}
                    </div>
                )}
            </div>

            {/* BUYER SECTION */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-[#364649]/60 uppercase">Cliente Comprador</label>
                    <button 
                        type="button" 
                        onClick={() => { setIsManualBuyer(!isManualBuyer); setBuyerClientId(''); setManualBuyer(''); }}
                        className="text-[10px] text-[#708F96] font-bold hover:underline flex items-center"
                    >
                        {isManualBuyer ? 'Seleccionar de Base' : 'Cargar Manual / Colega'}
                    </button>
                </div>

                {isManualBuyer ? (
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40"/>
                        <input 
                            type="text" 
                            value={manualBuyer} 
                            onChange={e => setManualBuyer(e.target.value)} 
                            className="w-full pl-10 pr-3 py-3 bg-white border border-[#AA895F]/30 rounded-xl text-sm outline-none focus:border-[#AA895F]"
                            placeholder="Nombre del comprador..."
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40"/>
                        <select 
                            value={buyerClientId} 
                            onChange={e => setBuyerClientId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-[#AA895F]"
                        >
                            <option value="">-- Seleccionar Comprador --</option>
                            {buyers.map(b => (
                                <option key={b.id} value={b.id}>{b.name} - {b.type.replace('_',' ')}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Fecha de Firma</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40"/>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#AA895F]" required/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Precio Cierre (Oferta)</label>
                    <div className="flex">
                        <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="bg-[#364649] text-white rounded-l-xl px-3 text-xs font-bold outline-none">
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                        </select>
                        <input 
                            type="number" 
                            value={salePrice} 
                            onChange={e => setSalePrice(e.target.value)} 
                            className="w-full pl-3 pr-3 py-3 bg-white border border-gray-200 rounded-r-xl text-sm font-bold outline-none focus:border-[#AA895F]" 
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Puntas (Lados)</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setSides(1)} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${sides === 1 ? 'bg-[#364649] text-white border-[#364649]' : 'bg-white text-[#364649] hover:bg-gray-50'}`}>1 Punta</button>
                        <button type="button" onClick={() => setSides(2)} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${sides === 2 ? 'bg-[#AA895F] text-white border-[#AA895F]' : 'bg-white text-[#364649] hover:bg-gray-50'}`}>2 Puntas</button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">% Comisión Total</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            step="0.1"
                            value={commissionPercent} 
                            onChange={e => setCommissionPercent(e.target.value)} 
                            className="w-full pl-3 pr-8 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-[#AA895F]" 
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#364649]/40 text-xs font-bold">%</span>
                    </div>
                </div>
            </div>

            {/* SHARED DEAL TOGGLE */}
            <div className="bg-[#364649]/5 p-4 rounded-xl border border-[#364649]/10">
                <div className="flex justify-between items-center mb-3">
                    <label className="flex items-center cursor-pointer">
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${isShared ? 'bg-[#AA895F]' : 'bg-[#364649]/20'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isShared ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="ml-3 text-sm font-bold text-[#364649] flex items-center">
                            <Users size={16} className="mr-1"/> ¿Operación Compartida?
                        </span>
                    </label>
                </div>
                
                {isShared && (
                    <div className="animate-fade-in-up">
                        <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">
                            Facturación Total para TU Oficina (Editar si es necesario)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40 text-xs font-bold">{currency}</span>
                            <input 
                                type="number" 
                                value={customBilling} 
                                onChange={e => setCustomBilling(e.target.value)}
                                placeholder={calculatedBilling.toFixed(0)}
                                className="w-full pl-8 pr-3 py-2 bg-white border border-[#AA895F]/30 rounded-lg text-sm font-bold text-[#364649] outline-none focus:border-[#AA895F]" 
                            />
                        </div>
                        <p className="text-[10px] text-[#364649]/50 mt-1 italic">
                            Por defecto se calcula el 50% de la comisión total. Si el acuerdo fue diferente, ajusta el valor aquí.
                        </p>
                    </div>
                )}
            </div>

            {/* Final Totals Preview */}
            <div className="flex justify-between items-center text-sm border-t border-[#364649]/10 pt-4 mt-2">
                <div className="flex flex-col">
                    <span className="text-[#AA895F] font-bold uppercase text-xs">Tus Honorarios (Neto)</span>
                    <span className="text-[10px] text-[#364649]/40">Basado en split {commissionSplit}% sobre {currency} {finalTotalBilling.toLocaleString()}</span>
                </div>
                <span className="font-bold text-[#AA895F] text-2xl">{currency} {agentHonorarium.toLocaleString()}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-6 py-2 text-[#364649]/60 font-bold hover:text-[#364649]">Cancelar</button>
                <button type="submit" className="bg-[#364649] text-white px-8 py-3 rounded-xl hover:bg-[#2A3638] font-bold shadow-lg transition-transform hover:-translate-y-1">
                    Confirmar Cierre
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};

export default ClosingForm;
