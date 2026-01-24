import { StateCreator } from 'zustand';
import { supabase } from '../../services/supabaseClient';
import { FinancialGoals, BusinessState, DEFAULT_GOALS } from './types';
import { calculateWeeks } from '../../utils/dateUtils';

export interface ObjectivesSlice {
    goalsByYear: Record<number, FinancialGoals>;
    goalsHistory: any[];
    hasUnsavedGoals: boolean;
    loadingGoals: boolean;
    lastGoalsFetch: { userId: string, year: number, timestamp: number } | null;
    fetchFinancialGoals: (userId: string, year: number, force?: boolean) => Promise<void>;
    updateFinancialGoals: (updates: Partial<FinancialGoals>, year: number) => void;
    saveFinancialGoals: (userId: string, year: number) => Promise<void>;
    fetchGoalsHistory: (userId: string, year: number) => Promise<void>;
    getPlanAnalysis: (year: number | null, goals?: FinancialGoals) => any;
}

const fetchFinancialGoalsREST = async (userId: string, year: number) => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://whfoflccshoztjlesnhh.supabase.co';
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s fetch timeout

    try {
        // Fix for potential getSession hang
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth Timeout")), 3000));

        console.log("[objectivesSlice] [REST] Fetching session (with 3s timeout)...");
        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]) as any;
        const token = session?.access_token || SUPABASE_KEY;

        const query = `user_id=eq.${userId}&year=eq.${year}&order=created_at.desc&limit=1`;
        const url = `${SUPABASE_URL}/rest/v1/agent_objectives?${query}`;

        console.log("[objectivesSlice] [REST-OVERRIDE] Fetching directly...");
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${token}`
            },
            signal: controller.signal
        });

        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const list = await response.json();
        return list[0] || null;
    } catch (e) {
        clearTimeout(timeout);
        console.error("[objectivesSlice] [REST-OVERRIDE] Failed:", e);
        return null;
    }
};

const wrap = async (promise: any, name: string, timeoutMs: number = 10000) => {
    const startTime = Date.now();
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout fetching ${name}`)), timeoutMs)
    );
    try {
        console.log(`[objectivesSlice] wrap(${name}) - Racing...`);
        const result = await Promise.race([promise, timeout]) as any;
        const rowCount = result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0;
        console.log(`[objectivesSlice] Fetch ${name} SUCCESS in ${Date.now() - startTime}ms. Rows: ${rowCount}`);
        if (result.error) console.error(`[objectivesSlice] Fetch ${name} returned error:`, result.error);
        return result;
    } catch (err) {
        console.error(`[objectivesSlice] Fetch ${name} TIMEOUT/REJECTION after ${Date.now() - startTime}ms:`, err);
        return { data: null, error: err };
    }
};

const mapGoalsToDB = (goals: FinancialGoals, userId: string, year: number) => ({
    user_id: userId,
    year: year,
    annual_billing: goals.annualBilling,
    monthly_need: goals.monthlyNeed,
    average_ticket: goals.averageTicket,
    commission_split: goals.commissionSplit,
    commercial_weeks: goals.commercialWeeks,
    manual_ratio: goals.manualRatio,
    is_manual_ratio: goals.isManualRatio,
    is_manual_ticket: goals.isManualTicket,
    average_commission: goals.averageCommission,
    exchange_rate: goals.exchangeRate,
    captation_goal_qty: goals.captationGoalQty,
    captation_goal_period: goals.captationGoalPeriod,
    manual_captation_ratio: goals.manualCaptationRatio,
    is_manual_captation_ratio: goals.isManualCaptationRatio,
    captation_start_date: goals.captationStartDate,
    captation_end_date: goals.captationEndDate,
    created_at: new Date().toISOString()
});

const mapGoalsFromDB = (data: any): FinancialGoals => ({
    annualBilling: Number(data.annual_billing || DEFAULT_GOALS.annualBilling),
    monthlyNeed: Number(data.monthly_need || DEFAULT_GOALS.monthlyNeed),
    averageTicket: Number(data.average_ticket || DEFAULT_GOALS.averageTicket),
    commissionSplit: Number(data.commission_split || DEFAULT_GOALS.commissionSplit),
    commercialWeeks: Number(data.commercial_weeks || DEFAULT_GOALS.commercialWeeks),
    manualRatio: Number(data.manual_ratio || DEFAULT_GOALS.manualRatio),
    isManualRatio: data.is_manual_ratio === true,
    isManualTicket: data.is_manual_ticket === true,
    averageCommission: Number(data.average_commission || DEFAULT_GOALS.averageCommission),
    exchangeRate: Number(data.exchange_rate || DEFAULT_GOALS.exchangeRate),
    captationGoalQty: Number(data.captation_goal_qty || DEFAULT_GOALS.captationGoalQty),
    captationGoalPeriod: data.captation_goal_period || DEFAULT_GOALS.captationGoalPeriod,
    manualCaptationRatio: Number(data.manual_captation_ratio || DEFAULT_GOALS.manualCaptationRatio),
    isManualCaptationRatio: data.is_manual_captation_ratio === true,
    captationStartDate: data.captation_start_date || DEFAULT_GOALS.captationStartDate,
    captationEndDate: data.captation_end_date || DEFAULT_GOALS.captationEndDate,
});

