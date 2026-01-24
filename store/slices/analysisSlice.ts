import { StateCreator } from 'zustand';
import { supabase } from '../../services/supabaseClient';
import { BusinessState, DEFAULT_GOALS } from './types';
import { ActivityRecord, ClosingRecord } from '../../types';

export interface AnalysisSlice {
    getMetricsByYear: (year: number | null) => any;
    getUnifiedActivities: () => ActivityRecord[];
    getPerformanceMetrics: () => any;
    getPipelineValue: () => number;
    getHomeDisplayMetrics: (year: number) => any;
    fetchKPIs: (session?: any, isMother?: boolean, teamUser?: string | null) => Promise<void>;
}

// Internal Cache for Performance Optimization
let metricsCache = new Map<string, any>();
let performanceCache: any = null;
let unifiedActivitiesCache: any = null;
let pipelineCache: { properties: any[], searches: any[], result: number } | null = null;
let lastAnalysisRefs = {
    activities: [] as any[],
    closings: [] as any[],
    properties: [] as any[],
    visits: [] as any[]
};
let lastPerfUnifiedRef: any[] | null = null;
let homeMetricsCache = new Map<string, { metrics: any, analysis: any, perf: any, result: any }>();

export const createAnalysisSlice: StateCreator<BusinessState, [], [], AnalysisSlice> = (set, get) => ({
    getMetricsByYear: (year) => {
        const { closings, activities, properties, visits, goalsByYear } = get();
        const yearKey = year ? year.toString() : 'historical';

        // 1. ATOMIC INVALIDATION: Check if source references changed
        const hasDataChanged = (
            closings !== lastAnalysisRefs.closings ||
            activities !== lastAnalysisRefs.activities ||
            properties !== lastAnalysisRefs.properties ||
            visits !== lastAnalysisRefs.visits
        );

        if (hasDataChanged) {
            metricsCache.clear();
            homeMetricsCache.clear(); // Safe to clear here as it's the start of the chain
            performanceCache = null;
            unifiedActivitiesCache = null;
            lastPerfUnifiedRef = null;
            lastAnalysisRefs = { closings, activities, properties, visits };
        }

        // 2. CACHE HIT: Return stable reference
        if (metricsCache.has(yearKey)) {
            return metricsCache.get(yearKey);
        }

        const currentYear = year || new Date().getFullYear();
        const yearStr = year ? year.toString() : null;

        // SINGLE PASS: Closings
        // Calculate totals directly to avoid multiple reductions
        let totalBillingUSD = 0; // Interpreted as Gross Sales Volume in code, but name is ambiguous
        let totalGCIUSD = 0;    // NEW: Gross Commission Income
        let totalIncomeUSD = 0; // Net Income (Pocket)
        let totalSides = 0;
        let totalClosingsCount = 0;
        const filteredClosings: ClosingRecord[] = [];

        for (const c of closings) {
            if (!c || !c.date) continue;
            // Optimized Year Check
            const dateStr = typeof c.date === 'string' ? c.date : '';
            if (year && (!dateStr || dateStr.substring(0, 4) !== yearStr)) continue;


            // HISTORICAL EXCHANGE RATE LOGIC
            // To prevent historical distortion, we must use the exchange rate 
            // defined in the Goals for THAT specific year.
            const cYearStr = dateStr.substring(0, 4);
            const cYear = parseInt(cYearStr, 10);
            const yearGoal = goalsByYear[cYear] || DEFAULT_GOALS;
            const historicalRate = yearGoal.exchangeRate || 1100;

            const saleUSD = c.currency === 'ARS'
                ? (c.salePrice || 0) / historicalRate
                : (c.salePrice || 0);

            totalBillingUSD += saleUSD;

            const sideComm = (c.commissionPercent || 0) / 100;
            const split = (c.subSplitPercent || 50) / 100;

            // NEW: GCI Calculation (Before Splits)
            const sideGCI = saleUSD * sideComm;

            totalGCIUSD += sideGCI;
            totalIncomeUSD += (sideGCI * split);

            totalSides += (c.sides || 0);
            totalClosingsCount++;
            filteredClosings.push(c);
        }

        // SINGLE PASS: Activities
        let totalPLPB = 0;
        let totalCaptations = 0;
        let firstActivityTimestamp = Infinity; // For Weeks Calculation

        for (const a of activities) {
            if (!a || !a.date) continue;
            // For metrics that depend on the specific year filter
            const aYearStr = typeof a.date === 'string' ? a.date.substring(0, 4) : '';
            if (year) {
                if (aYearStr !== yearStr) continue;
            }

            // PL/PB Count (Exclude Captations per User Rule)
            if (a.type === 'pre_listing' || a.type === 'pre_buying') {
                totalPLPB++;
            }
            if (a.type === 'captacion') {
                totalCaptations++;
            }

            // Weeks Calculation Data
            // Only consider activities in the "Current Context Year" for the start date
            const isInContextYear = aYearStr === currentYear.toString();
            if (isInContextYear && typeof a.date === 'string') {
                const t = new Date(a.date).getTime();
                if (t < firstActivityTimestamp) firstActivityTimestamp = t;
            }
        }

        const avgTicketUSD = totalClosingsCount > 0 ? totalBillingUSD / totalClosingsCount : 0;
        const ratioPLPB = totalSides > 0 ? (totalPLPB / totalSides) : totalPLPB;
        const effectiveness = totalPLPB > 0 ? (totalSides / totalPLPB) * 100 : 0;
        const avgHonorariumUSD = totalSides > 0 ? totalIncomeUSD / totalSides : 0;
        const countGreenActivities = totalPLPB; // Simplified as logic was same
        const productivityUSD = countGreenActivities > 0 ? totalIncomeUSD / countGreenActivities : 0;
        const activePropertiesCount = properties.filter(p => p.status === 'disponible' || p.status === 'reservada').length;

        // Weeks Calculation
        let firstActivityDate = new Date(currentYear, 0, 1);
        if (firstActivityTimestamp !== Infinity) {
            firstActivityDate = new Date(firstActivityTimestamp);
            if (firstActivityDate.getMonth() === 0) firstActivityDate = new Date(currentYear, 0, 1);
        }

        const today = new Date();
        const calculationEndDate = (!year || today.getFullYear() === year) ? today : new Date(year, 11, 31);
        const msPerWeek = 1000 * 60 * 60 * 24 * 7;
        const weeksDiff = Math.max(0, (calculationEndDate.getTime() - firstActivityDate.getTime()) / msPerWeek);
        const weeksOfData = Math.max(Math.ceil(weeksDiff), 1);

        const result = {
            totalBillingUSD,
            totalIncomeUSD,
            totalSides,
            totalPLPB,
            totalCaptaciones: totalCaptations,
            avgTicketUSD,
            ratioPLPB,
            effectiveness,
            avgHonorariumUSD,
            productivityUSD,
            activePropertiesCount,
            filteredClosings,
            isDataReliable: filteredClosings.length >= 5 || (!year && totalSides >= 5),
            weeksOfData,
            totalGCIUSD
        };

        metricsCache.set(yearKey, result);
        return result;
    },

    getUnifiedActivities: () => {
        const { activities, properties, visits, buyers, clients, closings } = get();

        // 1. ATOMIC INVALIDATION
        if (closings !== lastAnalysisRefs.closings ||
            activities !== lastAnalysisRefs.activities ||
            properties !== lastAnalysisRefs.properties ||
            visits !== lastAnalysisRefs.visits) {

            metricsCache.clear();
            performanceCache = null;
            unifiedActivitiesCache = null;
            lastPerfUnifiedRef = null;
            lastAnalysisRefs = { closings, activities, properties, visits };
        }

        // 2. CACHE HIT
        if (unifiedActivitiesCache) {
            return unifiedActivitiesCache;
        }

        // CREATE LOOKUP MAPS (O(N) vs O(N*M))
        const buyerMap = new Map(buyers.map(b => [b.id, b.name]));
        const clientNameMap = new Map();
        clients.forEach(c => {
            if (c.owners?.[0]?.name) clientNameMap.set(c.id, c.owners[0].name);
        });

        const manual = activities;

        const systemVisits = visits
            .filter(v => v.status === 'realizada')
            .map(v => ({
                id: v.id,
                date: v.date,
                type: 'visita' as const,
                contactId: v.buyerClientId,
                contactName: buyerMap.get(v.buyerClientId) || 'Comprador',
                notes: `Visita propiedad: ${v.propertyId}. ${v.feedback?.positivePoints || ''}`,
                systemGenerated: true,
                referenceId: v.id,
                createdAt: v.createdAt
            }));

        const systemCaptures = properties
            .map(p => {
                if (!p || !p.createdAt || typeof p.createdAt !== 'string') return null;
                const datePart = p.createdAt.split('T')[0];
                return {
                    id: `sys-cap-${p.id}`,
                    date: datePart,
                    type: 'captacion' as const,
                    contactId: p.clientId,
                    contactName: clientNameMap.get(p.clientId) || 'Propietario',
                    notes: `Nueva propiedad: ${p.address?.street || ''} ${p.address?.number || ''}`,
                    systemGenerated: true,
                    referenceId: p.id,
                    createdAt: p.createdAt
                };
            }).filter((p): p is any => !!p);

        const result = [...manual, ...systemVisits, ...systemCaptures];
        unifiedActivitiesCache = result;
        return result;
    },

    getPerformanceMetrics: () => {
        const { getUnifiedActivities, closings } = get();
        const activities = getUnifiedActivities();

        // Check cache with STRICT reference equality on the UNIFIED array
        if (performanceCache && activities === lastPerfUnifiedRef && closings === lastAnalysisRefs.closings) {
            return performanceCache;
        }

        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Normalize to YYYY-MM-DD for reliable comparison
        const startStr = startOfWeek.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const endStr = endOfWeek.toLocaleDateString('en-CA');

        const currentYear = today.getFullYear();

        const weeklyActivities = activities.filter(a => {
            if (!a.date) return false;
            // Unified activities already have standardized date strings (YYYY-MM-DD) or ISO
            const activityDateStr = typeof a.date === 'string' ? a.date.split('T')[0] : '';
            return activityDateStr >= startStr && activityDateStr <= endStr;
        });

        const greenActivityTypes = ['act_verde', 'pre_listing', 'pre_buying', 'acm', 'captacion', 'visita', 'reserva', 'referido'];

        const greenMeetingsWeekly = weeklyActivities.filter(a => greenActivityTypes.includes(a.type)).length;
        const weeklyPLDone = weeklyActivities.filter(a => a.type === 'pre_listing').length;
        const weeklyPBDone = weeklyActivities.filter(a => a.type === 'pre_buying').length;

        const yearClosings = closings.filter(c => {
            if (!c.date) return false;
            const yearStr = typeof c.date === 'string' ? c.date.substring(0, 4) : '';
            return parseInt(yearStr, 10) === currentYear;
        });

        const totalSidesYear = yearClosings.reduce((sum, c) => sum + (c.sides || 0), 0);
        const totalWeeklyTraction = weeklyPLDone + weeklyPBDone;

        const result = {
            greenMeetingsWeekly,
            weeklyPLDone,
            weeklyPBDone,
            totalWeeklyTraction,
            totalSidesYear
        };

        performanceCache = result;
        lastPerfUnifiedRef = activities; // Update the reference for next comparison
        return result;
    },

    getPipelineValue: () => {
        const { properties, searches, normalizeToUSD } = get();

        if (pipelineCache && pipelineCache.properties === properties && pipelineCache.searches === searches) {
            return pipelineCache.result;
        }

        const inventoryPipeline = properties
            .filter(p => p.status === 'disponible' || p.status === 'reservada')
            .reduce((sum, p) => {
                const priceUSD = normalizeToUSD(p.price || 0, p.currency);
                return sum + (priceUSD * 0.03 * 0.40);
            }, 0);

        const buyerPipeline = (searches || [])
            .filter(s => s.status === 'activo')
            .reduce((sum, s) => {
                const budgetUSD = normalizeToUSD(s.searchProfile?.budget?.max || 0, s.searchProfile?.budget?.currency || 'USD');
                return sum + (budgetUSD * 0.03 * 0.10);
            }, 0);

        const result = inventoryPipeline + buyerPipeline;
        pipelineCache = { properties, searches, result };
        return result;
    },

    getHomeDisplayMetrics: (year) => {
        const { getMetricsByYear, getPlanAnalysis, getPerformanceMetrics, goalsByYear } = get();
        const metrics = getMetricsByYear(year);
        // Use standard year lookup with DEFAULT_GOALS fallback. No "currentYear" pivot.
        const financialGoals = goalsByYear[year] || DEFAULT_GOALS;
        const analysis = getPlanAnalysis(year, financialGoals);
        const perf = getPerformanceMetrics();

        const yearKey = year ? year.toString() : 'historical';

        // Check if underlying data changed (relying on the stability of the sub-selectors)
        // Ideally we should check strict equality of inputs, but since they are derived from cache too, it works.
        // Actually, let's just cache the result keying by the dependent objects references?
        // Simpler: use the same invalidation logic as getMetricsByYear

        // Actually, better to just check if inputs are the same as last time
        // We'll trust that getMetricsByYear, getPlanAnalysis, and getPerformanceMetrics return stable references if data hasn't changed.

        if (!metrics || !analysis) return undefined;

        // Check cache with composite key or just checking input equality
        // Since we don't have easy access to a "lastInputs" for this specific function scope without closure or module var,
        // we will use a module level cache and invalidate if inputs differ?
        // Actually, createAnalysisSlice has access to module scope variables.

        // Let's rely on simple memoization:
        // Key: year + metricsRef + analysisRef + perfRef
        // Since objects are expected to be stable references if cached efficiently in other slices...
        // But JSON stringifying is expensive.

        // Let's blindly check if we have a cached value for this year and assume invalidation if the other slices invalidated.
        // We can add a specialized check.

        if (homeMetricsCache.has(yearKey)) {
            const cached = homeMetricsCache.get(yearKey);
            // Check for STRICT equality of the objects being used as keys. 
            // Since metrics, analysis and perf are themselves cached in their own slices, 
            // they will remain referentially stable if nothing changed.
            if (cached?.metrics === metrics && cached?.analysis === analysis && cached?.perf === perf) {
                return cached.result;
            }
        }

        const result = {
            transactionsNeeded: analysis.transactionsNeeded,
            transactionsDone: metrics.totalSides,
            greenMeetingsTarget: 15,
            greenMeetingsDone: perf.greenMeetingsWeekly,
            pocketFees: metrics.totalIncomeUSD,
            pocketFeesTarget: analysis.pocketFeesTarget,
            criticalNumberTarget: analysis.realCriticalNumber,
            criticalNumberDone: perf.totalWeeklyTraction,
            weeklyPLDone: perf.weeklyPLDone,
            activeProperties: metrics.activePropertiesCount,
            honorariosPromedio: metrics.avgHonorariumUSD, // NCI Promedio
            avgTicketUSD: metrics.avgTicketUSD, // Precio Venta Promedio
            productividadActividad: metrics.productivityUSD,
            totalGCI: metrics.totalGCIUSD
        };

        // Cache the newly computed result and its dependencies
        homeMetricsCache.set(yearKey, { metrics, analysis, perf, result });
        return result;
    },

    fetchKPIs: async (currentSession?: any, momStatus?: boolean, teamUser?: string | null) => {
        const { kpiData, setKpiData, authSession, authRole, targetUserId } = get();
        // Use provided session or fallback to authSession from store
        const sess = currentSession || authSession;
        if (!sess?.user?.id) return;

        const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';
        const token = sess?.access_token || SUPABASE_KEY;

        let url = `${SUPABASE_URL}/rest/v1/view_kpi_dashboard_anual?select=*`;

        // Determine effective Role and Target
        // If arguments are passed (legacy), use them. Otherwise rely on Store (Robust Mode).
        const isMom = momStatus !== undefined ? momStatus : (authRole === 'mother');
        // For target, if teamUser is passed, use it. Else use targetUserId from store IF it differs from self?
        // Actually, logic is: if teamUser == 'global' -> no filter.
        // If teamUser has ID -> filter by that ID.
        // If undefined -> filter by self.

        // Legacy "selectedTeamUser" equivalent is "targetUserId" IF targetUserId != self? 
        // Or we should check the deprecated `localStorage` logic if needed?
        // Let's rely on the args first (legacy support) then Store.

        const effectiveTargetUser = teamUser; // If undefined, we check logic below:

        if (!isMom) {
            url += `&user_id=eq.${sess.user.id}`;
        } else {
            // Mother Logic
            if (effectiveTargetUser === 'global') {
                // No filter (Global)
            } else if (effectiveTargetUser) {
                url += `&user_id=eq.${effectiveTargetUser}`;
            } else {
                // Default to self if no target specified? Or global?
                // App.tsx legacy: `else url += '&user_id=eq.${sess.user.id}'`
                // But wait, if targetUserId IS SET in store, we should use it?
                // But this function is often called BEFORE store is fully set in the old way.
                // In the NEW way, we call it AFTER store config.
                // So we can assume `targetUserId` is correct?
                // However, KPI View is special, it might be independent.
                // Let's stick to the App.tsx logic for strict fidelity + Store Fallback.
                if (targetUserId && targetUserId !== sess.user.id) {
                    url += `&user_id=eq.${targetUserId}`;
                } else {
                    // If it's Mother and target is self, is it global? No, it's self.
                    // Unless "Global" is represented as targetUserId === self? No.
                    // Let's assume URL needs user_id unless explicit global.
                    url += `&user_id=eq.${sess.user.id}`;
                }
            }
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` },
                signal: AbortSignal.timeout(10000)
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const parsed = data.map(d => ({
                        ...d,
                        anio: Number(d.anio || 0),
                        facturacion_total: Number(d.facturacion_total || 0),
                        transacciones_cerradas: Number(d.transacciones_cerradas || 0),
                        transacciones_operaciones: Number(d.transacciones_operaciones || 0),
                        volumen_total: Number(d.volumen_total || 0),
                        ticket_promedio: Number(d.ticket_promedio || 0),
                        honorarios_reales: Number(d.honorarios_reales || 0),
                        total_pl: Number(d.total_pl || 0),
                        total_pb: Number(d.total_pb || 0),
                        total_captaciones: Number(d.total_captaciones || 0),
                        total_reuniones_verdes: Number(d.total_reuniones_verdes || 0),
                        total_gestion: Number(d.total_gestion || 0),
                        efectividad_cierre: Number(d.efectividad_cierre || 0),
                        efectividad_captacion: Number(d.efectividad_captacion || 0),
                        honorarios_promedio: Number(d.honorarios_promedio || 0),
                        productividad_actividad: Number(d.productividad_actividad || 0),
                        annual_billing: Number(d.annual_billing || 0),
                        monthly_need: Number(d.monthly_need || 0)
                    }));
                    setKpiData(parsed);
                    localStorage.setItem('kpi_data_cache', JSON.stringify(parsed));
                }
            }
        } catch (e) { console.error('Exception fetching KPIs:', e); }
    }
});
