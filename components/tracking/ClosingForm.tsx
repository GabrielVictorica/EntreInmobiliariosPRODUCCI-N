
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ClosingRecord, PropertyRecord, Currency, BuyerClientRecord } from '../../types';
import { Save, DollarSign, Calendar, X, Building2, User, Globe, Users, ArrowRightLeft, Percent } from 'lucide-react';

interface ClosingFormProps {
    properties: PropertyRecord[];
    buyers: BuyerClientRecord[];
    onSave: (record: ClosingRecord) => void;
    onCancel: () => void;
    onDelete?: (id: string) => void;
    commissionSplit: number;
    initialData?: ClosingRecord | null;
    exchangeRate?: number;
    onNavigateTo?: (view: string, params?: any) => void;
}

const ClosingForm: React.FC<ClosingFormProps> = ({
    properties, buyers, onSave, onCancel, onDelete,
    commissionSplit, initialData, exchangeRate = 1000,
    onNavigateTo
}) => {
    // Modes
    const [operationType, setOperationType] = useState<'venta' | 'alquiler'>('venta');
    const [isManualProperty, setIsManualProperty] = useState(false);
    const [isManualBuyer, setIsManualBuyer] = useState(false);

    // Representation Logic
    const [representedSide, setRepresentedSide] = useState<'seller' | 'buyer' | 'both'>(
        initialData?.sides === 2 ? 'both' : (initialData?.propertyId ? 'seller' : 'buyer')
    );

    // Form State
    const [propertyId, setPropertyId] = useState('');
    const [manualProperty, setManualProperty] = useState('');

    const [buyerClientId, setBuyerClientId] = useState('');
    const [manualBuyer, setManualBuyer] = useState('');

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Financials
    const [salePrice, setSalePrice] = useState('');
    const [currency, setCurrency] = useState<Currency>('USD');

    // Commission Logic
    const [sides, setSides] = useState<1 | 2>(initialData?.sides || 1);

    // Sub-Split Logic (The "% of the split")
    const [subSplitPercent, setSubSplitPercent] = useState('100');

    // Referral Scope
    const [referralSidesApplied, setReferralSidesApplied] = useState<1 | 2>(initialData?.referralSidesApplied || 1);

    // Shared Deal State
    const [isShared, setIsShared] = useState(false);

    // Rental Specific
    const [rentalTotalBilling, setRentalTotalBilling] = useState('');
    const [rentalMonthlyPrice, setRentalMonthlyPrice] = useState('');
    const [rentalMonths, setRentalMonths] = useState(24);
    const [rentalOwnerFee, setRentalOwnerFee] = useState('');
    const [rentalTenantFee, setRentalTenantFee] = useState('');

    // Effects
    useEffect(() => {
        if (operationType === 'alquiler') {
            const price = Number(rentalMonthlyPrice);
            if (price > 0) {
                const totalContract = price * rentalMonths;
                const owner = totalContract * 0.02;
                setRentalOwnerFee(owner.toFixed(0));
                setRentalTenantFee(price.toFixed(0));
            }
        }
    }, [rentalMonthlyPrice, rentalMonths, operationType]);

    useEffect(() => {
        if (operationType === 'alquiler') {
            const total = Number(rentalOwnerFee) + Number(rentalTenantFee);
            setRentalTotalBilling(total.toString());
        }
    }, [rentalOwnerFee, rentalTenantFee, operationType]);

    useEffect(() => {
        setReferralSidesApplied(sides);
        if (sides === 2) setRepresentedSide('both');
        else if (representedSide === 'both') setRepresentedSide('seller');
    }, [sides]);

    useEffect(() => {
        if (initialData) {
            setOperationType(initialData.operationType || 'venta');
            setDate(initialData.date);
            setCurrency(initialData.currency);
            setSalePrice(initialData.salePrice.toString());
            setSides(initialData.sides);
            setIsShared(initialData.isShared);
            setSubSplitPercent(initialData.subSplitPercent ? initialData.subSplitPercent.toString() : '100');
            setReferralSidesApplied(initialData.referralSidesApplied || initialData.sides);

            if (initialData.manualProperty) {
                setIsManualProperty(true);
                setManualProperty(initialData.manualProperty);
            } else if (initialData.propertyId) {
                setIsManualProperty(false);
                setPropertyId(initialData.propertyId);
            }

            if (initialData.manualBuyer) {
                setIsManualBuyer(true);
                setManualBuyer(initialData.manualBuyer);
            } else if (initialData.buyerClientId) {
                setIsManualBuyer(false);
                setBuyerClientId(initialData.buyerClientId);
            }

            if (initialData.operationType === 'alquiler') {
                setRentalTotalBilling(initialData.totalBilling.toString());
            }
        }
    }, [initialData]);

    // Calculations
    const priceNum = Number(salePrice) || 0;
    const commissionPercentRule = sides * 3;
    let baseGrossBilling = 0;

    if (operationType === 'venta') {
        baseGrossBilling = priceNum * (commissionPercentRule / 100);
    } else {
        baseGrossBilling = Number(rentalTotalBilling);
    }

    const subSplit = Number(subSplitPercent) / 100;
    let grossBilling = 0;

    if (operationType === 'venta') {
        const referralPortionPercent = (referralSidesApplied * 3) / 100;
        const referralPortion = priceNum * referralPortionPercent;
        const nonReferralPortionPercent = ((sides - referralSidesApplied) * 3) / 100;
        const nonReferralPortion = priceNum * nonReferralPortionPercent;
        grossBilling = (referralPortion * subSplit) + nonReferralPortion;
    } else {
        grossBilling = baseGrossBilling * subSplit;
    }

    const splitBase = commissionSplit / 100;
    const agentHonorarium = grossBilling * splitBase;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation logic
        if (representedSide === 'seller' || representedSide === 'both') {
            if (!isManualProperty && !propertyId) return alert("Seleccioná una propiedad de tu cartera.");
            if (isManualProperty && !manualProperty) return alert("Ingresá la dirección de la propiedad.");
        }
        if (representedSide === 'buyer' || representedSide === 'both') {
            if (!isManualBuyer && !buyerClientId) return alert("Seleccioná un comprador de tu base.");
            if (isManualBuyer && !manualBuyer) return alert("Ingresá el nombre del comprador.");
        }
        if (!salePrice && operationType === 'venta') return alert("Ingresá el precio de cierre.");

        const record: ClosingRecord = {
            id: initialData?.id || crypto.randomUUID(),
            propertyId: (representedSide === 'seller' || representedSide === 'both') && !isManualProperty ? propertyId : undefined,
            manualProperty: (representedSide === 'seller' || representedSide === 'both') && isManualProperty ? manualProperty :
                (representedSide === 'buyer' ? manualProperty : undefined),
            buyerClientId: (representedSide === 'buyer' || representedSide === 'both') && !isManualBuyer ? buyerClientId : undefined,
            manualBuyer: (representedSide === 'buyer' || representedSide === 'both') && isManualBuyer ? manualBuyer :
                (representedSide === 'seller' ? manualBuyer : undefined),
            date,
            agentName: 'Yo',
            salePrice: priceNum,
            currency,
            commissionPercent: commissionPercentRule,
            sides,
            isShared,
            totalBilling: grossBilling,
            agentHonorarium,
            createdAt: initialData?.createdAt || new Date().toISOString(),
            operationType,
            subSplitPercent: Number(subSplitPercent),
            exchangeRateSnapshot: exchangeRate,
            referralSidesApplied: referralSidesApplied
        };
        onSave(record);
    };

    const selectedProperty = properties.find(p => p.id === propertyId);

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#364649]/20 backdrop-blur-[3px]">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-white/20 relative max-h-[90vh] overflow-y-auto custom-scrollbar">

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#364649] flex items-center capitalize">
                            <DollarSign className="mr-2 text-[#AA895F]" size={28} />
                            {initialData ? 'Editar Cierre' : 'Registrar Cierre'}
                        </h2>
                        <p className="text-[#364649]/60 text-sm">Registra la operación para tus métricas.</p>
                    </div>
                    <button onClick={onCancel} className="text-[#364649]/40 hover:text-[#364649]"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* OPERATION TYPE SELECTOR */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setOperationType('venta')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${operationType === 'venta' ? 'bg-white text-[#AA895F] shadow-sm' : 'text-[#364649]/50 hover:text-[#364649]'}`}>Venta</button>
                        <button type="button" onClick={() => setOperationType('alquiler')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${operationType === 'alquiler' ? 'bg-white text-[#AA895F] shadow-sm' : 'text-[#364649]/50 hover:text-[#364649]'}`}>Alquiler</button>
                    </div>

                    {/* SIDES SELECTOR */}
                    <div className="bg-[#364649]/5 p-5 rounded-2xl border border-[#364649]/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-[#364649]/60 uppercase">Puntas de la Operación</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSides(1)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${sides === 1 ? 'bg-[#364649] text-white shadow-md' : 'bg-white text-[#364649]'}`}>1 Punta (3%)</button>
                                <button type="button" onClick={() => setSides(2)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${sides === 2 ? 'bg-[#AA895F] text-white shadow-md' : 'bg-white text-[#364649]'}`}>2 Puntas (6%)</button>
                            </div>
                        </div>

                        {sides === 1 && (
                            <div className="pt-3 border-t border-[#364649]/10">
                                <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-3 text-center">Yo represento a...</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setRepresentedSide('seller')} className={`flex flex-col items-center p-3 rounded-xl border transition-all ${representedSide === 'seller' ? 'bg-white border-[#AA895F] shadow-md ring-2 ring-[#AA895F]/10' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                        <Building2 size={20} className={representedSide === 'seller' ? 'text-[#AA895F]' : 'text-[#364649]'} />
                                        <span className="text-[10px] font-bold mt-1 uppercase">Punta Vendedora</span>
                                    </button>
                                    <button type="button" onClick={() => setRepresentedSide('buyer')} className={`flex flex-col items-center p-3 rounded-xl border transition-all ${representedSide === 'buyer' ? 'bg-white border-[#708F96] shadow-md ring-2 ring-[#708F96]/10' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                        <User size={20} className={representedSide === 'buyer' ? 'text-[#708F96]' : 'text-[#364649]'} />
                                        <span className="text-[10px] font-bold mt-1 uppercase">Punta Compradora</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PROPERTY / SELLER */}
                    {(representedSide === 'seller' || representedSide === 'both') && (
                        <div className="p-4 bg-white border border-[#AA895F]/20 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center text-[#AA895F]">
                                <div className="flex items-center"><Building2 size={16} className="mr-2" /><span className="text-xs font-bold uppercase tracking-wider">Vendedor / Propiedad</span></div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setIsManualProperty(!isManualProperty); setPropertyId(''); }} className="text-[9px] font-bold text-[#708F96] uppercase hover:underline">{isManualProperty ? 'Seleccionar de Cartera' : 'Carga Manual'}</button>
                                    {!isManualProperty && onNavigateTo && <button type="button" onClick={() => onNavigateTo('dashboard', { returnTo: 'my-week' })} className="text-[9px] font-bold text-[#AA895F] uppercase hover:underline">+ Nuevo Vendedor</button>}
                                </div>
                            </div>
                            {isManualProperty ? (
                                <input type="text" value={manualProperty} onChange={e => setManualProperty(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Dirección de la propiedad..." />
                            ) : (
                                <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full bg-[#364649] text-white rounded-xl px-4 py-3 text-sm font-medium">
                                    <option value="">-- Seleccionar Propiedad --</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.customId} - {p.address.street} {p.address.number}</option>)}
                                </select>
                            )}
                            {!isManualProperty && selectedProperty && <div className="flex items-center gap-2 p-2 bg-[#AA895F]/5 rounded-lg border border-[#AA895F]/10"><User size={12} className="text-[#AA895F]" /><span className="text-[10px] font-bold">Vendedor: {selectedProperty.owners[0].name}</span></div>}
                        </div>
                    )}

                    {/* BUYER */}
                    {(representedSide === 'buyer' || representedSide === 'both') && (
                        <div className="p-4 bg-white border border-[#708F96]/20 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center text-[#708F96]">
                                <div className="flex items-center"><Users size={16} className="mr-2" /><span className="text-xs font-bold uppercase tracking-wider">Inquilino / Comprador</span></div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setIsManualBuyer(!isManualBuyer); setBuyerClientId(''); }} className="text-[9px] font-bold text-[#708F96] uppercase hover:underline">{isManualBuyer ? 'Seleccionar de Base' : 'Carga Manual'}</button>
                                    {!isManualBuyer && onNavigateTo && <button type="button" onClick={() => onNavigateTo('buyer-client-form', { returnTo: 'my-week' })} className="text-[9px] font-bold text-[#AA895F] uppercase hover:underline">+ Nuevo Comprador</button>}
                                </div>
                            </div>
                            {isManualBuyer ? (
                                <input type="text" value={manualBuyer} onChange={e => setManualBuyer(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Nombre completo..." />
                            ) : (
                                <select value={buyerClientId} onChange={e => setBuyerClientId(e.target.value)} className="w-full bg-[#364649] text-white rounded-xl px-4 py-3 text-sm font-medium">
                                    <option value="">-- Seleccionar Comprador --</option>
                                    {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            )}
                        </div>
                    )}

                    {/* MANUAL EXTERNAL FIELDS */}
                    {sides === 1 && (
                        <div className="space-y-3">
                            {representedSide === 'seller' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Comprador (Externo / Colega)</label>
                                    <input type="text" value={manualBuyer} onChange={e => setManualBuyer(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="Nombre o Inmobiliaria colega..." />
                                </div>
                            )}
                            {representedSide === 'buyer' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Propiedad (Externa / Colega)</label>
                                    <input type="text" value={manualProperty} onChange={e => setManualProperty(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="Dirección o Inmobiliaria colega..." />
                                </div>
                            )}
                        </div>
                    )}

                    {/* FINANCIALS */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Fecha Firma</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">{operationType === 'venta' ? 'Precio Venta' : 'Moneda'}</label>
                            <div className="flex">
                                <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="bg-[#364649] text-white rounded-l-xl px-2 text-xs font-bold">
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                </select>
                                {operationType === 'venta' && <input type="text" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-r-xl text-sm font-bold" placeholder="0.00" required />}
                            </div>
                        </div>
                    </div>

                    {/* HONORARIUM INFO */}
                    <div className="bg-[#AA895F]/5 p-6 rounded-2xl border border-[#AA895F]/20 space-y-4">
                        <div className="flex justify-between items-center bg-[#364649] text-white p-4 rounded-xl">
                            <div>
                                <span className="text-[#AA895F] font-bold uppercase text-[10px]">Honorarios Netos</span>
                                <p className="text-[10px] opacity-60">{sides} Punta(s) ({sides * 3}%) × {subSplitPercent}% × Split {commissionSplit}%</p>
                            </div>
                            <span className="font-bold text-xl">{currency} {agentHonorarium.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#364649]/50 uppercase mb-1">% Cobrado s/Split</label>
                                <div className="relative">
                                    <input type="text" value={subSplitPercent} onChange={e => setSubSplitPercent(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#AA895F]/30 rounded-xl text-xs font-bold" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="px-6 py-2 text-[#364649]/60 font-bold">Cancelar</button>
                        <button type="submit" className="bg-[#364649] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#242f31]">
                            {initialData ? 'Guardar Cambios' : 'Registrar Cierre'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default ClosingForm;