// Internal Cache for Performance Optimization
let planCache = new Map<string, any>();


export const createObjectivesSlice: StateCreator<BusinessState, [], [], ObjectivesSlice> = (set, get) => ({
    goalsByYear: {},
    goalsHistory: [],
    hasUnsavedGoals: false,
    loadingGoals: false,
    lastGoalsFetch: null,

    fetchFinancialGoals: async (userId: string, year: number, force = false) => {
        if (!userId || get().loadingGoals) return;

        // Cache Guard: Don't refetch if loaded in the last 30s for the same user/year
        const last = get().lastGoalsFetch;
        const now = Date.now();
        if (!force && last && last.userId === userId && last.year === year && (now - last.timestamp < 30000)) {
            console.log(`[objectivesSlice] fetchFinancialGoals SKIP (Cache fresh)`);
            return;
        }

        set({ loadingGoals: true });
        console.log(`[objectivesSlice] fetchFinancialGoals START (UID: ${userId}, Year: ${year})`);

        try {
            // NUCLEAR OPTION: Try REST first since Client is hanging for the user
            console.log(`[objectivesSlice] NUCLEAR: Trying REST fetch first...`);
            const restData = await fetchFinancialGoalsREST(userId, year);

            if (restData) {
                console.log(`[objectivesSlice] NUCLEAR REST SUCCESS.`);
                set(state => ({
                    goalsByYear: {
                        ...state.goalsByYear,
                        [year]: mapGoalsFromDB(restData)
                    },
                    hasUnsavedGoals: false,
                    lastGoalsFetch: { userId, year, timestamp: Date.now() }
                }));
                return;
            }

            console.warn(`[objectivesSlice] REST failed. Falling back to Client fetch...`);
            const { data, error } = await wrap(supabase
                .from('agent_objectives')
                .select('*')
                .eq('user_id', userId)
                .eq('year', year)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(), 'agent_objectives', 5000);

            if (data) {
                set(state => ({
                    goalsByYear: {
                        ...state.goalsByYear,
                        [year]: mapGoalsFromDB(data)
                    },
                    hasUnsavedGoals: false,
                    lastGoalsFetch: { userId, year, timestamp: Date.now() }
                }));
            } else {
                console.warn(`[objectivesSlice] Both REST and Client failed. Using DEFAULTS for ${year}.`);
                set(state => ({
                    goalsByYear: {
                        ...state.goalsByYear,
                        [year]: DEFAULT_GOALS
                    },
                    hasUnsavedGoals: false,
                    lastGoalsFetch: { userId, year, timestamp: Date.now() }
                }));
            }
        } catch (error) {
            console.error('[objectivesSlice] CRITICAL Error in fetchFinancialGoals:', error);
            set(state => ({
                goalsByYear: {
                    ...state.goalsByYear,
                    [year]: DEFAULT_GOALS
                },
                hasUnsavedGoals: false
            }));
        } finally {
            console.log(`[objectivesSlice] fetchFinancialGoals FINISHED.`);
            set({ loadingGoals: false });
        }
    },

    updateFinancialGoals: (updates: Partial<FinancialGoals>, year: number) => {
        set(state => ({
            goalsByYear: {
                ...state.goalsByYear,
                [year]: {
                    ...(state.goalsByYear[year] || DEFAULT_GOALS),
                    ...updates
                }
            },
            hasUnsavedGoals: true
        }));
    },

    saveFinancialGoals: async (userId: string, year: number) => {
        const goals = get().goalsByYear[year] || DEFAULT_GOALS;
        try {
            const dbData = mapGoalsToDB(goals, userId, year);
            const { error } = await supabase
                .from('agent_objectives')
                .upsert(dbData, { onConflict: 'user_id,year' });

            if (error) throw error;
            set({ hasUnsavedGoals: false });
        } catch (error) {
            console.error('Error saving goals:', error);
            throw error;
        }
    },

    fetchGoalsHistory: async (userId: string, year: number) => {
        try {
            const { data, error } = await wrap(supabase
                .from('agent_objectives')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10), 'goals_history');

            if (error) throw error;
            set({ goalsHistory: data || [] });
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    },

    getPlanAnalysis: (selectedYear, passedGoals) => {
        const yearInt = selectedYear || new Date().getFullYear();
        const goals = passedGoals || get().goalsByYear[yearInt] || DEFAULT_GOALS;
        const activities = get().getUnifiedActivities();
        const { closings } = get();

        // Avoid JSON.stringify as key if goals is stable
        // Composite key: Year + Goals Reference (or fallback to stringify if it's transient)
        const yearKey = `${selectedYear || 'all'}`;

        // Enhanced Cache: Check per-entry stability
        // This prevents cache thrashing if multiple components request different years simultaneously
        const cachedEntry = planCache.get(yearKey);

        if (cachedEntry &&
            cachedEntry.inputs.activities === activities &&
            cachedEntry.inputs.closings === closings &&
            cachedEntry.inputs.goals === goals) {
            return cachedEntry.result;
        }

        const metrics = get().getMetricsByYear(selectedYear);
        const historicalMetrics = get().getMetricsByYear(null);

        const targetBilling = goals.annualBilling || 120000;
        const effectiveAverageTicket = goals.isManualTicket
            ? (goals.averageTicket || 100000)
            : (historicalMetrics.avgTicketUSD > 0 ? historicalMetrics.avgTicketUSD : (goals.averageTicket || 100000));

        const avgCommPct = goals.averageCommission || 3;
        const incomePerSide = effectiveAverageTicket * (avgCommPct / 100);
        const transactionsNeeded = incomePerSide > 0 ? (targetBilling / incomePerSide) : 0;
        const pocketFeesTarget = targetBilling * ((goals.commissionSplit || 50) / 100);

        const weeksOfData = metrics.weeksOfData;
        const isEffectivenessReliable = weeksOfData >= 16 && metrics.totalSides >= 5;

        const effectiveRatio = goals.isManualRatio
            ? (goals.manualRatio || 6)
            : (isEffectivenessReliable ? (metrics.ratioPLPB || 6) : 6);

        const theoreticalPLPBNeeded = transactionsNeeded * 6;
        const theoreticalCriticalNumber = (goals.commercialWeeks || 44) > 0 ? theoreticalPLPBNeeded / (goals.commercialWeeks || 44) : 0;

        const realPLPBNeeded = transactionsNeeded * effectiveRatio;
        const realCriticalNumber = (goals.commercialWeeks || 44) > 0 ? realPLPBNeeded / (goals.commercialWeeks || 44) : 0;
        const workLoadIncrease = realCriticalNumber - theoreticalCriticalNumber;
        const isPerformanceGood = effectiveRatio <= 6;

        const totalCaptations = metrics.totalCaptaciones;
        const isCaptationReliable = weeksOfData >= 16 && totalCaptations >= 5;

        // OPTIMIZED: Filter Activities by year using substring instead of full Date object if possible
        const targetYearStr = (selectedYear || new Date().getFullYear()).toString();
        let totalPreListings = 0;
        for (const a of activities) {
            if (!a.date || typeof a.date !== 'string') continue;
            if (a.date.substring(0, 4) === targetYearStr) {
                if (a.type === 'pre_listing') totalPreListings++;
            }
        }

        const realCaptationRatioValue = totalCaptations > 0 ? totalPreListings / totalCaptations : 2.5;

        const effectiveCaptationRatio = goals.isManualCaptationRatio
            ? (goals.manualCaptationRatio || 2.5)
            : (isCaptationReliable ? realCaptationRatioValue : 2.5);

        const captationWeeksDuration = calculateWeeks(goals.captationStartDate || '', goals.captationEndDate || '');
        const preListingsNeededForCaptation = (goals.captationGoalQty || 0) * effectiveCaptationRatio;
        const weeklyPreListingsNeededForCaptation = captationWeeksDuration > 0 ? preListingsNeededForCaptation / captationWeeksDuration : 0;
        const isCaptationGoalDesaligned = weeklyPreListingsNeededForCaptation > realCriticalNumber;
        const actualWeeklyAvg = (metrics.totalPLPB || 0) / (weeksOfData || 1);

        const result = {
            transactionsNeeded,
            realCriticalNumber,
            theoreticalCriticalNumber,
            isGoalSufficient: (targetBilling * ((goals.commissionSplit || 50) / 100)) >= ((goals.monthlyNeed || 0) * 12),
            isPerformanceGood,
            workLoadIncrease,
            actualWeeklyAvg,
            isCaptationGoalDesaligned,
            weeklyPreListingsNeededForCaptation,
            projectedNetIncome: metrics.totalIncomeUSD,
            annualLifestyleCost: (goals.monthlyNeed || 0) * 12,
            effectiveAverageTicket,
            effectiveRatio,
            isEffectivenessReliable,
            isCaptationReliable,
            effectiveCaptationRatio,
            weeksOfData,
            actualCaptations: totalCaptations,
            actualPreListings: totalPreListings,
            realCaptationRatio: realCaptationRatioValue,
            pocketFeesTarget
        };

        planCache.set(yearKey, { result, inputs: { activities, closings, goals } });
        return result;
    }
});
