import React, { useCallback, useMemo, useState } from 'react';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';
import {
    Users,
    HelpCircle,
    Building2,
    LogOut,
    Wallet,
    UserCheck,
    Calendar,
    ChevronDown,
    ChevronRight,
    Target,
    Flag,
    LayoutDashboard,
    PieChart,
    CalendarDays,
    DollarSign,
    CheckCircle2
} from 'lucide-react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick?: () => void;
    disabled?: boolean;
    small?: boolean;
}

const NavItem = React.memo(({ icon, label, active, onClick, disabled, small }: NavItemProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center p-3 rounded-xl mb-1 nav-item-base nav-item-hover ${active ? 'nav-item-active' : 'text-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <span className={`relative z-10 transition-colors duration-200 ${active ? 'text-[#364649]' : 'text-slate-300 group-hover:text-white'}`}>
            {icon}
        </span>
        <span className={`relative z-10 hidden lg:block ml-3 truncate ${small ? 'text-xs' : 'text-sm'}`}>
            {label}
        </span>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#AA895F] rounded-r-full lg:hidden animate-scale-in"></div>}
    </button>
));

const SidebarOptimized = () => {
    // 1. Subscribe ONLY to navigation state
    const { activeView, navigateTo } = useBusinessStore(useShallow(state => ({
        activeView: state.activeView,
        navigateTo: state.navigateTo
    })));

    const signOut = useBusinessStore(state => state.signOut);

    const onLogout = useCallback(async () => {
        await signOut();
        window.location.href = '/';
    }, [signOut]);

    // 2. Derive expanded group from activeView (Pure calculation, cheap)
    const derivedExpandedGroup = useMemo(() => {
        if (['dashboard', 'form', 'properties-list', 'property-form'].includes(activeView)) return 'sellers';
        if (['buyer-clients-list', 'buyer-client-form', 'buyer-searches-list', 'buyer-search-form', 'visits-list', 'visit-form'].includes(activeView)) return 'buyers';
        if (['my-week', 'objectives', 'closings', 'habits'].includes(activeView)) return 'trakeo';
        if (['home', 'metrics-home', 'metrics-control'].includes(activeView)) return 'metrics';
        return null;
    }, [activeView]);

    const [manualGroup, setManualGroup] = useState<string | null>(null);
    const activeGroup = manualGroup !== null ? manualGroup : derivedExpandedGroup;

    const toggleGroup = useCallback((group: string) => {
        setManualGroup(prev => prev === group ? '' : group);
    }, []);

    // 3. Stable Icons
    const icons = useMemo(() => ({
        home: <LayoutDashboard size={20} />,
        control: <PieChart size={20} />,
        calendar: <Calendar size={20} />,
        users: <Users size={20} />,
        misClientes: <Users size={18} />,
        propiedades: <Building2 size={18} />,
        userCheck: <UserCheck size={20} />,
        compradoresClientes: <UserCheck size={18} />,
        busquedas: <Wallet size={18} />,
        visitas: <Calendar size={18} />,
        target: <Target size={20} />,
        miSemana: <CalendarDays size={18} />,
        cierres: <DollarSign size={18} />,
        objetivos: <Flag size={18} />,
        habitos: <CheckCircle2 size={18} />,
        ayuda: <HelpCircle size={20} />
    }), []);

    // 4. Stable Navigation Handlers
    const navToHome = useCallback(() => navigateTo('metrics-home'), [navigateTo]);
    const navToControl = useCallback(() => navigateTo('metrics-control'), [navigateTo]);
    const navToCalendar = useCallback(() => navigateTo('calendar'), [navigateTo]);
    const navToSellers = useCallback(() => navigateTo('dashboard'), [navigateTo]);
    const navToProperties = useCallback(() => navigateTo('properties-list'), [navigateTo]);
    const navToBuyers = useCallback(() => navigateTo('buyer-clients-list'), [navigateTo]);
    const navToSearches = useCallback(() => navigateTo('buyer-searches-list'), [navigateTo]);
    const navToVisits = useCallback(() => navigateTo('visits-list'), [navigateTo]);
    const navToWeek = useCallback(() => navigateTo('my-week'), [navigateTo]);
    const navToClosings = useCallback(() => navigateTo('closings'), [navigateTo]);
    const navToObjectives = useCallback(() => navigateTo('objectives'), [navigateTo]);
    const navToHabits = useCallback(() => navigateTo('habits'), [navigateTo]);

    return (
        <aside className="w-20 lg:w-64 flex-shrink-0 z-20 flex flex-col justify-between bg-[#364649] text-white transition-[width] duration-300 shadow-xl overflow-visible">
            <div>
                <div className="h-24 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/10">
                    <div className="w-10 h-10 bg-[#AA895F] rounded-xl flex items-center justify-center shadow-lg transform-gpu hover:scale-105 transition-transform duration-300 shrink-0">
                        <Building2 className="text-white" size={22} />
                    </div>
                    <div className="hidden lg:flex flex-col ml-3 justify-center">
                        <span className="font-semibold text-lg text-[#E0D8CC] leading-none">Entre</span>
                        <span className="text-[10px] font-bold text-[#AA895F] uppercase tracking-[0.2em] leading-tight mt-1">Inmobiliarios</span>
                    </div>
                </div>

                <nav className="mt-8 px-4 space-y-2">
                    <NavItem
                        icon={icons.home}
                        label="INICIO"
                        active={activeView === 'home' || activeView === 'metrics-home'}
                        onClick={navToHome}
                    />
                    <NavItem
                        icon={icons.control}
                        label="Control Negocio"
                        active={activeView === 'metrics-control'}
                        onClick={navToControl}
                    />

                    <NavItem
                        icon={icons.calendar}
                        label="Calendario"
                        active={activeView === 'calendar'}
                        onClick={navToCalendar}
                    />

                    {/* VENDEDORES GROUP */}
                    <div className="relative">
                        <button
                            onClick={() => toggleGroup('sellers')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 nav-item-base nav-item-hover ${activeGroup === 'sellers' ? 'text-white' : 'text-slate-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <Users size={20} className="transition-colors" />
                                <span className="hidden lg:block ml-3 text-sm font-bold uppercase tracking-wider">Vendedores</span>
                            </div>
                            <div className="hidden lg:block">
                                {activeGroup === 'sellers' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </button>
                        <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${activeGroup === 'sellers' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="ml-0 lg:ml-4 border-l border-white/10 pl-2 space-y-1 mt-1">
                                <NavItem
                                    icon={icons.misClientes}
                                    label="Mis Clientes"
                                    active={activeView === 'dashboard' || activeView === 'form'}
                                    onClick={navToSellers}
                                    small
                                />
                                <NavItem
                                    icon={icons.propiedades}
                                    label="Propiedades"
                                    active={activeView === 'properties-list' || activeView === 'property-form'}
                                    onClick={navToProperties}
                                    small
                                />
                            </div>
                        </div>
                    </div>

                    {/* COMPRADORES GROUP */}
                    <div className="relative">
                        <button
                            onClick={() => toggleGroup('buyers')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 nav-item-base nav-item-hover ${activeGroup === 'buyers' ? 'text-white' : 'text-slate-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <UserCheck size={20} className="transition-colors" />
                                <span className="hidden lg:block ml-3 text-sm font-bold uppercase tracking-wider">Compradores</span>
                            </div>
                            <div className="hidden lg:block">
                                {activeGroup === 'buyers' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </button>
                        <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${activeGroup === 'buyers' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="ml-0 lg:ml-4 border-l border-white/10 pl-2 space-y-1 mt-1">
                                <NavItem
                                    icon={icons.compradoresClientes}
                                    label="Mis Clientes"
                                    active={activeView === 'buyer-clients-list' || activeView === 'buyer-client-form'}
                                    onClick={navToBuyers}
                                    small
                                />
                                <NavItem
                                    icon={icons.busquedas}
                                    label="Búsquedas Activas"
                                    active={activeView === 'buyer-searches-list' || activeView === 'buyer-search-form'}
                                    onClick={navToSearches}
                                    small
                                />
                                <NavItem
                                    icon={icons.visitas}
                                    label="Visitas"
                                    active={activeView === 'visits-list' || activeView === 'visit-form'}
                                    onClick={navToVisits}
                                    small
                                />
                            </div>
                        </div>
                    </div>

                    {/* TRAKEO GROUP */}
                    <div className="relative">
                        <button
                            onClick={() => toggleGroup('trakeo')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 nav-item-base nav-item-hover ${activeGroup === 'trakeo' ? 'text-white' : 'text-slate-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <Target size={20} className="transition-colors" />
                                <span className="hidden lg:block ml-3 text-sm font-bold uppercase tracking-wider">Trakeo</span>
                            </div>
                            <div className="hidden lg:block">
                                {activeGroup === 'trakeo' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </button>
                        <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${activeGroup === 'trakeo' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="ml-0 lg:ml-4 border-l border-white/10 pl-2 space-y-1 mt-1">
                                <NavItem
                                    icon={icons.miSemana}
                                    label="Mí Semana"
                                    active={activeView === 'my-week'}
                                    onClick={navToWeek}
                                    small
                                />
                                <NavItem
                                    icon={icons.cierres}
                                    label="Cierres"
                                    active={activeView === 'closings'}
                                    onClick={navToClosings}
                                    small
                                />
                                <NavItem
                                    icon={icons.objetivos}
                                    label="Objetivos"
                                    active={activeView === 'objectives'}
                                    onClick={navToObjectives}
                                    small
                                />
                                <NavItem
                                    icon={icons.habitos}
                                    label="Mis Hábitos"
                                    active={activeView === 'habits'}
                                    onClick={navToHabits}
                                    small
                                />
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="mb-8 px-4">
                <NavItem icon={icons.ayuda} label="Ayuda" active={false} />
                <div className="mt-2">
                    <button
                        onClick={onLogout}
                        className="flex items-center w-full p-3 rounded-xl text-slate-300 nav-item-base nav-item-hover"
                    >
                        <LogOut size={20} className="transition-colors duration-200" />
                        <span className="hidden lg:block ml-3 text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default React.memo(SidebarOptimized);
