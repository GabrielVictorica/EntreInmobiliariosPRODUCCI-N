
import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    ChevronLeft, ChevronRight, Plus, Users, Activity, UserPlus, Search, Link, X, ArrowRight, CheckCircle, Calendar, Trash2, HelpCircle, UserCheck, ArrowRightLeft
} from 'lucide-react';
import { ActivityRecord, ActivityType, ClientRecord, BuyerClientRecord, VisitRecord, PropertyRecord, BuyerSearchRecord, ClosingRecord } from '../../types';

// Import Forms for Deep Integration - Adjusted Paths
import ClientForm from '../sellers/SellerForm';
import PropertyForm from '../sellers/PropertyForm';
import BuyerClientForm from '../buyers/BuyerClientForm';
import BuyerSearchForm from '../buyers/BuyerSearchForm';
import VisitForm from '../buyers/VisitForm';
import ClosingForm from './ClosingForm';

interface WeeklyDashboardProps {
    activities: ActivityRecord[];
    clients: ClientRecord[];
    buyers: BuyerClientRecord[];
    visits: VisitRecord[];
    properties: PropertyRecord[];
    searches?: BuyerSearchRecord[];
    closingLogs?: ClosingRecord[]; // Para contar puntas correctamente
    onSaveActivity: (act: ActivityRecord) => void;
    onDeleteActivity: (id: string) => void; // New Prop for Deletion
    // Deep Integration Handlers
    onSaveClient: (client: ClientRecord) => void;
    onSaveProperty: (prop: PropertyRecord) => void;
    onSaveBuyer: (buyer: BuyerClientRecord) => void;
    onSaveSearch: (search: BuyerSearchRecord) => void;
    onSaveVisit: (visit: VisitRecord) => void;
    onSaveClosing: (closing: ClosingRecord) => void;
    onDeleteClosing: (id: string) => void;
    onNavigateTo: (view: string, params?: any) => void;
    initialAction?: 'register-activity';
}

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const ACTIVITY_ROWS: { id: ActivityType, label: string, isGreen: boolean }[] = [
    { id: 'act_verde', label: 'Act. Verde (Varios)', isGreen: false },
    { id: 'pre_listing', label: 'Pre-Listing (PL)', isGreen: true },
    { id: 'pre_buying', label: 'Pre-Buying (PB)', isGreen: false },
    { id: 'acm', label: 'ACM Entregado', isGreen: false },
    { id: 'captacion', label: 'Captaciones', isGreen: false },
    { id: 'visita', label: 'Visitas', isGreen: false },
    { id: 'reserva', label: 'Reservas', isGreen: false },
    { id: 'cierre', label: 'Puntas Cierre', isGreen: false },
    { id: 'referido', label: 'Referidos', isGreen: false },
];

type ModalMode = 'list' | 'wizard';
type WizardStep = 'select-contact' | 'create-contact' | 'create-record' | 'finalize' | 'qualify-pb';

