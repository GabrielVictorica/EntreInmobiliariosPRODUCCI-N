import { ClosingRecord, ActivityRecord, Currency, ClientRecord, BuyerClientRecord, VisitRecord, PropertyRecord, BuyerSearchRecord, MarketingLog } from '../../types';
import { AuthSlice } from './createAuthSlice';

export interface FinancialGoals {
    annualBilling: number;
    monthlyNeed: number;
    averageTicket: number;
    commissionSplit: number;
    commercialWeeks: number;
    manualRatio: number;
    isManualRatio: boolean;
    isManualTicket: boolean;
    averageCommission: number;
    exchangeRate: number;
    captationGoalQty: number;
    captationGoalPeriod: 'month' | 'quarter';
    manualCaptationRatio: number;
    isManualCaptationRatio: boolean;
    captationStartDate: string;
    captationEndDate: string;
}

export const DEFAULT_GOALS: FinancialGoals = {
    annualBilling: 120000,
    monthlyNeed: 1500,
    averageTicket: 4000,
    commissionSplit: 45,
    commercialWeeks: 48,
    manualRatio: 6,
    isManualRatio: false,
    isManualTicket: false,
    averageCommission: 3,
    exchangeRate: 1100,
    captationGoalQty: 2,
    captationGoalPeriod: 'month',
    manualCaptationRatio: 2.5,
    isManualCaptationRatio: false,
    captationStartDate: new Date().toISOString().split('T')[0],
    captationEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
};

// Correct import path for navigation slice based on previous creation
import { NavigationSlice } from './navigationSlice';

export interface BusinessState extends AuthSlice, NavigationSlice {
    closings: ClosingRecord[];
    activities: ActivityRecord[];
    clients: ClientRecord[];
    buyers: BuyerClientRecord[];
    visits: VisitRecord[];
    properties: PropertyRecord[];
    searches: BuyerSearchRecord[];
    marketingLogs: MarketingLog[];
    exchangeRate: number;
    commissionSplit: number;
    isLoading: boolean;
    error: string | null;
    targetUserId: string | null;

    // Google Calendar State
    googleEvents: any[];
    isGoogleSynced: boolean;
    googleAccessToken: string | null;
    isCheckingGoogleSync: boolean;
    lastBusinessFetch: { userId: string, isGlobal: boolean, timestamp: number } | null;
    selectedYear: number;
    isHistoricalView: boolean;
    selectedTeamUser: string | null;
    isGlobalView: boolean;
    teamUsers: any[];

    // Infrastructure State
    isAuthChecking: boolean;
    isSystemInitializing: boolean;
    kpiData: any[];

    // Financial Goals State
    goalsByYear: Record<number, FinancialGoals>;
    goalsHistory: any[];
    hasUnsavedGoals: boolean;
    loadingGoals: boolean;
    lastGoalsFetch: { userId: string, year: number, timestamp: number } | null;

    // Actions
    setTargetUserId: (userId: string | null) => void;
    fetchBusinessData: (userId: string | null, isGlobal?: boolean, token?: string, force?: boolean) => Promise<void>;
    fetchFinancialGoals: (userId: string, year: number, force?: boolean) => Promise<void>;
    updateFinancialGoals: (updates: Partial<FinancialGoals>, year: number) => void;
    saveFinancialGoals: (userId: string, year: number) => Promise<void>;
    fetchGoalsHistory: (userId: string, year: number) => Promise<void>;
    setSelectedYear: (year: number) => void;
    setIsHistoricalView: (val: boolean) => void;
    setContextUser: (userId: string | null, isGlobal?: boolean) => Promise<void>;
    setTeamUsers: (users: any[]) => void;
    checkGoogleSyncStatus: (userId: string, userToken?: string) => Promise<void>;
    setGoogleAccessToken: (token: string | null) => void;
    syncGoogleCalendarEvents: (userId: string, accessToken: string, date?: Date, calendarId?: string) => Promise<void>;
    refreshGoogleToken: (userId?: string) => Promise<string | null>;
    updateGoogleEvent: (eventId: string, body: any, calendarId?: string) => Promise<void>;
    createGoogleEvent: (body: any, calendarId?: string, date?: Date) => Promise<void>;
    deleteGoogleEvent: (eventId: string, calendarId?: string) => Promise<void>;
    upsertGoogleEventToCache: (event: any) => void;
    clearGoogleCache: () => void;

