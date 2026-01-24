import React from 'react';
import { Users, Bell, LogOut, ChevronDown } from 'lucide-react';

interface HeaderProps {
    view: string;
    isMother: boolean;
    selectedTeamUser: string | null;
    teamUsers: any[];
    session: any;
    onLogout: () => void;
    onSelectTeamUser: (userId: string | null) => void;
}

const Header = React.memo(({
    view,
    isMother,
    selectedTeamUser,
    teamUsers,
    session,
    onLogout,
    onSelectTeamUser
}: HeaderProps) => {
    const getTitle = () => {
        if (view === 'home' || view === 'metrics-home') return 'Inicio';
        if (view === 'metrics-control') return 'Control de Negocio';
        if (view.includes('buyer')) return 'Gestión Compradores';
        if (view.includes('visit')) return 'Gestión Visitas';
        return view.replace('-', ' ');
    };

    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#364649]/10 px-8 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-[#364649] capitalize">
                    {getTitle()}
                </h2>
            </div>

            {/* MOTHER USER: Team Filter */}
            {isMother && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#364649]/10 shadow-sm ml-4">
                    <Users size={16} className="text-[#AA895F]" />
                    <span className="text-xs font-bold text-[#364649]/50 uppercase tracking-wider mr-1">Equipo:</span>
                    <div className="relative">
                        <select
                            value={selectedTeamUser || ''}
                            onChange={(e) => onSelectTeamUser(e.target.value || null)}
                            className="appearance-none bg-transparent font-bold text-sm text-[#364649] pr-6 cursor-pointer focus:outline-none"
                        >
                            <option value="">Mis Datos (Personal)</option>
                            <option value="global">Resumen Equipo (Global)</option>
                            {teamUsers.map(u => (
                                <option key={u.user_id} value={u.user_id}>{u.email}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#364649]/40 pointer-events-none" />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 ml-auto">
                <button className="p-2 rounded-full hover:bg-gray-100 text-[#364649]/60 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-[#364649]">{session?.user?.email?.split('@')[0]}</p>
                        <p className="text-xs text-[#AA895F] font-bold tracking-wider">{isMother ? 'DIRECTOR (MADRE)' : 'AGENTE INMOBILIARIO'}</p>
                    </div>
                    <div
                        className="w-10 h-10 rounded-full bg-[#364649] text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:bg-[#AA895F] transition-colors"
                        onClick={onLogout}
                    >
                        <LogOut size={16} className="ml-0.5" />
                    </div>
                </div>
            </div>
        </header>
    );
});

export default Header;