const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
    activities, clients, buyers, visits, properties, searches, closingLogs,
    onSaveActivity, onDeleteActivity, onSaveClient, onSaveProperty, onSaveBuyer, onSaveSearch, onSaveVisit,
    onSaveClosing, onDeleteClosing, onNavigateTo,
    initialAction
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [criticalNumber, setCriticalNumber] = useState(0);

    // Modal & Wizard State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('wizard');
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [selectedType, setSelectedType] = useState<ActivityType>('act_verde');

    const [wizardStep, setWizardStep] = useState<WizardStep>('select-contact');
    const [tempClientId, setTempClientId] = useState<string | null>(null); // Stores ID of selected/created client

    // Simple Form State (for non-complex activities)
    const [contactSearch, setContactSearch] = useState('');
    const [selectedContact, setSelectedContact] = useState<{ id?: string, name: string, type: string } | null>(null);
    const [notes, setNotes] = useState('');

    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

    // Closing Form State
    const [isClosingFormOpen, setIsClosingFormOpen] = useState(false);
    const [selectedClosingId, setSelectedClosingId] = useState<string | null>(null);

    // Load Critical Number
    useEffect(() => {
        const saved = localStorage.getItem('critical_number');
        if (saved) setCriticalNumber(Number(saved));
    }, []);

    // Handle Initial Action (Deep Linking)
    useEffect(() => {
        if (initialAction === 'register-activity') {
            startCreationFlow('act_verde');
            setIsModalOpen(true);
        }
    }, [initialAction]);

    // --- Date Logic ---
    const startOfWeek = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }, [currentDate]);

    const weekDates = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [startOfWeek]);

    // Usar formato local para evitar desfase de zona horaria
    const formatDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    // --- Data Integration ---
    const currentWeekActivities = useMemo(() => {
        const startStr = formatDateKey(weekDates[0]);
        const endStr = formatDateKey(weekDates[6]);

        // 1. Manual Activities
        const manual = activities.filter(a => a.date >= startStr && a.date <= endStr);

        // 2. System Visits (SOLO REALIZADAS)
        const systemVisits = visits
            .filter(v => v.status === 'realizada' && v.date >= startStr && v.date <= endStr)
            .map(v => ({
                id: v.id,
                date: v.date,
                type: 'visita' as ActivityType,
                contactId: v.buyerClientId,
                contactName: buyers.find(b => b.id === v.buyerClientId)?.name || 'Comprador',
                notes: `Visita propiedad: ${v.propertyId}. ${v.feedback?.positivePoints || ''}`,
                systemGenerated: true,
                referenceId: v.id,
                createdAt: v.createdAt
            }));

        // 3. System Captures (Properties Created)
        const systemCaptures = properties
            .filter(p => {
                const created = p.createdAt.split('T')[0];
                return created >= startStr && created <= endStr;
            })
            .map(p => ({
                id: `sys-cap-${p.id}`,
                date: p.createdAt.split('T')[0],
                type: 'captacion' as ActivityType,
                contactId: p.clientId,
                contactName: clients.find(c => c.id === p.clientId)?.owners[0].name || 'Propietario',
                notes: `Nueva propiedad: ${p.address.street} ${p.address.number}`,
                systemGenerated: true,
                referenceId: p.id,
                createdAt: p.createdAt
            }));

        return [...manual, ...systemVisits, ...systemCaptures];
    }, [activities, visits, properties, weekDates, clients, buyers]);

    // Calculations
    const getCellData = (rowIndex: number, colIndex: number) => {
        const type = ACTIVITY_ROWS[rowIndex].id;
        const dateKey = formatDateKey(weekDates[colIndex]);
        // Comparar solo la parte de fecha (manejar formato timestamp)
        return currentWeekActivities.filter(a => a.type === type && a.date.split('T')[0] === dateKey);
    };

    // NEW: Get closing logs for a specific day
    const getClosingsForDay = (colIndex: number) => {
        const dateKey = formatDateKey(weekDates[colIndex]);
        if (!closingLogs) return [];
        // Comparar solo la parte de fecha (manejar tanto 'YYYY-MM-DD' como 'YYYY-MM-DDTHH:mm:ss')
        return closingLogs.filter(c => c.date.split('T')[0] === dateKey);
    };

    // NEW: Get total sides (puntas) for a specific day
    const getClosingSidesForDay = (colIndex: number) => {
        return getClosingsForDay(colIndex).reduce((sum, c) => sum + c.sides, 0);
    };

    // NEW: Get weekly total of sides (puntas)
    const getWeeklyClosingSides = () => {
        const startStr = formatDateKey(weekDates[0]);
        const endStr = formatDateKey(weekDates[6]);
        if (!closingLogs) return 0;
        return closingLogs
            .filter(c => {
                const closingDate = c.date.split('T')[0];
                return closingDate >= startStr && closingDate <= endStr;
            })
            .reduce((sum, c) => sum + c.sides, 0);
    };

    const getWeeklyTotal = (type: ActivityType) => {
        // Cierres simplificados: contar registros de actividad
        return currentWeekActivities.filter(a => a.type === type).length;
    };

    const totalGreenMeetings =
        getWeeklyTotal('act_verde') +
        getWeeklyTotal('pre_listing') +
        getWeeklyTotal('pre_buying') +
        getWeeklyTotal('acm') +
        getWeeklyTotal('captacion') +
        getWeeklyTotal('visita') +
        getWeeklyTotal('reserva') +
        getWeeklyTotal('cierre');

    const totalPLPB = getWeeklyTotal('pre_listing') + getWeeklyTotal('pre_buying');
    const totalReferrals = getWeeklyTotal('referido');

    // --- Handlers ---
    const handleCellClick = (type: ActivityType, dayIndex: number) => {
        setSelectedType(type);
        setSelectedDayIndex(dayIndex);

        // Standard flow for ALL activities (including simplified 'cierre')
        const cellData = getCellData(ACTIVITY_ROWS.findIndex(r => r.id === type), dayIndex);
        if (cellData.length > 0) {
            setModalMode('list');
        } else {
            startCreationFlow(type);
        }
        setIsModalOpen(true);
    };


    const startCreationFlow = (type: ActivityType) => {
        setModalMode('wizard');
        // Reset creation state
        setContactSearch('');
        setSelectedContact(null);
        setNotes('');
        setTempClientId(null);

        const isComplex = false; // All activities are simple for now as per user request
        setWizardStep(isComplex ? 'select-contact' : 'finalize');
    };

    // --- WIZARD HANDLERS ---

    // 1. Contact Selection / Creation Handlers
    const handleContactSelect = (id: string, name: string) => {
        setTempClientId(id);
        setContactSearch(name); // Visual feedback

        // LOGIC BRANCHING
        if (selectedType === 'pre_listing' || selectedType === 'captacion') {
            // Actividades simples -> Finalizar directo
            setWizardStep('finalize');
        } else {
            // Visita, Pre-Buying (Search), etc -> Formularios complejos (Create Record)
            setWizardStep('create-record');
        }
    };

    const handleCreateContact = () => {
        setWizardStep('create-contact');
    };

    const handleSaveNewClient = (client: ClientRecord) => {
        onSaveClient(client);
        setTempClientId(client.id);
        setContactSearch(client.owners[0].name);

        if (selectedType === 'pre_listing' || selectedType === 'captacion') {
            setWizardStep('finalize');
        } else {
            setWizardStep('create-record');
        }
    };

    const handleSaveNewBuyer = (buyer: BuyerClientRecord) => {
        onSaveBuyer(buyer);
        setTempClientId(buyer.id);
        setContactSearch(buyer.name);
        setWizardStep('create-record');
    };

    // 2. Record Creation Handlers (Property / Search / Visit)
    const handleSaveNewProperty = (prop: PropertyRecord) => {
        onSaveProperty(prop);
        setWizardStep('finalize');
    };

    const handleSaveNewSearch = (search: BuyerSearchRecord) => {
        onSaveSearch(search);
        // Auto-create activity
        finalizeActivity(search.buyerClientId, 'Nuevo Perfil NURC creado.', search.id);
    };

    const handleSaveNewVisit = (visit: VisitRecord) => {
        onSaveVisit(visit);
        setWizardStep('finalize');
    };

    // 3. Finalize Activity
    const finalizeActivity = (contactId?: string, autoNotes?: string, refId?: string, keepOpen?: boolean) => {
        const newActivity: ActivityRecord = {
            id: crypto.randomUUID(),
            date: formatDateKey(weekDates[selectedDayIndex]),
            type: selectedType,
            contactId: contactId || selectedContact?.id,
            contactName: contactSearch || (selectedContact?.name || 'Desconocido'),
            notes: autoNotes || notes,
            referenceId: refId,
            createdAt: new Date().toISOString()
        };
        onSaveActivity(newActivity);

        // For Pre-Buying, we might want to qualify immediately after simple save
        if (selectedType === 'pre_buying' && keepOpen) {
            setWizardStep('qualify-pb');
            return;
        }

        setIsModalOpen(false);
    };

    // Simple Form Submit
    const handleSimpleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use tempClientId if coming from wizard (Pre-Listing)
        // Pass keepOpen = true to trigger qualification question for Pre-Buying
        finalizeActivity(tempClientId || undefined, undefined, undefined, true);
    };

    // Handle Qualification Choice
    const handleQualifyPB = (isQualified: boolean) => {
        if (isQualified) {
            setWizardStep('select-contact');
            // contactSearch already has the name they typed, preserving context
        } else {
            setIsModalOpen(false);
        }
    };

    // Render Logic
    const isBuyerFlow = selectedType === 'pre_buying' || selectedType === 'visita';

    // Data for List View
    const activeCellData = getCellData(ACTIVITY_ROWS.findIndex(r => r.id === selectedType), selectedDayIndex);

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#364649] tracking-tight">Mí Semana</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => navigateWeek('prev')} className="p-1 hover:bg-[#364649]/10 rounded-full"><ChevronLeft size={16} /></button>
                        <span className="text-[#364649] font-bold text-sm bg-white/50 px-3 py-1 rounded-lg border border-[#364649]/10">
                            {startOfWeek.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} - {weekDates[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                        </span>
                        <button onClick={() => navigateWeek('next')} className="p-1 hover:bg-[#364649]/10 rounded-full"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProgressBar
                    label="Reuniones Verdes"
                    current={totalGreenMeetings}
                    target={15}
                    color="bg-emerald-500"
                    icon={<Users size={18} className="text-emerald-700" />}
                />
                <ProgressBar
                    label="N° Crítico (PL/PB)"
                    current={totalPLPB}
                    target={Math.ceil(criticalNumber)}
                    color="bg-blue-500"
                    icon={<Activity size={18} className="text-blue-700" />}
                    subtext="Pre-Listing + Pre-Buying"
                />
                <ProgressBar
                    label="Referidos"
                    current={totalReferrals}
                    target={5}
                    color="bg-purple-500"
                    icon={<UserPlus size={18} className="text-purple-700" />}
                />
            </div>

            {/* Main Grid Card */}
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-xl overflow-x-auto pb-12">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="p-4 text-left text-[10px] uppercase font-bold text-[#364649]/40 tracking-widest w-48 bg-white/50 sticky left-0 z-10 backdrop-blur-sm">Métricas Semanales</th>
                            {weekDates.map((date, i) => (
                                <th key={i} className="p-4 text-center">
                                    <span className="block text-[10px] uppercase font-bold text-[#364649]/40 tracking-wide mb-1">{WEEK_DAYS[i]}</span>
                                    <span className={`text-lg font-bold ${formatDateKey(date) === formatDateKey(new Date()) ? 'bg-[#364649] text-white w-8 h-8 flex items-center justify-center rounded-full mx-auto' : 'text-[#364649]'}`}>
                                        {date.getDate()}
                                    </span>
                                </th>
                            ))}
                            <th className="p-4 text-center bg-[#364649]/5 border-l border-gray-100 italic font-bold text-[#364649] text-xs">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ACTIVITY_ROWS.map((row, rowIndex) => (
                            <tr key={row.id} className="group transition-colors hover:bg-white/40">
                                <td className={`p-4 font-bold text-sm bg-white/50 sticky left-0 z-10 backdrop-blur-sm border-r border-gray-100 ${row.isGreen ? 'text-emerald-700/80 border-l-4 border-l-emerald-500' : 'text-[#364649]/80 border-l-4 border-l-transparent'}`}>
                                    {row.label}
                                </td>
                                {weekDates.map((_, colIndex) => {
                                    const count = row.id === 'cierre' ? getClosingSidesForDay(colIndex) : getCellData(rowIndex, colIndex).length;
                                    return (
                                        <td
                                            key={colIndex}
                                            onClick={() => handleCellClick(row.id, colIndex)}
                                            className="p-4 text-center cursor-pointer hover:bg-[#AA895F]/5 transition-all group/cell relative border-r border-gray-100/50"
                                        >
                                            {count > 0 ? (
                                                <div className={`w-9 h-9 mx-auto flex items-center justify-center rounded-xl font-bold text-sm shadow-sm transition-all group-hover/cell:scale-110 ${row.id === 'cierre' ? 'bg-[#AA895F] text-white' : (row.isGreen ? 'bg-emerald-500 text-white' : 'bg-[#364649] text-white')}`}>
                                                    {count}
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 mx-auto flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg group-hover/cell:border-[#AA895F]/30 group-hover/cell:bg-white transition-all">
                                                    <Plus size={14} className="text-gray-300 group-hover/cell:text-[#AA895F] opacity-0 group-hover/cell:opacity-100 transition-all" />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="p-4 text-center font-black text-sm bg-[#364649]/5 border-l border-gray-100 group-hover:bg-[#364649]/10 transition-colors">
                                    {getWeeklyTotal(row.id)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {deleteConfirmOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#364649]/20 backdrop-blur-[3px]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/20">
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Trash2 size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-[#364649] mb-2">¿Eliminar actividad?</h3>
                            <p className="text-sm text-[#364649]/60 mb-6">Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeleteConfirmOpen(false);
                                    setActivityToDelete(null);
                                }}
                                className="flex-1 py-3 bg-gray-100 text-[#364649] font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (activityToDelete) {
                                        onDeleteActivity(activityToDelete);
                                        if (activeCellData.length <= 1) setIsModalOpen(false);
                                    }
                                    setDeleteConfirmOpen(false);
                                    setActivityToDelete(null);
                                }}
                                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- MODAL (LIST or WIZARD) --- */}
            {isModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#364649]/20 backdrop-blur-[3px]">
                    <div className={`bg-white rounded-3xl shadow-2xl w-full p-6 border border-white/20 transition-all duration-300 flex flex-col max-h-[90vh] ${modalMode === 'wizard' && wizardStep !== 'finalize' && wizardStep !== 'select-contact' && wizardStep !== 'qualify-pb' ? 'max-w-5xl' : 'max-w-md'}`}>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-[#364649] flex items-center">
                                    {modalMode === 'list' ? 'Detalle de Actividad' :
                                        (wizardStep === 'qualify-pb' ? <UserCheck size={20} className="mr-2 text-emerald-600" /> :
                                            (wizardStep === 'finalize' ? <Plus size={20} className="mr-2 text-[#AA895F]" /> :
                                                (wizardStep === 'create-contact' ? <UserPlus size={20} className="mr-2 text-[#AA895F]" /> :
                                                    <Link size={20} className="mr-2 text-[#AA895F]" />)))}
                                    {modalMode === 'list' ? '' : (wizardStep === 'finalize' ? 'Registrar Actividad' : (wizardStep === 'qualify-pb' ? 'Calificación de Prospecto' : 'Gestión Vinculada'))}
                                </h3>
                                <p className="text-xs text-[#364649]/50">
                                    {ACTIVITY_ROWS.find(r => r.id === selectedType)?.label} • {WEEK_DAYS[selectedDayIndex]} {weekDates[selectedDayIndex].getDate()}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-[#364649]/40 hover:text-[#364649]"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {/* MODE: LIST VIEW */}
                            {modalMode === 'list' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {selectedType === 'cierre' ? (
                                            getClosingsForDay(selectedDayIndex).map((closing) => {
                                                const propName = closing.propertyId
                                                    ? properties.find(p => p.id === closing.propertyId)?.address?.street + ' ' + properties.find(p => p.id === closing.propertyId)?.address?.number
                                                    : closing.manualProperty || 'Propiedad externa';

                                                const sellerName = closing.propertyId
                                                    ? (() => {
                                                        const prop = properties.find(p => p.id === closing.propertyId);
                                                        if (prop) {
                                                            const seller = clients.find(c => c.id === prop.clientId);
                                                            return seller?.owners[0]?.name || 'Vendedor interno';
                                                        }
                                                        return null;
                                                    })()
                                                    : null;

                                                const buyerName = closing.buyerClientId
                                                    ? buyers.find(b => b.id === closing.buyerClientId)?.name
                                                    : closing.manualBuyer || 'Comprador externo';

                                                return (
                                                    <div key={closing.id} className="bg-gradient-to-r from-[#AA895F]/5 to-white p-4 rounded-xl border border-[#AA895F]/20 hover:border-[#AA895F]/40 transition-colors group relative mb-2">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-[#AA895F] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                                                    {closing.sides} {closing.sides === 1 ? 'PUNTA' : 'PUNTAS'}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-[#364649]/40 uppercase">
                                                                    {closing.operationType}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedClosingId(closing.id);
                                                                        setIsClosingFormOpen(true);
                                                                        setIsModalOpen(false);
                                                                    }}
                                                                    className="p-1 hover:bg-[#AA895F]/10 text-[#AA895F] rounded-md transition-colors"
                                                                >
                                                                    <ArrowRightLeft size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm('¿Estás seguro de que deseás eliminar este cierre?')) {
                                                                            onDeleteClosing(closing.id);
                                                                        }
                                                                    }}
                                                                    className="p-1 hover:bg-red-50 text-red-400 rounded-md transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold text-[#364649]/50 uppercase w-12">Prop:</span>
                                                            <span className="text-xs font-semibold text-[#364649] truncate">{propName}</span>
                                                        </div>

                                                        {sellerName && (
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-bold text-emerald-600/70 uppercase w-12">Vend:</span>
                                                                <span className="text-xs text-[#364649]">{sellerName}</span>
                                                            </div>
                                                        )}

                                                        {buyerName && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-blue-600/70 uppercase w-12">Comp:</span>
                                                                <span className="text-xs text-[#364649]">{buyerName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            activeCellData.map((act) => (
                                                <div key={act.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-start group hover:border-[#AA895F]/30 transition-colors mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-[#364649] text-sm">{act.contactName}</span>
                                                            {act.systemGenerated && <span className="text-[9px] bg-[#364649]/10 text-[#364649]/60 px-1.5 py-0.5 rounded font-bold uppercase">Auto</span>}
                                                        </div>
                                                        <p className="text-xs text-[#364649]/70 italic">{act.notes || 'Sin notas.'}</p>
                                                    </div>
                                                    {!act.systemGenerated && (
                                                        <button
                                                            onClick={() => {
                                                                setActivityToDelete(act.id);
                                                                setDeleteConfirmOpen(true);
                                                            }}
                                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar registro manual"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {selectedType !== 'cierre' && (
                                        <button
                                            onClick={() => startCreationFlow(selectedType)}
                                            className="w-full py-3 border-2 border-dashed border-[#AA895F]/30 text-[#AA895F] font-bold rounded-xl hover:bg-[#AA895F]/5 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} /> Agregar otro registro
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* MODE: WIZARD FLOW */}
                            {modalMode === 'wizard' && (
                                <>
                                    {wizardStep === 'qualify-pb' && (
                                        <div className="space-y-6 text-center py-4">
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-scale-in">
                                                <CheckCircle size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-[#364649]">¡Actividad Guardada!</h4>
                                                <p className="text-sm text-[#364649]/60 mt-2">
                                                    Has registrado un Pre-Buying con <strong>{contactSearch}</strong>.
                                                </p>
                                            </div>
                                            <div className="bg-[#AA895F]/5 border border-[#AA895F]/20 rounded-xl p-4 text-left">
                                                <p className="text-sm font-bold text-[#AA895F] mb-1 flex items-center">
                                                    <HelpCircle size={16} className="mr-2" /> ¿Fue una reunión calificada?
                                                </p>
                                                <p className="text-xs text-[#364649]/70 leading-relaxed">
                                                    Si el cliente tiene potencial real y definiste su búsqueda (NURC), deberías crear su ficha ahora.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => handleQualifyPB(true)}
                                                    className="w-full bg-[#364649] text-white py-3 rounded-xl font-bold hover:bg-[#2A3638] shadow-lg flex items-center justify-center"
                                                >
                                                    <UserPlus size={18} className="mr-2" /> Sí, cargar Búsqueda
                                                </button>
                                                <button
                                                    onClick={() => handleQualifyPB(false)}
                                                    className="w-full bg-white border border-[#364649]/10 text-[#364649]/60 py-3 rounded-xl font-bold hover:text-[#364649] hover:bg-gray-50"
                                                >
                                                    No, solo registrar actividad
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 'select-contact' && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-[#364649] bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                                                <Activity size={16} className="text-blue-600 mr-2 mt-0.5 shrink-0" />
                                                <span>
                                                    Estás cargando: <strong>{ACTIVITY_ROWS.find(r => r.id === selectedType)?.label}</strong>.
                                                    {selectedType === 'visita'
                                                        ? ' Para agendar una visita, es necesario vincularla a un Comprador. Selecciónalo de la lista o crea uno nuevo.'
                                                        : ' Para mantener la base de datos limpia, selecciona o crea el cliente.'}
                                                </span>
                                            </p>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-[#364649]/60">Buscar {isBuyerFlow ? 'Comprador' : 'Propietario'}</label>
                                                <div className="relative">
                                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" />
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre del cliente..."
                                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#AA895F] transition-all"
                                                        value={contactSearch}
                                                        onChange={e => setContactSearch(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl bg-white shadow-sm divide-y divide-gray-50">
                                                    {isBuyerFlow
                                                        ? buyers.filter(b => b.name.toLowerCase().includes(contactSearch.toLowerCase())).map(b => (
                                                            <div key={b.id} onClick={() => handleContactSelect(b.id, b.name)} className="p-3 hover:bg-[#AA895F]/5 cursor-pointer flex justify-between items-center group transition-colors">
                                                                <span className="text-sm font-medium text-[#364649] group-hover:text-[#AA895F]">{b.name}</span>
                                                                <ArrowRight size={14} className="text-[#364649]/20 group-hover:text-[#AA895F]" />
                                                            </div>
                                                        ))
                                                        : clients.filter(c => c.owners[0].name.toLowerCase().includes(contactSearch.toLowerCase())).map(c => (
                                                            <div key={c.id} onClick={() => handleContactSelect(c.id, c.owners[0].name)} className="p-3 hover:bg-[#AA895F]/5 cursor-pointer flex justify-between items-center group transition-colors">
                                                                <span className="text-sm font-medium text-[#364649] group-hover:text-[#AA895F]">{c.owners[0].name}</span>
                                                                <ArrowRight size={14} className="text-[#364649]/20 group-hover:text-[#AA895F]" />
                                                            </div>
                                                        ))
                                                    }
                                                    {contactSearch && (
                                                        <div onClick={handleCreateContact} className="p-3 bg-[#AA895F]/10 text-[#AA895F] font-bold text-center cursor-pointer hover:bg-[#AA895F]/20 transition-colors">
                                                            + Crear Nuevo Cliente "{contactSearch}"
                                                        </div>
                                                    )}
                                                    {isBuyerFlow && !contactSearch && (
                                                        <div onClick={() => onNavigateTo('buyers')} className="p-3 bg-gray-50 text-[#364649]/60 text-xs text-center cursor-pointer hover:bg-gray-100 transition-colors border-t border-gray-100">
                                                            ¿Necesitas gestión avanzada? <span className="underline">Ir a Clientes Compradores</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 'create-contact' && (
                                        isBuyerFlow ? (
                                            <BuyerClientForm onSave={handleSaveNewBuyer} onCancel={() => setWizardStep('select-contact')} initialData={null} />
                                        ) : (
                                            <ClientForm onSave={handleSaveNewClient} onCancel={() => setWizardStep('select-contact')} initialData={null} />
                                        )
                                    )}

                                    {wizardStep === 'create-record' && tempClientId && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                                <span className="text-sm text-emerald-800 font-bold flex items-center">
                                                    <CheckCircle size={16} className="mr-2" /> Cliente Vinculado: {contactSearch}
                                                </span>
                                                <button onClick={() => setWizardStep('select-contact')} className="text-xs text-emerald-600 underline">Cambiar</button>
                                            </div>
                                            {selectedType === 'pre_buying' && (
                                                <BuyerSearchForm
                                                    clients={buyers}
                                                    properties={properties}
                                                    onSave={handleSaveNewSearch}
                                                    onCancel={() => setWizardStep('select-contact')}
                                                    defaultClientId={tempClientId}
                                                />
                                            )}
                                            {selectedType === 'captacion' && (
                                                <PropertyForm
                                                    clients={clients}
                                                    onSave={handleSaveNewProperty}
                                                    onCancel={() => setWizardStep('select-contact')}
                                                    defaultClientId={tempClientId}
                                                />
                                            )}
                                            {selectedType === 'visita' && (
                                                <>
                                                    <div className="mb-2 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100 flex items-center">
                                                        <Calendar size={14} className="mr-2" />
                                                        <span>Recuerda: Solo las visitas con estado <strong>"Realizada"</strong> sumarán a las estadísticas semanales.</span>
                                                    </div>
                                                    <VisitForm
                                                        properties={properties}
                                                        buyers={buyers}
                                                        buyerSearches={searches || []}
                                                        onSave={handleSaveNewVisit}
                                                        onCancel={() => setIsModalOpen(false)}
                                                        initialData={{
                                                            id: '',
                                                            buyerClientId: tempClientId,
                                                            status: 'pendiente',
                                                            propertyId: '', agentName: '', date: '', time: '', duration: '30', meetingPoint: 'propiedad', securityCheck: false, signedConfirmation: false, createdAt: ''
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {wizardStep === 'finalize' && (
                                        <form onSubmit={handleSimpleSubmit} className="space-y-4">
                                            <div className="bg-gray-50 p-3 rounded-lg text-xs font-bold text-[#364649]/70 flex justify-between">
                                                <span>{WEEK_DAYS[selectedDayIndex]} {weekDates[selectedDayIndex].getDate()}</span>
                                                <span className="uppercase text-[#AA895F]">{ACTIVITY_ROWS.find(r => r.id === selectedType)?.label}</span>
                                            </div>
                                            <div className="relative">
                                                <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Persona / Contacto</label>
                                                {tempClientId ? (
                                                    <div className="flex items-center justify-between bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                                                        <span className="text-sm text-emerald-800 font-bold flex items-center">
                                                            <CheckCircle size={16} className="mr-2" /> {contactSearch}
                                                        </span>
                                                        <button type="button" onClick={() => setWizardStep('select-contact')} className="text-xs text-emerald-600 underline">Cambiar</button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#364649]/40" />
                                                        <input
                                                            type="text"
                                                            value={contactSearch}
                                                            onChange={e => setContactSearch(e.target.value)}
                                                            placeholder="Nombre del contacto..."
                                                            className="w-full bg-white border border-[#364649]/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-[#AA895F]"
                                                            autoFocus
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-[#364649]/60 uppercase mb-1">Comentarios / Resultado</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={e => setNotes(e.target.value)}
                                                    className="w-full bg-white border border-[#364649]/10 rounded-lg p-3 text-sm outline-none h-20 resize-none focus:border-[#AA895F]"
                                                    placeholder="Resumen de la reunión..."
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" className="w-full bg-[#364649] text-white py-3 rounded-xl font-bold hover:bg-[#2A3638] transition-colors shadow-lg">
                                                    Guardar Actividad
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- CLOSING FORM MODAL --- */}
            {isClosingFormOpen && (
                <ClosingForm
                    properties={properties}
                    buyers={buyers}
                    onSave={onSaveClosing}
                    onCancel={() => {
                        setIsClosingFormOpen(false);
                        setSelectedClosingId(null);
                    }}
                    onDelete={onDeleteClosing}
                    commissionSplit={45}
                    initialData={selectedClosingId ? closingLogs?.find(c => c.id === selectedClosingId) : null}
                    exchangeRate={1000}
                    onNavigateTo={onNavigateTo}
                />
            )}
        </div>
    );
};

const ProgressBar = ({ label, current, target, color, icon, subtext }: any) => {
    const percent = Math.min((current / target) * 100, 100);
    return (
        <div className="bg-white border border-[#364649]/5 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">{icon}</div>
            <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                    <div>
                        <p className="text-xs font-bold text-[#364649] uppercase tracking-wider">{label}</p>
                        {subtext && <p className="text-[10px] text-[#364649]/40">{subtext}</p>}
                    </div>
                    <p className="text-lg font-bold text-[#364649]">{current} <span className="text-sm text-[#364649]/40">/ {target}</span></p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyDashboard;