    // Infrastructure Actions
    setIsAuthChecking: (val: boolean) => void;
    setIsSystemInitializing: (val: boolean) => void;
    setKpiData: (data: any[]) => void;

    // Closings CRUD
    addClosing: (closing: Partial<ClosingRecord>) => Promise<ClosingRecord | null>;
    updateClosing: (id: string, updates: Partial<ClosingRecord>) => Promise<void>;
    deleteClosing: (id: string) => Promise<void>;

    // Activities CRUD
    addActivity: (activity: ActivityRecord) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;

    // Clients (Sellers) CRUD
    addClient: (client: ClientRecord) => Promise<ClientRecord | null>;
    updateClient: (id: string, updates: Partial<ClientRecord>) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;

    // Buyers CRUD
    addBuyer: (buyer: BuyerClientRecord) => Promise<BuyerClientRecord | null>;
    updateBuyer: (id: string, updates: Partial<BuyerClientRecord>) => Promise<void>;
    deleteBuyer: (id: string) => Promise<void>;

    // Properties CRUD
    addProperty: (property: PropertyRecord) => Promise<PropertyRecord | null>;
    updateProperty: (id: string, updates: Partial<PropertyRecord>) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;

    // Visits CRUD
    addVisit: (visit: VisitRecord) => Promise<VisitRecord | null>;
    updateVisit: (id: string, updates: Partial<VisitRecord>) => Promise<void>;
    deleteVisit: (id: string) => Promise<void>;

    // Searches CRUD
    addSearch: (search: BuyerSearchRecord) => Promise<BuyerSearchRecord | null>;
    updateSearch: (id: string, updates: Partial<BuyerSearchRecord>) => Promise<void>;
    deleteSearch: (id: string) => Promise<void>;

    // Marketing Logs CRUD
    addMarketingLog: (log: MarketingLog) => Promise<void>;

    // Settings
    updateSettings: (exchangeRate: number, commissionSplit: number) => void;

    // Analyzers
    getMetricsByYear: (year: number | null) => {
        totalBillingUSD: number;
        totalIncomeUSD: number;
        totalSides: number;
        totalPLPB: number;
        totalCaptaciones: number;
        avgTicketUSD: number;
        ratioPLPB: number;
        effectiveness: number;
        avgHonorariumUSD: number;
        productivityUSD: number;
        activePropertiesCount: number;
        filteredClosings: ClosingRecord[];
        isDataReliable: boolean;
        weeksOfData: number;
        totalGCIUSD: number;
    };
    normalizeToUSD: (amount: number, currency: Currency) => number;
    getUnifiedActivities: () => ActivityRecord[];
    getPerformanceMetrics: () => {
        greenMeetingsWeekly: number;
        weeklyPLDone: number;
        weeklyPBDone: number;
        totalWeeklyTraction: number;
        totalSidesYear: number;
    };
    getPlanAnalysis: (year: number | null, goals?: FinancialGoals) => {
        transactionsNeeded: number;
        realCriticalNumber: number;
        theoreticalCriticalNumber: number;
        isGoalSufficient: boolean;
        isPerformanceGood: boolean;
        workLoadIncrease: number;
        actualWeeklyAvg: number;
        isCaptationGoalDesaligned: boolean;
        weeklyPreListingsNeededForCaptation: number;
        projectedNetIncome: number;
        annualLifestyleCost: number;
        effectiveAverageTicket: number;
        effectiveRatio: number;
        isEffectivenessReliable: boolean;
        isCaptationReliable: boolean;
        effectiveCaptationRatio: number;
        weeksOfData: number;
        actualCaptations: number;
        actualPreListings: number;
        realCaptationRatio: number;
        pocketFeesTarget: number;
    };
    getPipelineValue: () => number;
    getHomeDisplayMetrics: (year: number) => any;
    fetchKPIs: (session?: any, isMother?: boolean, teamUser?: string | null) => Promise<void>;
    initializeGoogleSync: (session: any) => Promise<void>;
    persistGoogleConnection: (session: any) => Promise<void>;
}
