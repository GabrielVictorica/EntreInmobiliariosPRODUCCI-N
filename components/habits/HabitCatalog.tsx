import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Habit, HabitCategory } from '../../types';
import {
    Search,
    Filter,
    ChevronUp,
    ChevronDown,
    Sun,
    Sunset,
    Moon,
    Calendar,
    Flame,
    Trophy,
    Clock,
    Zap,
    Edit2,
    Trash2,
    Loader2,
    ListFilter,
    X
} from 'lucide-react';

// Mapeo DB -> Frontend
const mapHabitFromDB = (db: any, categories: HabitCategory[]): Habit => ({
    id: db.id,
    userId: db.user_id,
    name: db.name,
    categoryId: db.category_id,
    category: categories.find(c => c.id === db.category_id),
    frequency: db.frequency || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    scheduleType: db.schedule_type || 'flexible',
    preferredBlock: db.preferred_block || 'anytime',
    fixedTime: db.fixed_time,
    estimatedDuration: db.estimated_duration || 15,
    cognitiveLoad: db.cognitive_load || 'medium',
    active: db.active !== false,
    icon: db.icon || '📌',
    currentStreak: db.current_streak || 0,
    longestStreak: db.longest_streak || 0,
    lastCompletedDate: db.last_completed_date,
    createdAt: db.created_at,
    endDate: db.end_date,
    googleEventId: db.google_event_id
});

interface HabitCatalogProps {
    userId: string;
    categories: HabitCategory[];
    onEditHabit?: (habit: Habit) => void;
    onDeleteHabit?: (habitId: string) => void;
}

