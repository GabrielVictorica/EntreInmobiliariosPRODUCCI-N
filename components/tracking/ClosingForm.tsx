
import React, { useState, useEffect } from 'react';
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
}

const ClosingForm: React.FC<ClosingFormProps> = ({ properties, buyers, onSave, onCancel, onDelete, commissionSplit, initialData, exchangeRate = 1000 }) => {
    // Modes
    const [operationType, setOperationType] = useState<'venta' | 'alquiler'>('venta');
    const [isManualProperty, setIsManualProperty] = useState(false);
    const [isManualBuyer, setIsManualBuyer] = useState(false);

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
    const [sides, setSides] = useState<1 | 2>(1);

    // Sub-Split Logic (The "% of the split")
    const [subSplitPercent, setSubSplitPercent] = useState('100');

    // NEW: Referral Scope - How many sides does the referral % apply to?
    const [referralSidesApplied, setReferralSidesApplied] = useState<1 | 2>(1);

    // Shared Deal State
    const [isShared, setIsShared] = useState(false);

    // Rental Specific
    const [rentalTotalBilling, setRentalTotalBilling] = useState(''); // This acts as the final "Gross Billing"
    const [rentalMonthlyPrice, setRentalMonthlyPrice] = useState('');
    const [rentalMonths, setRentalMonths] = useState(24); // Default 24 months (2 years)
    const [rentalOwnerFee, setRentalOwnerFee] = useState('');
    const [rentalTenantFee, setRentalTenantFee] = useState('');

    // Effect: Auto-calculate fees when Price or Duration changes (only if fields are empty or auto-mode)
    // To allow manual overrides, we only update if the user hasn't heavily modified them? 
    // Easier approach: Update them always but let user override. If user types in Fees, we break the link? 
    // Let's make it simple: Change Price/Months -> Updates defaults. User can overwrite Fees.
    useEffect(() => {
        if (operationType === 'alquiler') {
            const price = Number(rentalMonthlyPrice);
            if (price > 0) {
                // Owner: 2% of Total Contract
                const totalContract = price * rentalMonths;
                const owner = totalContract * 0.02;
                setRentalOwnerFee(owner.toFixed(0));

                // Tenant: 1 Month (usually)
                const tenant = price;
                setRentalTenantFee(tenant.toFixed(0));
            }
        }
    }, [rentalMonthlyPrice, rentalMonths, operationType]);

    // Effect: Update Total Billing -> Sum of Fees
    useEffect(() => {
        if (operationType === 'alquiler') {
            const total = Number(rentalOwnerFee) + Number(rentalTenantFee);
            setRentalTotalBilling(total.toString());
        }
    }, [rentalOwnerFee, rentalTenantFee, operationType]);

    // Auto-sync referralSidesApplied with sides when sides changes
    useEffect(() => {
        setReferralSidesApplied(sides);
    }, [sides]);

    // Initialize Data for Edit Mode
    useEffect(() => {
        if (initialData) {
            setOperationType(initialData.operationType || 'venta');
            setDate(initialData.date);
            setCurrency(initialData.currency);
            setSalePrice(initialData.salePrice.toString());
            setSides(initialData.sides);
            setIsShared(initialData.isShared);

            // Sub Split
            setSubSplitPercent(initialData.subSplitPercent ? initialData.subSplitPercent.toString() : '100');

            // Referral Sides Applied
            setReferralSidesApplied(initialData.referralSidesApplied || initialData.sides);

            // Property
            if (initialData.manualProperty) {
                setIsManualProperty(true);
                setManualProperty(initialData.manualProperty);
            } else if (initialData.propertyId) {
                setIsManualProperty(false);
                setPropertyId(initialData.propertyId);
            }

            // Buyer
            if (initialData.manualBuyer) {
                setIsManualBuyer(true);
                setManualBuyer(initialData.manualBuyer);
            } else if (initialData.buyerClientId) {
                setIsManualBuyer(false);
                setBuyerClientId(initialData.buyerClientId);
            }

            // Rental specific
            if (initialData.operationType === 'alquiler') {
                setRentalTotalBilling(initialData.totalBilling.toString());
            }
        }
    }, [initialData]);


    // --- CALCULATIONS ---
    const priceNum = Number(salePrice) || 0;

    // 1. Commission Percent Rule: 1 Side = 3%, 2 Sides = 6% (Fixed)
    // Only for Sales. For Rentals, it's manual.
    const commissionPercentRule = sides * 3;

    // 2. Base Gross Commission (Before Sub-Split)
    let baseGrossBilling = 0;

    if (operationType === 'venta') {
        const grossCommissionTotal = priceNum * (commissionPercentRule / 100);
        baseGrossBilling = grossCommissionTotal;
    } else {
        // Alquiler: Manual input
        baseGrossBilling = Number(rentalTotalBilling);
    }

    // 3. Apply Sub-Split to Total Billing Based on Referral Scope
    // The sub-split percentage (e.g., 75%) can apply to:
    // - Only 1 punta (even if operation has 2 puntas)
    // - Both puntas (2 puntas)
    const subSplit = Number(subSplitPercent) / 100; // e.g. 0.75

    let grossBilling = 0;

    if (operationType === 'venta') {
        // Calculate the portion affected by referral
        const referralPortionPercent = (referralSidesApplied * 3) / 100; // 3% or 6%
        const referralPortion = priceNum * referralPortionPercent;

        // Calculate the non-referral portion (if any)
        const nonReferralPortionPercent = ((sides - referralSidesApplied) * 3) / 100;
        const nonReferralPortion = priceNum * nonReferralPortionPercent;

        // Apply sub-split only to referral portion
        grossBilling = (referralPortion * subSplit) + nonReferralPortion;
    } else {
        // For rentals, apply sub-split to entire billing
        grossBilling = baseGrossBilling * subSplit;
    }

    // 4. Agent Honorarium Calculation
    // Logic: Adjusted Billing * SplitBase
    const splitBase = commissionSplit / 100; // e.g. 0.45
    const agentHonorarium = grossBilling * splitBase;


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isManualProperty && !propertyId) return alert("Selecciona una propiedad o ingresa una manual.");
        if (isManualProperty && !manualProperty) return alert("Ingresa la dirección de la propiedad.");
        if (!salePrice && operationType === 'venta') return alert("Ingresa el precio de cierre.");

        const record: ClosingRecord = {
            id: initialData?.id || `CL-${Date.now()}`,
            propertyId: isManualProperty ? undefined : propertyId,
            manualProperty: isManualProperty ? manualProperty : undefined,
            buyerClientId: isManualBuyer ? undefined : buyerClientId,
            manualBuyer: isManualBuyer ? manualBuyer : undefined,
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

    // Helper for currency conversion display
    const getEstimatedUSD = (amount: number, curr: Currency) => {
        if (curr === 'USD') return amount;
        return amount / exchangeRate;
    };

    // Effect: Sync Sale Price (Total Contract) for Rentals
    useEffect(() => {
        if (operationType === 'alquiler') {
            const price = Number(rentalMonthlyPrice);
            const total = price * rentalMonths;
            setSalePrice(total > 0 ? total.toString() : '');
        }
    }, [rentalMonthlyPrice, rentalMonths, operationType]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up">
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
                        <button
                            type="button"
                            onClick={() => setOperationType('venta')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${operationType === 'venta' ? 'bg-white text-[#AA895F] shadow-sm' : 'text-[#364649]/50 hover:text-[#364649]'}`}
                        >
                            Venta
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperationType('alquiler')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${operationType === 'alquiler' ? 'bg-white text-[#AA895F] shadow-sm' : 'text-[#364649]/50 hover:text-[#364649]'}`}
                        >
                            Alquiler
                        </button>
                    </div>

                    {/* PROPERTY SECTION */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-[#364649]/60 uppercase">Propiedad</label>
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
                                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" />
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
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" />
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
                            <label className="block text-xs font-bold text-[#364649]/60 uppercase">Cliente (Inquilino/Comprador)</label>
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
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" />
                                <input
                                    type="text"
                                    value={manualBuyer}
                                    onChange={e => setManualBuyer(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 bg-white border border-[#AA895F]/30 rounded-xl text-sm outline-none focus:border-[#AA895F]"
                                    placeholder="Nombre del cliente..."
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" />
                                <select
                                    value={buyerClientId}
                                    onChange={e => setBuyerClientId(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-[#AA895F]"
                                >
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {buyers.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} - {b.type.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* FINANCIALS GRID */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Fecha de Firma</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" />
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#AA895F]" required />
                            </div>
                        </div>
                        <div>
                            {operationType === 'venta' ? (
                                <>
                                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Precio Venta (Real)</label>
                                    <div className="flex">
                                        <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="bg-[#364649] text-white rounded-l-xl px-3 text-xs font-bold outline-none">
                                            <option value="USD">USD</option>
                                            <option value="ARS">ARS</option>
                                        </select>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={salePrice}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    setSalePrice(val);
                                                }
                                            }}
                                            className="w-full pl-3 pr-3 py-3 bg-white border border-gray-200 rounded-r-xl text-sm font-bold outline-none focus:border-[#AA895F]"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Moneda del Contrato</label>
                                    <select
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value as Currency)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#364649] outline-none focus:border-[#AA895F]"
                                    >
                                        <option value="USD">Dólar (USD)</option>
                                        <option value="ARS">Peso Argentino (ARS)</option>
                                    </select>
                                </>
                            )}
                        </div>
                    </div>

                    {/* COMMISSION LOGIC SECTION */}
                    <div className="bg-[#AA895F]/5 p-6 rounded-2xl border border-[#AA895F]/20 space-y-4">
                        <h3 className="text-sm font-bold text-[#AA895F] uppercase flex items-center">
                            <DollarSign size={16} className="mr-1" /> Cálculo de Honorarios
                        </h3>

                        {/* VENTA LOGIC */}
                        {operationType === 'venta' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Cantidad de Puntas</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setSides(1)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${sides === 1 ? 'bg-[#364649] text-white border-[#364649] shadow-md' : 'bg-white text-[#364649] hover:bg-gray-50'}`}>
                                            1 Punta (3%)
                                        </button>
                                        <button type="button" onClick={() => setSides(2)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${sides === 2 ? 'bg-[#AA895F] text-white border-[#AA895F] shadow-md' : 'bg-white text-[#364649] hover:bg-gray-50'}`}>
                                            2 Puntas (6%)
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Comisión Total (Auto)</label>
                                    <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#364649] opacity-70">
                                        {commissionPercentRule}%
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ALQUILER LOGIC */}
                        {operationType === 'alquiler' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Valor Alquiler (Mensual)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40 text-xs font-bold">{currency}</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={rentalMonthlyPrice}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) setRentalMonthlyPrice(val);
                                                }}
                                                className="w-full pl-12 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-[#AA895F]"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#364649]/60 uppercase mb-1">Duración (Meses)</label>
                                        <input
                                            type="number"
                                            value={rentalMonths}
                                            onChange={e => setRentalMonths(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-[#AA895F]"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                                    <span className="text-xs text-[#364649]/60 font-medium">Valor Total del Contrato:</span>
                                    <span className="text-sm font-bold text-[#364649]">{currency} {(Number(rentalMonthlyPrice) * rentalMonths).toLocaleString()}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-300">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#364649]/50 uppercase mb-1">Hon. Propietario (2%)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/30 text-[10px]">{currency}</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={rentalOwnerFee}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) setRentalOwnerFee(val);
                                                }}
                                                className="w-full pl-10 pr-2 py-2 bg-white border border-[#AA895F]/20 rounded-lg text-xs font-bold text-[#364649] focus:border-[#AA895F] outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#364649]/50 uppercase mb-1">Hon. Inquilino (Variable)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/30 text-[10px]">{currency}</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={rentalTenantFee}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) setRentalTenantFee(val);
                                                }}
                                                className="w-full pl-10 pr-2 py-2 bg-white border border-[#AA895F]/20 rounded-lg text-xs font-bold text-[#364649] focus:border-[#AA895F] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-bold text-[#364649]">Facturación Total (Aprox):</span>
                                    <span className="text-sm font-bold text-[#364649] underline decoration-[#AA895F]">{currency} {(Number(rentalOwnerFee) + Number(rentalTenantFee)).toLocaleString()}</span>
                                </div>
                                {currency === 'ARS' && (
                                    <p className="text-[10px] text-[#364649]/50 italic text-right">
                                        Eq: USD {Math.round((Number(rentalOwnerFee) + Number(rentalTenantFee)) / exchangeRate).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* SPLIT CONFIG */}
                        <div className="pt-4 border-t border-[#AA895F]/10 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#364649]/50 uppercase mb-1">Tu Split Base</label>
                                    <div className="w-full bg-white/50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#364649]">
                                        {commissionSplit}%
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#AA895F] uppercase mb-1 flex items-center">
                                        % Cobrado s/Split <span className="ml-1 bg-[#AA895F]/10 px-1 rounded text-[8px]">AVANZADO</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={subSplitPercent}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === '' || (Number(val) <= 100 && /^\d*\.?\d*$/.test(val))) {
                                                    setSubSplitPercent(val);
                                                }
                                            }}
                                            className="w-full pl-3 pr-6 py-2 bg-white border border-[#AA895F]/30 rounded-xl text-xs font-bold text-[#364649] outline-none focus:border-[#AA895F]"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#364649]/40 text-xs font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* REFERRAL SCOPE SELECTOR - Only show when sub-split < 100% and operation has 2 sides */}
                            {Number(subSplitPercent) < 100 && sides === 2 && operationType === 'venta' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    <label className="block text-[10px] font-bold text-amber-800 uppercase mb-2">
                                        ¿El referido se aplica sobre...?
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setReferralSidesApplied(1)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${referralSidesApplied === 1
                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                                                    : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                                                }`}
                                        >
                                            1 Punta (3%)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReferralSidesApplied(2)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${referralSidesApplied === 2
                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                                                    : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                                                }`}
                                        >
                                            2 Puntas (6%)
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-amber-700 mt-2 italic">
                                        Seleccioná sobre cuántas puntas se aplica el {subSplitPercent}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* FINAL RESULT */}
                        <div className="flex justify-between items-center bg-[#364649] text-white p-4 rounded-xl shadow-lg mt-2">
                            <div className="flex flex-col">
                                <span className="text-[#AA895F] font-bold uppercase text-[10px] tracking-wider">Honorarios Netos</span>
                                <span className="text-[10px] text-white/40">
                                    {operationType === 'venta'
                                        ? `${sides} Punta(s) × ${commissionPercentRule}%`
                                        : 'Manual'}
                                    {' '}× {subSplitPercent}% × {commissionSplit}%
                                </span>
                            </div>
                            <span className="font-bold text-xl">{currency} {agentHonorarium.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>


                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onCancel} className="px-6 py-2 text-[#364649]/60 font-bold hover:text-[#364649]">Cancelar</button>
                        <button type="submit" className="bg-[#364649] text-white px-8 py-3 rounded-xl hover:bg-[#2A3638] font-bold shadow-lg transition-transform hover:-translate-y-1">
                            {initialData ? 'Guardar Cambios' : 'Registrar Cierre'}
                        </button>
                    </div>

                    {initialData && onDelete && (
                        <div className="pt-6 border-t border-gray-100 flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    if (initialData.id) {
                                        onDelete(initialData.id);
                                        onCancel(); // Close form after delete request
                                    }
                                }}
                                className="text-red-400 text-xs font-bold hover:text-red-600 flex items-center gap-1 opacity-60 hover:opacity-100 transition-all"
                            >
                                <X size={12} /> Eliminar este registro permanentemente
                            </button>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
};

export default ClosingForm;
