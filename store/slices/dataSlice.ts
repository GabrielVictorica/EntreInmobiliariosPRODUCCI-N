import { StateCreator } from 'zustand';
import { supabase } from '../../services/supabaseClient';
import { BusinessState } from './types';
import { ClosingRecord, ActivityRecord, ClientRecord, BuyerClientRecord, VisitRecord, PropertyRecord, BuyerSearchRecord, MarketingLog, Currency } from '../../types';

export interface DataSlice {
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
    lastBusinessFetch: { userId: string, isGlobal: boolean, timestamp: number } | null;
    isAuthChecking: boolean;
    isSystemInitializing: boolean;
    kpiData: any[];

    setTargetUserId: (userId: string | null) => void;
    setIsAuthChecking: (val: boolean) => void;
    setIsSystemInitializing: (val: boolean) => void;
    setKpiData: (data: any[]) => void;

    fetchBusinessData: (userId: string | null, isGlobal?: boolean, token?: string, force?: boolean) => Promise<void>;
    addClosing: (closing: Partial<ClosingRecord>) => Promise<ClosingRecord | null>;
    updateClosing: (id: string, updates: Partial<ClosingRecord>) => Promise<void>;
    deleteClosing: (id: string) => Promise<void>;
    addActivity: (activity: ActivityRecord) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;
    addClient: (client: ClientRecord) => Promise<ClientRecord | null>;
    updateClient: (id: string, updates: Partial<ClientRecord>) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    addBuyer: (buyer: BuyerClientRecord) => Promise<BuyerClientRecord | null>;
    updateBuyer: (id: string, updates: Partial<BuyerClientRecord>) => Promise<void>;
    deleteBuyer: (id: string) => Promise<void>;
    addProperty: (property: PropertyRecord) => Promise<PropertyRecord | null>;
    updateProperty: (id: string, updates: Partial<PropertyRecord>) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;
    addVisit: (visit: VisitRecord) => Promise<VisitRecord | null>;
    updateVisit: (id: string, updates: Partial<VisitRecord>) => Promise<void>;
    deleteVisit: (id: string) => Promise<void>;
    addSearch: (search: BuyerSearchRecord) => Promise<BuyerSearchRecord | null>;
    updateSearch: (id: string, updates: Partial<BuyerSearchRecord>) => Promise<void>;
    deleteSearch: (id: string) => Promise<void>;
    addMarketingLog: (log: MarketingLog) => Promise<void>;
    updateSettings: (exchangeRate: number, commissionSplit: number) => void;
    normalizeToUSD: (amount: number, currency: Currency) => number;
}

// Helper: normalize to USD
const normalizeToUSD = (amount: number, currency: Currency, exchangeRate: number) => {
    return currency === 'ARS' ? amount / exchangeRate : amount;
};