type SortField = 'name' | 'category' | 'duration' | 'streak' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function HabitCatalog({ userId, categories, onEditHabit, onDeleteHabit }: HabitCatalogProps) {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
    const [blockFilter, setBlockFilter] = useState<string | 'all'>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch only active habits (eliminated habits are not shown)
    const fetchAllHabits = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setHabits(data.map(h => mapHabitFromDB(h, categories)));
        }
        setLoading(false);
    }, [userId, categories]);

    useEffect(() => {
        fetchAllHabits();
    }, [fetchAllHabits]);

    // Filter and sort habits
    const filteredHabits = useMemo(() => {
        let result = [...habits];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(h => h.name.toLowerCase().includes(term));
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(h => h.categoryId === categoryFilter);
        }

        // Block filter
        if (blockFilter !== 'all') {
            result = result.filter(h => h.preferredBlock === blockFilter);
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'category':
                    comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
                    break;
                case 'duration':
                    comparison = a.estimatedDuration - b.estimatedDuration;
                    break;
                case 'streak':
                    comparison = b.currentStreak - a.currentStreak;
                    break;
                case 'createdAt':
                    comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [habits, searchTerm, categoryFilter, blockFilter, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getBlockIcon = (block: string) => {
        switch (block) {
            case 'morning': return <Sun size={14} className="text-amber-500" />;
            case 'afternoon': return <Sunset size={14} className="text-orange-500" />;
            case 'evening': return <Moon size={14} className="text-indigo-500" />;
            default: return <Calendar size={14} className="text-slate-400" />;
        }
    };

    const getBlockName = (block: string) => {
        switch (block) {
            case 'morning': return 'Mañana';
            case 'afternoon': return 'Tarde';
            case 'evening': return 'Noche';
            default: return 'Flexible';
        }
    };

    const getCognitiveIcon = (load: string) => {
        switch (load) {
            case 'high': return <Zap size={14} className="text-red-400" />;
            case 'medium': return <Zap size={14} className="text-yellow-400" />;
            default: return <Zap size={14} className="text-green-400" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' });
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <div className="w-4" />;
        return sortDirection === 'asc'
            ? <ChevronUp size={14} className="text-[#AA895F]" />
            : <ChevronDown size={14} className="text-[#AA895F]" />;
    };

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setBlockFilter('all');
    };

    const hasActiveFilters = searchTerm || categoryFilter !== 'all' || blockFilter !== 'all';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#AA895F]" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Search and Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-[#364649]/5">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar hábito..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#AA895F] focus:ring-2 focus:ring-[#AA895F]/20 transition-all outline-none text-[#364649]"
                        />
                    </div>

                    {/* Filter Toggle Button (Mobile) */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${showFilters || hasActiveFilters
                            ? 'bg-[#364649] text-white border-[#364649]'
                            : 'bg-white text-slate-600 border-gray-200 hover:border-[#AA895F]'
                            }`}
                    >
                        <ListFilter size={18} />
                        Filtros
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-[#AA895F]" />
                        )}
                    </button>

                    {/* Filters (Desktop always visible, Mobile toggleable) */}
                    <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-wrap gap-3`}>
                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#AA895F] focus:ring-2 focus:ring-[#AA895F]/20 transition-all outline-none text-sm text-[#364649] bg-white min-w-[140px]"
                        >
                            <option value="all">📂 Categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                            ))}
                        </select>

                        {/* Block Filter */}
                        <select
                            value={blockFilter}
                            onChange={(e) => setBlockFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#AA895F] focus:ring-2 focus:ring-[#AA895F]/20 transition-all outline-none text-sm text-[#364649] bg-white min-w-[130px]"
                        >
                            <option value="all">⏰ Bloque</option>
                            <option value="morning">🌅 Mañana</option>
                            <option value="afternoon">🌇 Tarde</option>
                            <option value="evening">🌙 Noche</option>
                            <option value="anytime">📅 Flexible</option>
                        </select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <X size={14} />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Results count */}
                <div className="mt-3 text-sm text-slate-500">
                    {filteredHabits.length} hábito{filteredHabits.length !== 1 ? 's' : ''} encontrado{filteredHabits.length !== 1 ? 's' : ''}
                    {habits.length > 0 && filteredHabits.length !== habits.length && (
                        <span className="text-slate-400"> de {habits.length} totales</span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-[#364649]/5 overflow-hidden">
                {filteredHabits.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-[#364649] mb-1">No se encontraron hábitos</h3>
                        <p className="text-slate-500 text-sm">
                            {hasActiveFilters
                                ? 'Probá ajustando los filtros de búsqueda'
                                : 'Creá tu primer hábito para comenzar'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            Hábito
                                            <SortIcon field="name" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('category')}
                                        className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors hidden sm:table-cell"
                                    >
                                        <div className="flex items-center gap-1">
                                            Categoría
                                            <SortIcon field="category" />
                                        </div>
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                                        Frecuencia
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                                        Bloque
                                    </th>
                                    <th
                                        onClick={() => handleSort('duration')}
                                        className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors hidden lg:table-cell"
                                    >
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <SortIcon field="duration" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('streak')}
                                        className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <Flame size={12} />
                                            <SortIcon field="streak" />
                                        </div>
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                                        <Trophy size={12} className="mx-auto" />
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredHabits.map((habit) => (
                                    <tr
                                        key={habit.id}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        {/* Habit Name */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{habit.icon}</span>
                                                <div>
                                                    <span className="font-semibold text-[#364649]">{habit.name}</span>
                                                    {/* Mobile: Show category below */}
                                                    <div className="sm:hidden mt-1">
                                                        {habit.category && (
                                                            <span
                                                                className="text-xs px-2 py-0.5 rounded-full"
                                                                style={{
                                                                    backgroundColor: `${habit.category.color}20`,
                                                                    color: habit.category.color
                                                                }}
                                                            >
                                                                {habit.category.emoji} {habit.category.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            {habit.category && (
                                                <span
                                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                                                    style={{
                                                        backgroundColor: `${habit.category.color}15`,
                                                        color: habit.category.color
                                                    }}
                                                >
                                                    {habit.category.emoji} {habit.category.name}
                                                </span>
                                            )}
                                        </td>

                                        {/* Frequency */}
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <div className="flex gap-0.5">
                                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => {
                                                    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                                    const isActive = habit.frequency.includes(dayKeys[i] as any);
                                                    return (
                                                        <span
                                                            key={d}
                                                            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${isActive
                                                                ? 'bg-[#364649] text-white'
                                                                : 'bg-gray-100 text-gray-300'
                                                                }`}
                                                        >
                                                            {d}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        {/* Block */}
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                {getBlockIcon(habit.preferredBlock)}
                                                <span>{getBlockName(habit.preferredBlock)}</span>
                                                {habit.fixedTime && (
                                                    <span className="text-xs text-[#AA895F] font-medium">
                                                        {habit.fixedTime}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Duration */}
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                <Clock size={12} className="text-slate-400" />
                                                {habit.estimatedDuration}m
                                                {getCognitiveIcon(habit.cognitiveLoad)}
                                            </div>
                                        </td>

                                        {/* Current Streak */}
                                        <td className="px-4 py-3 text-center">
                                            {habit.currentStreak > 0 ? (
                                                <div className="inline-flex items-center gap-1 text-orange-500 font-bold">
                                                    <Flame size={14} />
                                                    <span>{habit.currentStreak}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* Longest Streak */}
                                        <td className="px-4 py-3 text-center hidden xl:table-cell">
                                            {habit.longestStreak > 0 ? (
                                                <div className="inline-flex items-center gap-1 text-amber-500 font-bold">
                                                    <Trophy size={14} />
                                                    <span>{habit.longestStreak}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {onEditHabit && (
                                                    <button
                                                        onClick={() => onEditHabit(habit)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-[#364649] transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {onDeleteHabit && (
                                                    <button
                                                        onClick={() => onDeleteHabit(habit.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {habits.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#364649]/5">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Total Hábitos</p>
                        <p className="text-2xl font-black text-[#364649]">{habits.filter(h => h.active).length}</p>
                        <p className="text-xs text-slate-400">activos</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#364649]/5">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Tiempo Diario</p>
                        <p className="text-2xl font-black text-[#364649]">
                            {Math.round(habits.filter(h => h.active).reduce((acc, h) => acc + h.estimatedDuration, 0) / 60 * 10) / 10}h
                        </p>
                        <p className="text-xs text-slate-400">si se completan todos</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#364649]/5">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Mejor Racha</p>
                        <div className="flex items-center gap-1">
                            <Trophy size={20} className="text-amber-500" />
                            <p className="text-2xl font-black text-[#364649]">
                                {Math.max(...habits.map(h => h.longestStreak), 0)}
                            </p>
                        </div>
                        <p className="text-xs text-slate-400">días consecutivos</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#364649]/5">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Categorías</p>
                        <p className="text-2xl font-black text-[#364649]">
                            {new Set(habits.filter(h => h.active).map(h => h.categoryId)).size}
                        </p>
                        <p className="text-xs text-slate-400">esferas de vida</p>
                    </div>
                </div>
            )}
        </div>
    );
}