export const createDataSlice: StateCreator<BusinessState, [], [], DataSlice> = (set, get) => ({
    closings: [],
    activities: [],
    clients: [],
    buyers: [],
    visits: [],
    properties: [],
    searches: [],
    marketingLogs: [],
    exchangeRate: 1100,
    commissionSplit: 50,
    isLoading: false,
    error: null,
    targetUserId: null,
    isAuthChecking: true,
    isSystemInitializing: true,
    kpiData: [],
    lastBusinessFetch: null,
    selectedYear: new Date().getFullYear(),
    isHistoricalView: false,
    selectedTeamUser: null,
    isGlobalView: false,
    teamUsers: [],

    setTargetUserId: (userId: string | null) => set({ targetUserId: userId }),
    setKpiData: (data: any[]) => set({ kpiData: data }),
    setSelectedYear: (year: number) => {
        const { targetUserId, fetchFinancialGoals, selectedYear } = get();
        if (year === selectedYear) return;
        set({ selectedYear: year });
        if (targetUserId) {
            fetchFinancialGoals(targetUserId, year).catch(e => console.error("[dataSlice] setSelectedYear fetch error:", e));
        }
    },
    setIsHistoricalView: (val: boolean) => set({ isHistoricalView: val }),

    setTeamUsers: (users: any[]) => set({ teamUsers: users }),

    setContextUser: async (userId: string | null, isGlobal = false) => {
        const { authSession, authRole, fetchBusinessData, fetchFinancialGoals, fetchKPIs, selectedYear } = get();
        if (!authSession?.user) return;

        // Determine effective target
        const finalUid = userId || authSession.user.id;
        const finalIsGlobal = isGlobal;

        console.log(`[dataSlice] setContextUser: ${finalUid} (Global: ${finalIsGlobal})`);

        // Persist to localStorage for session continuity
        if (authRole === 'mother') {
            localStorage.setItem('selectedTeamUser', isGlobal ? 'global' : finalUid);
        }

        // Atomic update of context state
        set({
            targetUserId: finalUid,
            selectedTeamUser: finalUid,
            isGlobalView: finalIsGlobal
        });

        // Trigger Data Refetch Sequence
        // Note: fetchBusinessData and fetchFinancialGoals already check their own internal cache/guard logic
        await Promise.all([
            fetchBusinessData(finalUid, finalIsGlobal, authSession.access_token),
            fetchFinancialGoals(finalUid, selectedYear),
            fetchKPIs(authSession, authRole === 'mother', isGlobal ? 'global' : finalUid)
        ]);
    },

    fetchBusinessData: async (userId, isGlobal = false, token, force = false) => {
        if (!userId) return;

        // Optimized Cache: Prevent redundant fetches but allow switching Global/Individual
        const last = get().lastBusinessFetch;
        const now = Date.now();
        if (!force && last && last.userId === userId && last.isGlobal === isGlobal && (now - last.timestamp < 10000)) {
            console.log(`[dataSlice] fetchBusinessData SKIP (Cache fresh)`);
            return;
        }

        console.log(`[dataSlice] fetchBusinessData START. UID: ${userId}, Global: ${isGlobal}, Force: ${force}`);
        set({ isLoading: true, error: null });

        try {
            const wrap = async (promise: any, name: string, timeoutMs: number = 45000) => {
                const startTime = Date.now();
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout fetching ${name}`)), timeoutMs)
                );
                try {
                    console.log(`[dataSlice] wrap(${name}) - Racing...`);
                    const result = await Promise.race([promise, timeout]) as any;
                    const rowCount = result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0;
                    console.log(`[dataSlice] Fetch ${name} SUCCESS in ${Date.now() - startTime}ms. Rows: ${rowCount}`);
                    if (result.error) console.error(`[dataSlice] Fetch ${name} returned error:`, result.error);
                    return result;
                } catch (err) {
                    console.error(`[dataSlice] Fetch ${name} TIMEOUT/REJECTION after ${Date.now() - startTime}ms:`, err);
                    return { data: null, error: err };
                }
            };

            const buildQuery = (table: string) => {
                let q = supabase.from(table).select('*');
                if (!isGlobal) {
                    q = q.eq('user_id', userId);
                }
                return q;
            };

            const results = await Promise.all([
                wrap(buildQuery('closing_logs'), 'closings'),
                wrap(buildQuery('activities'), 'activities'),
                wrap(buildQuery('seller_clients'), 'clients'),
                wrap(buildQuery('buyer_clients'), 'buyers'),
                wrap(buildQuery('visits'), 'visits'),
                wrap(buildQuery('properties'), 'properties'),
                wrap(buildQuery('buyer_searches'), 'searches'),
                wrap(buildQuery('property_marketing_logs'), 'marketing_logs')
            ]);

            const [
                closingsRes,
                activitiesRes,
                clientsRes,
                buyersRes,
                visitsRes,
                propertiesRes,
                searchesRes,
                marketingLogsRes
            ] = results;

            // --- DEEP DEBUG LOGGING FOR CIERRES ---
            console.log(">>> [DEBUG] CLOSINGS RAW RESPONSE:", {
                success: !closingsRes.error,
                count: closingsRes.data?.length,
                firstRow: closingsRes.data?.[0],
                error: closingsRes.error
            });

            if (closingsRes.data && closingsRes.data.length > 0) {
                console.log(">>> [DEBUG] Sample Date:", closingsRes.data[0].date, "Type:", typeof closingsRes.data[0].date);
            }
            // --------------------------------------

            // Check for critical failures (ANTI-POISONING)
            const convertErrorToString = (e: any): string => {
                if (typeof e === 'string') return e;
                if (e?.message) return e.message;
                return JSON.stringify(e);
            };

            const failures = results.filter(r => r.error);
            if (failures.length > 0) {
                console.error("[dataSlice] COMPLETE DATA LOAD FAILED. Errors found:", failures.length);
                const errorMsg = `Error cargando datos: ${failures.map(f => convertErrorToString(f.error)).join(', ')}`;
                set({ error: errorMsg, isLoading: false }); // Do NOT update timestamp

                // Still load what we got, but don't cache it as "success"
            }

            console.log("[dataSlice] FETCH RESULTS:", {
                closings: (closingsRes.data as any[])?.length || 0,
                activities: (activitiesRes.data as any[])?.length || 0,
                properties: (propertiesRes.data as any[])?.length || 0,
                clients: (clientsRes.data as any[])?.length || 0
            });
            const { data: settingsRes } = await wrap(supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(), 'settings');

            const settingsData = settingsRes;

            console.log(`[dataSlice] Data loaded: ${closingsRes.data?.length || 0} closings`);

            // Only update cache timestamp if NO failures occurred
            const shouldUpdateCache = failures.length === 0;

            set({
                closings: (closingsRes.data || []).map((c: any) => ({
                    id: c.id,
                    userId: c.user_id,
                    propertyId: c.property_id,
                    manualProperty: c.manual_property,
                    buyerClientId: c.buyer_client_id,
                    manualBuyer: c.manual_buyer,
                    date: typeof c.date === 'string' ? c.date : '',
                    agentName: c.agent_name,
                    salePrice: Number(c.sale_price || 0),
                    currency: c.currency as any,
                    commissionPercent: Number(c.commission_percent || 0),
                    sides: (c.sides || 1) as 1 | 2,
                    isShared: c.is_shared === true,
                    totalBilling: Number(c.total_billing || 0),
                    agentHonorarium: Number(c.agent_honorarium || 0),
                    createdAt: c.created_at,
                    operationType: c.operation_type || 'venta',
                    subSplitPercent: Number(c.sub_split_percent || 50),
                    exchangeRateSnapshot: Number(c.exchange_rate_snapshot || 1000),
                    referralSidesApplied: c.referral_sides_applied
                })),
                activities: (activitiesRes.data || []).map((a: any) => ({
                    id: a.id,
                    userId: a.user_id,
                    date: typeof a.date === 'string' ? a.date : '',
                    type: a.type as any,
                    contactId: a.contact_id,
                    contactName: a.contact_name,
                    time: a.time,
                    notes: a.notes,
                    referenceId: a.reference_id,
                    systemGenerated: a.system_generated === true,
                    createdAt: a.created_at
                })),
                clients: (clientsRes.data || []).map((c: any) => ({
                    id: c.id,
                    userId: c.user_id,
                    profileType: c.profile_type,
                    owners: c.owners || [],
                    contact: c.contact || {},
                    notes: c.notes,
                    tags: c.tags || [],
                    createdAt: c.created_at
                })),
                buyers: (buyersRes.data || []).map((b: any) => ({
                    id: b.id,
                    userId: b.user_id,
                    name: b.name,
                    dni: b.dni,
                    phone: b.phone,
                    email: b.email,
                    address: b.address,
                    type: b.type,
                    notes: b.notes,
                    createdAt: b.created_at
                })),
                visits: (visitsRes.data || []).map((v: any) => ({
                    id: v.id,
                    userId: v.user_id,
                    propertyId: v.property_id,
                    buyerClientId: v.buyer_client_id,
                    agentName: v.agent_name,
                    source: v.source,
                    date: typeof v.date === 'string' ? v.date : '',
                    time: v.time,
                    duration: v.duration,
                    meetingPoint: v.meeting_point,
                    securityCheck: v.security_check,
                    manualPropertyAddress: v.manual_property_address,
                    comments: v.comments,
                    status: v.status,
                    signedConfirmation: v.signed_confirmation,
                    feedback: v.feedback,
                    nextSteps: v.next_steps,
                    createdAt: v.created_at
                })),
                properties: (propertiesRes.data || []).map((p: any) => ({
                    id: p.id,
                    userId: p.user_id,
                    clientId: p.client_id,
                    customId: p.custom_id,
                    status: p.status,
                    type: p.type,
                    address: p.address || {},
                    price: Number(p.price || 0),
                    currency: p.currency,
                    creditEligible: p.credit_eligible,
                    surface: p.surface || {},
                    features: p.features || {},
                    amenities: p.amenities || [],
                    hvac: p.hvac,
                    legal: p.legal || {},
                    expenses: p.expenses || {},
                    logistics: p.logistics || {},
                    files: p.files || { photos: [], documents: [], debts: [] },
                    createdAt: p.created_at
                })),
                searches: (searchesRes.data || []).map((s: any) => ({
                    id: s.id,
                    userId: s.user_id,
                    buyerClientId: s.buyer_client_id,
                    agentName: s.agent_name,
                    status: s.status,
                    searchProfile: s.search_profile || {},
                    createdAt: s.created_at
                })),
                marketingLogs: (marketingLogsRes.data || []).map((l: any) => ({
                    id: l.id,
                    propertyId: l.property_id,
                    date: typeof l.date === 'string' ? l.date : '',
                    period: l.period,
                    marketplace: l.marketplace || { publications: 0, impressions: 0, clicks: 0, inquiries: 0 },
                    social: l.social || { publications: 0, impressions: 0, clicks: 0, inquiries: 0 },
                    ads: l.ads || { publications: 0, impressions: 0, clicks: 0, inquiries: 0 },
                })),
                exchangeRate: settingsData?.exchange_rate || 1100,
                commissionSplit: settingsData?.commission_split || 50,
                lastBusinessFetch: shouldUpdateCache ? { userId, isGlobal, timestamp: now } : get().lastBusinessFetch, // Keep old cache if failed
                isLoading: false
            });
        } catch (err: any) {
            console.error('Core fetch error:', err);
            set({ error: err.message });
            set({
                isLoading: false,
                lastBusinessFetch: { userId: userId, isGlobal: isGlobal, timestamp: Date.now() }
            });
        }
    },

    addClosing: async (c) => {
        const { targetUserId } = get();
        if (!targetUserId) return null;
        try {
            const dbObj = {
                user_id: targetUserId,
                property_id: c.propertyId,
                buyer_client_id: c.buyerClientId,
                date: c.date,
                sale_price: c.salePrice,
                currency: c.currency,
                commission_percent: c.commissionPercent,
                sides: c.sides,
                operation_type: c.operationType,
                sub_split_percent: c.subSplitPercent,
                exchange_rate_snapshot: c.exchangeRateSnapshot,
                referral_sides_applied: c.referralSidesApplied,
                agent_name: c.agentName || 'Agente',
                is_shared: c.isShared || false,
                total_billing: c.totalBilling || 0,
                agent_honorarium: c.agentHonorarium || 0
            };
            const { data, error } = await supabase.from('closing_logs').insert(dbObj).select().single();
            if (error) throw error;
            const newClosing: ClosingRecord = {
                id: data.id,
                userId: data.user_id,
                propertyId: data.property_id,
                manualProperty: data.manual_property,
                buyerClientId: data.buyer_client_id,
                manualBuyer: data.manual_buyer,
                date: data.date,
                agentName: data.agent_name,
                salePrice: data.sale_price,
                currency: data.currency,
                commissionPercent: data.commission_percent,
                sides: data.sides,
                isShared: data.is_shared,
                totalBilling: data.total_billing,
                agentHonorarium: data.agent_honorarium,
                createdAt: data.created_at,
                operationType: data.operation_type,
                subSplitPercent: data.sub_split_percent,
                exchangeRateSnapshot: data.exchange_rate_snapshot,
                referralSidesApplied: data.referral_sides_applied
            };
            set(state => ({ closings: [...state.closings, newClosing] }));
            return newClosing;
        } catch (err) {
            console.error('Error adding closing:', err);
            return null;
        }
    },

    updateClosing: async (id, updates) => {
        try {
            const dbObj: any = {};
            if (updates.salePrice !== undefined) dbObj.sale_price = updates.salePrice;
            if (updates.currency !== undefined) dbObj.currency = updates.currency;
            if (updates.commissionPercent !== undefined) dbObj.commission_percent = updates.commissionPercent;
            if (updates.sides !== undefined) dbObj.sides = updates.sides;
            if (updates.date !== undefined) dbObj.date = updates.date;
            if (updates.operationType !== undefined) dbObj.operation_type = updates.operationType;
            if (updates.subSplitPercent !== undefined) dbObj.sub_split_percent = updates.subSplitPercent;
            if (updates.exchangeRateSnapshot !== undefined) dbObj.exchange_rate_snapshot = updates.exchangeRateSnapshot;
            if (updates.referralSidesApplied !== undefined) dbObj.referral_sides_applied = updates.referralSidesApplied;
            if (updates.isShared !== undefined) dbObj.is_shared = updates.isShared;
            if (updates.totalBilling !== undefined) dbObj.total_billing = updates.totalBilling;
            if (updates.agentHonorarium !== undefined) dbObj.agent_honorarium = updates.agentHonorarium;

            const { error } = await supabase.from('closing_logs').update(dbObj).eq('id', id);
            if (error) throw error;
            set(state => ({
                closings: state.closings.map(c => c.id === id ? { ...c, ...updates } as ClosingRecord : c)
            }));
        } catch (err) {
            console.error('Error updating closing:', err);
        }
    },

    deleteClosing: async (id) => {
        try {
            const { error } = await supabase.from('closing_logs').delete().eq('id', id);
            if (error) throw error;
            set(state => ({ closings: state.closings.filter(c => c.id !== id) }));
        } catch (err) {
            console.error('Error deleting closing:', err);
        }
    },

    addActivity: async (a) => {
        const { targetUserId } = get();
        if (!targetUserId) return;
        try {
            const { error } = await supabase.from('activities').insert({
                user_id: targetUserId,
                date: a.date,
                type: a.type,
                contact_id: a.contactId,
                contact_name: a.contactName,
                notes: a.notes,
                time: a.time,
                reference_id: a.referenceId,
                system_generated: a.systemGenerated
            });
            if (error) throw error;
            set(state => ({ activities: [...state.activities, a] }));
        } catch (err) {
            console.error('Error adding activity:', err);
        }
    },

    deleteActivity: async (id) => {
        try {
            const { error } = await supabase.from('activities').delete().eq('id', id);
            if (error) throw error;
            set(state => ({ activities: state.activities.filter(a => a.id !== id) }));
        } catch (err) {
            console.error('Error deleting activity:', err);
        }
    },

    addClient: async (c) => {
        const { targetUserId } = get();
        if (!targetUserId) return null;
        try {
            const { data, error } = await supabase.from('seller_clients').insert({
                user_id: targetUserId,
                owners: c.owners,
                profile_type: c.profileType,
                contact: c.contact,
                notes: c.notes,
                tags: c.tags
            }).select().single();
            if (error) throw error;
            const newClient = { ...c, id: data.id, createdAt: data.created_at };
            set(state => ({ clients: [...state.clients, newClient] }));
            return newClient;
        } catch (err) {
            console.error('Error adding client:', err);
            return null;
        }
    },

    updateClient: async (id, updates) => {
        try {
            const dbObj: any = {};
            if (updates.owners !== undefined) dbObj.owners = updates.owners;
            if (updates.profileType !== undefined) dbObj.profile_type = updates.profileType;
            if (updates.contact !== undefined) dbObj.contact = updates.contact;
            if (updates.notes !== undefined) dbObj.notes = updates.notes;
            if (updates.tags !== undefined) dbObj.tags = updates.tags;

            const { error } = await supabase.from('seller_clients').update(dbObj).eq('id', id);
            if (error) throw error;
            set(state => ({
                clients: state.clients.map(c => c.id === id ? { ...c, ...updates } : c)
            }));
        } catch (err) {
            console.error('Error updating client:', err);
        }
    },

    deleteClient: async (id) => {
        try {
            const { error } = await supabase.from('seller_clients').delete().eq('id', id);
            if (error) throw error;
            set(state => ({ clients: state.clients.filter(c => c.id !== id) }));
        } catch (err) {
            console.error('Error deleting client:', err);
        }
    },

    addBuyer: async (b) => {
        const { targetUserId } = get();
        if (!targetUserId) return null;
        try {
            const { data, error } = await supabase.from('buyer_clients').insert({
                user_id: targetUserId,
                name: b.name,
                dni: b.dni,
                phone: b.phone,
                email: b.email,
                address: b.address,
                type: b.type,
                notes: b.notes
            }).select().single();
            if (error) throw error;
            const newBuyer = { ...b, id: data.id, createdAt: data.created_at };
            set(state => ({ buyers: [...state.buyers, newBuyer] }));
            return newBuyer;
        } catch (err) {
            console.error('Error adding buyer:', err);
            return null;
        }
    },

    updateBuyer: async (id, updates) => {
        try {
            const dbObj: any = {};
            if (updates.name !== undefined) dbObj.name = updates.name;
            if (updates.dni !== undefined) dbObj.dni = updates.dni;
            if (updates.phone !== undefined) dbObj.phone = updates.phone;
            if (updates.email !== undefined) dbObj.email = updates.email;
            if (updates.address !== undefined) dbObj.address = updates.address;
            if (updates.type !== undefined) dbObj.type = updates.type;
            if (updates.notes !== undefined) dbObj.notes = updates.notes;

            const { error } = await supabase.from('buyer_clients').update(dbObj).eq('id', id);
            if (error) throw error;
            set(state => ({
                buyers: state.buyers.map(b => b.id === id ? { ...b, ...updates } : b)
            }));
        } catch (err) {
            console.error('Error updating buyer:', err);
        }
    },

    deleteBuyer: async (id) => {
        try {
            const { error } = await supabase.from('buyer_clients').delete().eq('id', id);
            if (error) throw error;
            set(state => ({ buyers: state.buyers.filter(b => b.id !== id) }));
        } catch (err) {
            console.error('Error deleting buyer:', err);
        }
    },

    addProperty: async (p) => {
        const { targetUserId } = get();
        if (!targetUserId) return null;
        try {
            const { data, error } = await supabase.from('properties').insert({
                user_id: targetUserId,
                seller_id: p.clientId,
                custom_id: p.customId,
                address: p.address,
                price: p.price,
                currency: p.currency,
                property_type: p.type,
                status: p.status,
                features: p.features,
                surface: p.surface,
                amenities: p.amenities,
                hvac: p.hvac,
                legal: p.legal,
                expenses: p.expenses,
                logistics: p.logistics,
                files: p.files,
                credit_eligible: p.creditEligible
            }).select().single();
            if (error) throw error;
            const newProp = { ...p, id: data.id, createdAt: data.created_at };
            set(state => ({ properties: [...state.properties, newProp] }));
            return newProp;
        } catch (err) {
            console.error('Error adding property:', err);
            return null;
        }
    },

    updateProperty: async (id, updates) => {
        try {
            const dbObj: any = {};
            if (updates.price !== undefined) dbObj.price = updates.price;
            if (updates.currency !== undefined) dbObj.currency = updates.currency;
            if (updates.status !== undefined) dbObj.status = updates.status;
            if (updates.features !== undefined) dbObj.features = updates.features;
            if (updates.address !== undefined) dbObj.address = updates.address;
            if (updates.surface !== undefined) dbObj.surface = updates.surface;
            if (updates.amenities !== undefined) dbObj.amenities = updates.amenities;
            if (updates.hvac !== undefined) dbObj.hvac = updates.hvac;
            if (updates.legal !== undefined) dbObj.legal = updates.legal;
            if (updates.expenses !== undefined) dbObj.expenses = updates.expenses;
            if (updates.logistics !== undefined) dbObj.logistics = updates.logistics;
            if (updates.files !== undefined) dbObj.files = updates.files;
            if (updates.creditEligible !== undefined) dbObj.credit_eligible = updates.creditEligible;

            const { error } = await supabase.from('properties').update(dbObj).eq('id', id);
            if (error) throw error;
            set(state => ({
                properties: state.properties.map(p => p.id === id ? { ...p, ...updates } : p)
            }));
        } catch (err) {
            console.error('Error updating property:', err);
        }
    },

    deleteProperty: async (id) => {
        try {
            const { error } = await supabase.from('properties').delete().eq('id', id);
            if (error) throw error;
            set(state => ({ properties: state.properties.filter(p => p.id !== id) }));
        } catch (err) {
            console.error('Error deleting property:', err);
        }
    },

    addVisit: async (v) => {
        const { targetUserId } = get();
        if (!targetUserId) return null;
        try {
            const { data, error } = await supabase.from('visits').insert({
                user_id: targetUserId,
                property_id: v.propertyId,
                buyer_client_id: v.buyerClientId,
                agent_name: v.agentName,
                date: v.date,
                time: v.time,
                duration: v.duration,
                meeting_point: v.meetingPoint,
                security_check: v.securityCheck,
                manual_property_address: v.manualPropertyAddress,
                comments: v.comments,
                status: v.status,
                signed_confirmation: v.signedConfirmation,
                signed_confirmation_file: v.signedConfirmationFile,
                feedback: v.feedback,
                next_steps: v.nextSteps,
                source: v.source
            }).select().single();
            if (error) throw error;
            const newVisit = { ...v, id: data.id, createdAt: data.created_at };
            set(state => ({ visits: [...state.visits, newVisit] }));
            return newVisit;
        } catch (err) {
            console.error('Error adding visit:', err);
            return null;
        }
    },

    updateVisit: async (id, updates) => {
        try {
            const dbObj: any = {};
            if (updates.status !== undefined) dbObj.status = updates.status;
            if (updates.feedback !== undefined) dbObj.feedback = updates.feedback;
            if (updates.nextSteps !== undefined) dbObj.next_steps = updates.nextSteps;
            if (updates.date !== undefined) dbObj.date = updates.date;
            if (updates.time !== undefined) dbObj.time = updates.time;
            if (updates.duration !== undefined) dbObj.duration = updates.duration;
            if (updates.meetingPoint !== undefined) dbObj.meeting_point = updates.meetingPoint;
            if (updates.comments !== undefined) dbObj.comments = updates.comments;

            const { error } = await supabase.from('visits').update(dbObj).eq('id', id);
            if (error) throw error;
            set(state => ({
                visits: state.visits.map(v => v.id === id ? { ...v, ...updates } : v)
            }));
        } catch (err) {
            console.error('Error updating visit:', err);
        }
    },

    deleteVisit: async (id) => {
        try {
            const { error } = await supabase.from('visits').delete().eq('id', id);
            if (error) throw error;
            set(state => ({ visits: state.visits.filter(v => v.id !== id) }));
        } catch (err) {
            console.error('Error deleting visit:', err);
        }
    },

    addSearch: async (s) => {
        const { targetUserId } = get();
        if (!targetUserId) return null;
        try {
            const { data, error } = await supabase.from('buyer_searches').insert({
                user_id: targetUserId,
                buyer_id: s.buyerClientId,
                agent_name: s.agentName,
                status: s.status,
                search_profile: s.searchProfile
            }).select().single();
            if (error) throw error;
            const newSearch = { ...s, id: data.id, createdAt: data.created_at };
            set(state => ({ searches: [...state.searches, newSearch] }));
            return newSearch;
        } catch (err) {
            console.error('Error adding search:', err);
            return null;
        }
    },

    updateSearch: async (id, updates) => {
        try {
            const dbObj: any = {};
            if (updates.status !== undefined) dbObj.status = updates.status;
            if (updates.searchProfile !== undefined) dbObj.search_profile = updates.searchProfile;

            const { error } = await supabase.from('buyer_searches').update(dbObj).eq('id', id);
            if (error) throw error;
            set(state => ({
                searches: state.searches.map(s => s.id === id ? { ...s, ...updates } : s)
            }));
        } catch (err) {
            console.error('Error updating search:', err);
        }
    },

    deleteSearch: async (id) => {
        try {
            const { error } = await supabase.from('buyer_searches').delete().eq('id', id);
            if (error) throw error;
            set(state => ({ searches: state.searches.filter(s => s.id !== id) }));
        } catch (err) {
            console.error('Error deleting search:', err);
        }
    },

    addMarketingLog: async (log) => {
        const { targetUserId } = get();
        if (!targetUserId) return;
        try {
            const { error } = await supabase.from('property_marketing_logs').insert({
                user_id: targetUserId,
                property_id: log.propertyId,
                date: log.date,
                marketplace: log.marketplace,
                social: log.social,
                ads: log.ads,
                period_type: log.period
            });
            if (error) throw error;
            set(state => ({ marketingLogs: [...state.marketingLogs, log] }));
        } catch (err) {
            console.error('Error adding marketing log:', err);
        }
    },

    updateSettings: (exchangeRate, commissionSplit) => set({ exchangeRate, commissionSplit }),

    setIsAuthChecking: (val) => set({ isAuthChecking: val }),
    setIsSystemInitializing: (val) => set({ isSystemInitializing: val }),


    normalizeToUSD: (amount, currency) => {
        const rate = get().exchangeRate || 1000;
        return currency === 'ARS' ? amount / rate : amount;
    }
});
