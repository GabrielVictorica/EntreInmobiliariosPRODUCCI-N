
import React, { useState, useMemo, useEffect, useCallback } from 'react';

// ... (imports)

// ...

// ... (imports)

// Auth
import Login from './components/auth/Login';

// Home
import DashboardHome from './components/home/DashboardHome';

// Sellers Module
import ClientForm from './components/sellers/SellerForm';
import SellersDashboard from './components/sellers/SellersDashboard';
import PropertyForm from './components/sellers/PropertyForm';
import PropertyDashboard from './components/sellers/PropertyDashboard';
import MarketingModal from './components/sellers/MarketingModal';

// Buyers Module
import BuyerClientForm from './components/buyers/BuyerClientForm';
import BuyerClientDashboard from './components/buyers/BuyerClientDashboard';
import BuyerSearchForm from './components/buyers/BuyerSearchForm';
import BuyerSearchDashboard from './components/buyers/BuyerSearchDashboard';
import VisitForm from './components/buyers/VisitForm';
import VisitDashboard from './components/buyers/VisitDashboard';

// Tracking Module
import MetricsWrapper from './components/tracking/MetricsWrapper';
import ObjectivesDashboard from './components/tracking/ObjectivesDashboard';
import WeeklyDashboard from './components/tracking/WeeklyDashboard';
import ClosingsDashboard from './components/tracking/ClosingsDashboard';
import CalendarDashboard from './components/tracking/CalendarDashboard';

import { supabase } from './services/supabaseClient';
import { seedDatabase } from './services/seedData';
import { ClientRecord, PropertyRecord, BuyerClientRecord, BuyerSearchRecord, VisitRecord, MarketingLog, ActivityRecord, ClosingRecord } from './types';
import {
  Users,
  HelpCircle,
  Search,
  Bell,
  Building2,
  LogOut,
  Wallet,
  UserCheck,
  Calendar,
  Loader2,
  Database,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Target,
  Flag,
  Save, // Added Save Icon
  LayoutDashboard,
  PieChart,
  CalendarDays,
  DollarSign,
  ShieldCheck
} from 'lucide-react';

// --- DATA MAPPING HELPERS (Frontend <-> DB) ---

const mapSellerFromDB = (db: any): ClientRecord => ({
  id: db.id,
  userId: db.user_id,
  createdByEmail: db.created_by_email,
  profileType: db.profile_type || 'particular',
  owners: db.owners || [],
  contact: {
    email: db.contact?.email || '',
    phone: db.contact?.phone || '',
    altPhone: db.contact?.altPhone || '',
    address: db.contact?.address || '',
    city: db.contact?.city || '',
    preferredContact: db.contact?.preferredContact || 'whatsapp'
  },
  notes: db.notes,
  tags: db.tags || [],
  createdAt: db.created_at,
  aiProfileSummary: db.ai_profile_summary
});

const mapSellerToDB = (client: ClientRecord, activeUserId: string) => ({
  id: client.id,
  user_id: client.userId || activeUserId, // Use existing owner or current user if new
  created_by_email: client.createdByEmail,
  profile_type: client.profileType,
  owners: client.owners,
  contact: client.contact,
  notes: client.notes,
  tags: client.tags || [],
  ai_profile_summary: client.aiProfileSummary,
  created_at: client.createdAt
});

const mapPropertyFromDB = (db: any): PropertyRecord => ({
  id: db.id,
  userId: db.user_id,
  createdByEmail: db.created_by_email,
  clientId: db.client_id,
  customId: db.custom_id || 'SIN-ID',
  status: db.status || 'suspendida',
  type: db.type || 'departamento',
  price: db.price || 0,
  currency: db.currency || 'USD',
  creditEligible: db.credit_eligible || false,
  address: {
    street: db.address?.street || '',
    number: db.address?.number || '',
    floor: db.address?.floor || '',
    unit: db.address?.unit || '',
    neighborhood: db.address?.neighborhood || '',
    nomenclatura: db.address?.nomenclatura || '',
    zoning: db.address?.zoning || { code: '', fot: '', fos: '', tps: '', maxHeight: '' }
  },
  surface: {
    covered: db.surface?.covered || 0,
    semiCovered: db.surface?.semiCovered || 0,
    uncovered: db.surface?.uncovered || 0,
    total: db.surface?.total || 0,
    lotFront: db.surface?.lotFront || 0,
    lotDepth: db.surface?.lotDepth || 0
  },
  features: {
    layout: db.features?.layout || { kitchen: 'separada', living: 'separado' },
    rooms: db.features?.rooms || 0,
    bedrooms: db.features?.bedrooms || 0,
    bathrooms: db.features?.bathrooms || 0,
    toilettes: db.features?.toilettes || 0,
    age: db.features?.age || 0,
    condition: db.features?.condition || 'bueno',
    orientation: db.features?.orientation || 'norte',
    disposition: db.features?.disposition || 'frente',
    parking: db.features?.parking || 'none',
    parkingType: db.features?.parkingType || 'espacio'
  },
  amenities: db.amenities || [],
  hvac: db.hvac || 'gas',
  legal: {
    deedStatus: db.legal?.deedStatus || 'escritura',
    plans: db.legal?.plans || 'aprobados',
    rules: db.legal?.rules || { professionalUse: false, petsAllowed: true }
  },
  expenses: {
    ordinary: db.expenses?.ordinary || 0,
    extraordinary: db.expenses?.extraordinary || 0,
    extraordinaryEndDate: db.expenses?.extraordinaryEndDate || '',
    taxesStatus: db.expenses?.taxesStatus || 'al_dia',
    services: db.expenses?.services || []
  },
  logistics: {
    occupation: db.logistics?.occupation || 'habitada',
    contractExpiration: db.logistics?.contractExpiration || '',
    keysLocation: db.logistics?.keysLocation || 'dueño',
    signage: db.logistics?.signage || false
  },
  files: db.files || { photos: [], documents: [], debts: [] },
  aiAnalysis: db.ai_analysis,
  createdAt: db.created_at || new Date().toISOString()
});

const mapPropertyToDB = (p: PropertyRecord, activeUserId: string) => ({
  id: p.id,
  user_id: p.userId || activeUserId,
  created_by_email: p.createdByEmail,
  client_id: p.clientId,
  custom_id: p.customId,
  status: p.status,
  type: p.type,
  price: p.price,
  currency: p.currency,
  credit_eligible: p.creditEligible,
  address: p.address,
  surface: p.surface,
  features: p.features,
  amenities: p.amenities,
  hvac: p.hvac,
  legal: p.legal,
  expenses: p.expenses,
  logistics: p.logistics,
  files: p.files,
  ai_analysis: p.aiAnalysis,
  created_at: p.createdAt
});

const mapBuyerFromDB = (db: any): BuyerClientRecord => ({
  id: db.id,
  userId: db.user_id,
  createdByEmail: db.created_by_email,
  name: db.name,
  dni: db.dni,
  phone: db.phone,
  email: db.email,
  address: db.address,
  type: db.type,
  notes: db.notes,
  createdAt: db.created_at
});

const mapBuyerToDB = (b: BuyerClientRecord, activeUserId: string) => ({
  id: b.id,
  user_id: b.userId || activeUserId,
  created_by_email: b.createdByEmail,
  name: b.name,
  dni: b.dni,
  phone: b.phone,
  email: b.email,
  address: b.address,
  type: b.type,
  notes: b.notes,
  created_at: b.createdAt
});

const mapSearchFromDB = (db: any): BuyerSearchRecord => ({
  id: db.id,
  userId: db.user_id,
  buyerClientId: db.buyer_client_id,
  agentName: db.agent_name || 'Agente',
  status: db.status || 'activo',
  searchProfile: {
    propertyTypes: db.search_profile?.propertyTypes || [],
    zones: db.search_profile?.zones || [],
    minRequirements: {
      bedrooms: db.search_profile?.minRequirements?.bedrooms || 0,
      bathrooms: db.search_profile?.minRequirements?.bathrooms || 0,
      totalSurface: db.search_profile?.minRequirements?.totalSurface || 0,
    },
    exclusions: {
      mustHaveGarage: db.search_profile?.exclusions?.mustHaveGarage || false,
      mustHaveOutdoor: db.search_profile?.exclusions?.mustHaveOutdoor || false,
      mortgageRequired: db.search_profile?.exclusions?.mortgageRequired || false,
      acceptsOffPlan: db.search_profile?.exclusions?.acceptsOffPlan || false,
    },
    timeline: db.search_profile?.timeline || 'sin_apuro',
    trigger: db.search_profile?.trigger || 'otro',
    availability: db.search_profile?.availability || '',
    budget: {
      max: db.search_profile?.budget?.max || 0,
      currency: db.search_profile?.budget?.currency || 'USD'
    },
    paymentMethod: db.search_profile?.paymentMethod || 'contado',
    salesCondition: {
      needsToSell: db.search_profile?.salesCondition?.needsToSell || false,
      isPropertyCaptured: db.search_profile?.salesCondition?.isPropertyCaptured || false,
      linkedPropertyId: db.search_profile?.salesCondition?.linkedPropertyId,
    },
    acceptsSwap: db.search_profile?.acceptsSwap || false,
    decisionMakers: db.search_profile?.decisionMakers || '',
    nurcNotes: {
      n: db.search_profile?.nurcNotes?.n || '',
      u: db.search_profile?.nurcNotes?.u || '',
      r: db.search_profile?.nurcNotes?.r || '',
      c: db.search_profile?.nurcNotes?.c || '',
      updates: db.search_profile?.nurcNotes?.updates || ''
    }
  },
  createdAt: db.created_at || new Date().toISOString()
});

const mapSearchToDB = (s: BuyerSearchRecord, activeUserId: string) => ({
  id: s.id,
  user_id: s.userId || activeUserId,
  buyer_client_id: s.buyerClientId,
  agent_name: s.agentName,
  status: s.status,
  search_profile: s.searchProfile,
  created_at: s.createdAt
});

const mapVisitFromDB = (db: any): VisitRecord => ({
  id: db.id,
  userId: db.user_id,
  propertyId: db.property_id,
  buyerClientId: db.buyer_client_id,
  agentName: db.agent_name || 'Agente',
  source: db.source || 'otro',
  date: db.date || new Date().toISOString().split('T')[0],
  time: db.time || '10:00',
  duration: db.duration || '30',
  meetingPoint: db.meeting_point || 'propiedad',
  securityCheck: db.security_check || false,
  status: db.status || 'pendiente',
  signedConfirmation: db.signed_confirmation || false,
  signedConfirmationFile: db.signed_confirmation_file,
  feedback: db.feedback || undefined, // Feedback is optional
  nextSteps: db.next_steps || undefined,
  createdAt: db.created_at || new Date().toISOString()
});

const mapVisitToDB = (v: VisitRecord, activeUserId: string) => ({
  id: v.id,
  user_id: v.userId || activeUserId,
  property_id: v.propertyId,
  buyer_client_id: v.buyerClientId,
  agent_name: v.agentName,
  source: v.source,
  date: v.date,
  time: v.time,
  duration: v.duration,
  meeting_point: v.meetingPoint,
  security_check: v.securityCheck,
  status: v.status,
  signed_confirmation: v.signedConfirmation,
  signed_confirmation_file: v.signedConfirmationFile,
  feedback: v.feedback,
  next_steps: v.nextSteps,
  created_at: v.createdAt
});

const mapMarketingFromDB = (db: any): MarketingLog => ({
  id: db.id,
  propertyId: db.property_id,
  date: db.date || new Date().toISOString(),
  period: db.period_type || '14_days',
  marketplace: db.marketplace || { publications: 0, impressions: 0, clicks: 0, inquiries: 0 },
  social: db.social || { publications: 0, impressions: 0, clicks: 0, inquiries: 0 },
  ads: db.ads || { publications: 0, impressions: 0, clicks: 0, inquiries: 0 },
});

const mapMarketingToDB = (m: MarketingLog, activeUserId: string) => ({
  id: m.id,
  user_id: activeUserId, // Marketing logs often don't switch owners, but simplistic
  property_id: m.propertyId,
  date: m.date,
  period_type: m.period,
  marketplace: m.marketplace,
  social: m.social,
  ads: m.ads
});

// Helper for Activities
const mapActivityFromDB = (db: any): ActivityRecord => {
  if (!db || typeof db !== 'object') {
    console.error('Invalid activity record from DB:', db);
    return {
      id: `error-${Math.random()}`,
      userId: '',
      date: new Date().toISOString(),
      type: 'act_verde', // Default safe type
      contactId: '',
      contactName: 'Error Loading Activity',
      notes: 'Record was null or invalid',
      createdAt: new Date().toISOString()
    } as ActivityRecord;
  }
  return {
    id: db.id,
    userId: db.user_id,
    date: db.date,
    type: db.type,
    contactId: db.contact_id,
    contactName: db.contact_name,
    notes: db.notes,
    referenceId: db.reference_id,
    systemGenerated: db.system_generated,
    createdAt: db.created_at
  };
};

const mapActivityToDB = (a: ActivityRecord, activeUserId: string) => ({
  id: a.id,
  user_id: a.userId || activeUserId,
  date: a.date,
  type: a.type,
  contact_id: a.contactId,
  contact_name: a.contactName,
  notes: a.notes,
  reference_id: a.referenceId,
  system_generated: a.systemGenerated,
  created_at: a.createdAt
});


const mapClosingFromDB = (db: any): ClosingRecord => ({
  id: db.id,
  propertyId: db.property_id,
  manualProperty: db.manual_property,
  buyerClientId: db.buyer_client_id,
  manualBuyer: db.manual_buyer,
  date: db.date,
  agentName: db.agent_name,
  salePrice: db.sale_price,
  currency: db.currency,
  commissionPercent: db.commission_percent,
  sides: db.sides,
  isShared: db.is_shared,
  totalBilling: db.total_billing,
  agentHonorarium: db.agent_honorarium,
  createdAt: db.created_at,
  operationType: db.operation_type || 'venta',
  subSplitPercent: db.sub_split_percent || 100,
  exchangeRateSnapshot: db.exchange_rate_snapshot,
  referralSidesApplied: db.referral_sides_applied || db.sides
});

const mapClosingToDB = (c: ClosingRecord, activeUserId: string) => ({
  id: c.id,
  property_id: c.propertyId,
  manual_property: c.manualProperty,
  buyer_client_id: c.buyerClientId,
  manual_buyer: c.manualBuyer,
  date: c.date,
  agent_name: c.agentName,
  sale_price: c.salePrice,
  currency: c.currency,
  commission_percent: c.commissionPercent,
  sides: c.sides,
  is_shared: c.isShared,
  total_billing: c.totalBilling,
  agent_honorarium: c.agentHonorarium,
  created_at: c.createdAt,
  operation_type: c.operationType,
  sub_split_percent: c.subSplitPercent,
  exchange_rate_snapshot: c.exchangeRateSnapshot,
  referral_sides_applied: c.referralSidesApplied || c.sides
});


export default function App() {
  // Session State
  const [session, setSession] = useState<any>(null);

  // Navigation State
  const [view, setView] = useState<'home' | 'dashboard' | 'form' | 'properties-list' | 'property-form' | 'buyer-clients-list' | 'buyer-client-form' | 'buyer-searches-list' | 'buyer-search-form' | 'visits-list' | 'visit-form' | 'my-week' | 'objectives' | 'closings' | 'calendar' | 'metrics-home' | 'metrics-control'>('home');
  const [viewParams, setViewParams] = useState<any>(null);

  // Navigation Group State (Collapsible)
  const [expandedGroup, setExpandedGroup] = useState<'metrics' | 'sellers' | 'buyers' | 'trakeo' | 'system' | null>(null);

  // --- NAVIGATION HELPER (Prevents Flickering) ---
  const navigateTo = (newView: typeof view, params?: any) => {
    setView(newView);
    if (params) setViewParams(params);
    else setViewParams(null); // Clear params if not provided

    // Synchronous Update for Expanded Group
    if (['dashboard', 'form', 'properties-list', 'property-form'].includes(newView)) {
      setExpandedGroup('sellers');
    } else if (['buyer-clients-list', 'buyer-client-form', 'buyer-searches-list', 'buyer-search-form', 'visits-list', 'visit-form'].includes(newView)) {
      setExpandedGroup('buyers');
    } else if (['my-week', 'objectives', 'closings'].includes(newView)) {
      setExpandedGroup('trakeo');
    } else if (['home', 'metrics-home', 'metrics-control'].includes(newView)) {
      setExpandedGroup('metrics');
    } else {
      setExpandedGroup(null);
    }
  };

  // Data State
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [buyerClients, setBuyerClients] = useState<BuyerClientRecord[]>([]);
  const [buyerSearches, setBuyerSearches] = useState<BuyerSearchRecord[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [marketingLogs, setMarketingLogs] = useState<MarketingLog[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]); // Tracking Activities
  const [closingLogs, setClosingLogs] = useState<ClosingRecord[]>([]); // NEW: Closings

  const [loading, setLoading] = useState(true);

  // Edit & Selection State
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | null>(null);

  const [editingBuyerClientId, setEditingBuyerClientId] = useState<string | null>(null);
  const [editingSearchId, setEditingSearchId] = useState<string | null>(null);
  const [preSelectedBuyerClientId, setPreSelectedBuyerClientId] = useState<string | null>(null);

  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);

  // Marketing Modal State
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [marketingPropertyId, setMarketingPropertyId] = useState<string | null>(null);



  const [searchQuery, setSearchQuery] = useState('');

  // --- RBAC STATE ---
  const [isMother, setIsMother] = useState(false);
  const [teamUsers, setTeamUsers] = useState<any[]>([]); // List of child users
  const [selectedTeamUser, setSelectedTeamUser] = useState<string | null>(null);

  // --- Financial Goals State (Shared between Objectives & Control) ---
  const [financialGoals, setFinancialGoals] = useState({
    annualBilling: 120000,
    monthlyNeed: 1500,
    averageTicket: 4000,
    commissionSplit: 45,
    commercialWeeks: 48,
    manualRatio: 6,
    isManualRatio: false,
    isManualTicket: false,
    exchangeRate: 1100, // Default ARS/USD
    // Captation Defaults
    captationGoalQty: 2,
    captationGoalPeriod: 'month',
    manualCaptationRatio: 2.5,
    isManualCaptationRatio: false
  });

  const handleUpdateFinancialGoals = useCallback((newGoals: Partial<typeof financialGoals>) => {
    setFinancialGoals(prev => {
      const updated = { ...prev, ...newGoals };

      // Save to Supabase (Fire and Forget)
      if (session?.user?.id) {
        supabase.from('user_settings').upsert({
          user_id: session.user.id,
          annual_billing: updated.annualBilling,
          monthly_need: updated.monthlyNeed,
          average_ticket: updated.averageTicket,
          commission_split: updated.commissionSplit,
          commercial_weeks: updated.commercialWeeks,
          manual_ratio: updated.manualRatio,
          is_manual_ratio: updated.isManualRatio,
          is_manual_ticket: updated.isManualTicket,
          exchange_rate: updated.exchangeRate,
          updated_at: new Date()
        }).then(({ error }) => {
          if (error) console.error("Error saving goals (fire and forget):", error);
        });
      }
      return updated;
    });
  }, [session]);

  const handleSaveFinancialGoals = useCallback(async (goalsToSave: typeof financialGoals) => {
    if (!session?.user?.id) return;

    try {
      // Save entire object to 'goals' JSONB column for flexibility
      const { error } = await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        goals: goalsToSave,
        updated_at: new Date()
      });

      if (error) {
        console.error("Error saving financial goals:", error);
        alert("Error al guardar la planificación: " + error.message);
      } else {
        alert("¡Planificación guardada correctamente!");
      }
    } catch (e) {
      console.error("Unexpected error saving financial goals:", e);
      alert("Ocurrió un error inesperado al guardar la planificación.");
    }
  }, [session]);

  // --- Auth & Session Management ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadAllData();
        // Load Financial Goals
        supabase.from('user_settings').select('goals').eq('user_id', session.user.id).single()
          .then(({ data, error }) => {
            if (data && data.goals) {
              setFinancialGoals(prev => ({ ...prev, ...data.goals }));
            }
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadAllData();
        // Load Financial Goals on Auth Change
        supabase.from('user_settings').select('goals').eq('user_id', session.user.id).single()
          .then(({ data, error }) => {
            if (data && data.goals) {
              setFinancialGoals(prev => ({ ...prev, ...data.goals }));
            }
          });
      } else {
        setClients([]);
        setProperties([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      checkUserRole(session.user.id);
      // Load All Data will be triggered by [session] dependency in the other effect
    }
  }, [session]);

  const checkUserRole = async (userId: string) => {
    try {
      // Check if Mother
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const isMom = roleData?.role === 'mother';
      setIsMother(isMom);

      if (isMom) {
        // Fetch all potential agents (users)
        // Since we don't have a public users table, we rely on user_roles or a new 'profiles' table if it existed.
        // For now, let's just query user_roles to get IDs and emails.
        const { data: team } = await supabase.from('user_roles').select('*');
        if (team) setTeamUsers(team);
      } else {
        setIsMother(false);
        setTeamUsers([]);
      }
    } catch (e) {
      console.error('Error checking role:', e);
    }
  };

  const isMasterUser = session?.user?.email === 'gabriel.v.g06@gmail.com';



  // --- TRAKING METRICS ---

  // 1. Current Billing (Annual Reset)
  const currentTotalBilling = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const rate = financialGoals.exchangeRate || 1000;

    return closingLogs
      .filter(c => new Date(c.date).getFullYear() === currentYear)
      .reduce((acc, curr) => {
        // Quick Normalization for Goal Calculation using MANUAL RATE
        const amount = curr.currency === 'ARS' ? curr.totalBilling / rate : curr.totalBilling;
        return acc + amount;
      }, 0);
  }, [closingLogs, financialGoals.exchangeRate]);

  // Calculate Total Sides for Transactions Metric
  const currentTotalSides = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return closingLogs
      .filter(c => new Date(c.date).getFullYear() === currentYear)
      .reduce((acc, curr) => acc + (curr.sides || 0), 0);
  }, [closingLogs]);

  // 2. Current Year Activities (Annual Reset for Goals)
  const currentTotalPLPB = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return activities.filter(a => {
      const date = new Date(a.date);
      return (a.type === 'pre_listing' || a.type === 'pre_buying') && date.getFullYear() === currentYear;
    }).length;
  }, [activities]);

  // 3. Historical Ratio (All Time Data - Stability)
  const historicalRatio = useMemo(() => {
    if (closingLogs.length === 0) return 0;

    const allTimePLPB = activities.filter(a => a.type === 'pre_listing' || a.type === 'pre_buying').length;
    const allTimeClosings = closingLogs.length;

    return allTimeClosings > 0 ? allTimePLPB / allTimeClosings : 0;
  }, [activities, closingLogs]);

  // 4. Pipeline Value ("Latent Revenue" - Lag Solution)
  const pipelineValue = useMemo(() => {
    const rate = financialGoals.exchangeRate || 1000;

    // Logic:
    // A) Active Properties Volume (Available/Reserved) * 3% comm * 30% Probability
    const activeInventoryValue = properties
      .filter(p => p.status === 'disponible' || p.status === 'reservada')
      .reduce((acc, p) => acc + (p.price * (p.currency === 'USD' ? 1 : (1 / rate))), 0);

    const projectedInventoryRevenue = activeInventoryValue * 0.03 * 0.30;

    // B) Active Buyers Budget (Active Search) * 3% comm * 20% Probability
    const activeBuyersValue = buyerSearches
      .filter(s => s.status === 'activo')
      .reduce((acc, s) => acc + s.searchProfile.budget.max, 0);

    const projectedBuyerRevenue = activeBuyersValue * 0.03 * 0.20;

    return projectedInventoryRevenue + projectedBuyerRevenue;
  }, [properties, buyerSearches]);


  // --- Initial Data Load ---
  const hasLoadedOnce = React.useRef(false);
  const loadAllData = async () => {
    if (!session?.user) return;

    // Only show full screen loader on the very first load
    if (!hasLoadedOnce.current) setLoading(true);

    try {
      const [c, p, bc, bs, v, m, act, settings, closings] = await Promise.all([
        supabase.from('seller_clients').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('buyer_clients').select('*'),
        supabase.from('buyer_searches').select('*'),
        supabase.from('visits').select('*'),
        supabase.from('property_marketing_logs').select('*').order('date', { ascending: false }),
        supabase.from('activities').select('*'),
        supabase.from('user_settings').select('*').eq('user_id', session.user.id).single(),
        supabase.from('closing_logs').select('*')
      ]);

      if (settings.data) {
        setFinancialGoals(prev => ({
          ...prev,
          annualBilling: settings.data.annual_billing ?? prev.annualBilling,
          monthlyNeed: settings.data.monthly_need ?? prev.monthlyNeed,
          averageTicket: settings.data.average_ticket ?? prev.averageTicket,
          commissionSplit: settings.data.commission_split ?? prev.commissionSplit,
          commercialWeeks: settings.data.commercial_weeks ?? prev.commercialWeeks,
          manualRatio: settings.data.manual_ratio ?? prev.manualRatio,
          isManualRatio: settings.data.is_manual_ratio ?? prev.isManualRatio,
          isManualTicket: settings.data.is_manual_ticket ?? prev.isManualTicket,
          exchangeRate: settings.data.exchange_rate ?? 1000
        }));
      }

      if (c.data) {
        const mapped = c.data.filter(x => !!x).map(mapSellerFromDB);
        setClients(isMother && selectedTeamUser ? mapped.filter(x => x.userId === selectedTeamUser) : mapped);
      }
      if (p.data) {
        const mapped = p.data.filter(x => !!x).map(mapPropertyFromDB);
        setProperties(isMother && selectedTeamUser ? mapped.filter(x => x.userId === selectedTeamUser) : mapped);
      }
      if (bc.data) {
        const mapped = bc.data.filter(x => !!x).map(mapBuyerFromDB);
        setBuyerClients(isMother && selectedTeamUser ? mapped.filter(x => x.userId === selectedTeamUser) : mapped);
      }
      if (bs.data) {
        const mapped = bs.data.filter(x => !!x).map(mapSearchFromDB);
        setBuyerSearches(isMother && selectedTeamUser ? mapped.filter(x => x.userId === selectedTeamUser) : mapped);
      }
      if (v.data) {
        const mapped = v.data.filter(x => !!x).map(mapVisitFromDB);
        setVisits(isMother && selectedTeamUser ? mapped.filter(x => x.userId === selectedTeamUser) : mapped);
      }
      if (m.data) {
        const mapped = m.data.filter(x => !!x).map(mapMarketingFromDB);
        setMarketingLogs(mapped);
      }
      if (act.data) {
        const mapped = act.data.filter(x => !!x).map(mapActivityFromDB);
        setActivities(isMother && selectedTeamUser ? mapped.filter(x => x.userId === selectedTeamUser) : mapped);
      }
      if (closings.data) {
        const mapped = closings.data.filter(x => !!x).map(mapClosingFromDB);
        setClosingLogs(mapped);
      }

    } catch (error: any) {
      console.error("Error loading data from Supabase:", error);
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  };

  // Initial data load - only depends on session
  useEffect(() => {
    if (session) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Re-filter data when team user or mother status changes (NO loading indicator)
  useEffect(() => {
    // This effect only handles re-filtering, not re-fetching
    // The data is already in memory from the initial load
    if (!session) return;

    // Trigger a re-load to apply filters, but don't show loading screen
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMother, selectedTeamUser]);

  // --- Handle Logout ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setClients([]);
    setProperties([]);
    // Clear all state...
  };

  // --- Handle Seed Data ---
  const handleLoadSeedData = async () => {
    if (confirm("¿Estás seguro de que quieres cargar datos de prueba?")) {
      setLoading(true);
      try {
        const result = await seedDatabase(supabase);
        if (result === true) {
          await loadAllData();
          // MOCK SEED for Closings (simulated locally for now)
          setClosingLogs([{
            id: 'seed-close-1',
            propertyId: 'seed-prop-1',
            date: '2024-03-20',
            agentName: 'Yo',
            salePrice: 270000,
            currency: 'USD',
            commissionPercent: 3,
            sides: 1,
            isShared: false,
            totalBilling: 8100,
            agentHonorarium: 3645,
            createdAt: new Date().toISOString()
          }]);
          alert("¡Datos de prueba cargados correctamente!");
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
  };

  // --- Handlers (Sellers) ---
  const handleSaveClient = async (record: ClientRecord) => {
    if (!session?.user) return;

    // Ensure agent ownership details
    const newRecord = {
      ...record,
      createdByEmail: record.createdByEmail || session.user.email
    };

    if (editingClientId) {
      setClients(prev => prev.map(c => c.id === newRecord.id ? newRecord : c));
    } else {
      setClients([newRecord, ...clients]);
    }
    setEditingClientId(null);
    setEditingClientId(null);
    navigateTo('dashboard');
    try { await supabase.from('seller_clients').upsert(mapSellerToDB(newRecord, session.user.id)); } catch (err) { console.error(err); }
  };

  const handleEditClient = (clientId: string) => { setEditingClientId(clientId); navigateTo('form'); };
  const handleAssignProperty = (clientId: string) => { setPreSelectedClientId(clientId); setEditingPropertyId(null); navigateTo('property-form'); };

  const handleSaveProperty = async (record: PropertyRecord) => {
    if (!session?.user) return;

    const newRecord = {
      ...record,
      createdByEmail: record.createdByEmail || session.user.email
    };

    if (editingPropertyId) setProperties(prev => prev.map(p => p.id === newRecord.id ? newRecord : p));
    else setProperties([newRecord, ...properties]);
    navigateTo('properties-list');
    setEditingPropertyId(null);
    setPreSelectedClientId(null);
    try { await supabase.from('properties').upsert(mapPropertyToDB(newRecord, session.user.id)); } catch (err) { console.error(err); }
  };

  const handleEditProperty = (id: string) => { setEditingPropertyId(id); navigateTo('property-form'); };
  const handleNewProperty = () => { setEditingPropertyId(null); setPreSelectedClientId(null); navigateTo('property-form'); }

  // --- Handlers (Marketing) ---
  const handleOpenMarketing = (propertyId: string) => { setMarketingPropertyId(propertyId); setMarketingModalOpen(true); };
  const handleSaveMarketing = async (log: MarketingLog) => {
    if (!session?.user) return;
    setMarketingLogs(prev => [log, ...prev]);
    setMarketingModalOpen(false);
    try { await supabase.from('property_marketing_logs').upsert(mapMarketingToDB(log, session.user.id)); } catch (err) { console.error(err); }
  };

  // --- Handlers (Buyers) ---
  const handleSaveBuyerClient = async (record: BuyerClientRecord) => {
    if (!session?.user) return;

    const newRecord = {
      ...record,
      createdByEmail: record.createdByEmail || session.user.email
    };

    if (editingBuyerClientId) setBuyerClients(prev => prev.map(c => c.id === newRecord.id ? newRecord : c));
    else setBuyerClients([newRecord, ...buyerClients]);
    setEditingBuyerClientId(null);
    navigateTo('buyer-clients-list');
    try { await supabase.from('buyer_clients').upsert(mapBuyerToDB(newRecord, session.user.id)); } catch (e) { }
  };
  const handleEditBuyerClient = (id: string) => { setEditingBuyerClientId(id); navigateTo('buyer-client-form'); };
  const handleCreateSearch = (buyerClientId: string) => { setPreSelectedBuyerClientId(buyerClientId); setEditingSearchId(null); navigateTo('buyer-search-form'); };

  const handleSaveSearch = async (record: BuyerSearchRecord) => {
    if (!session?.user) return;
    if (editingSearchId) setBuyerSearches(prev => prev.map(s => s.id === record.id ? record : s));
    else setBuyerSearches([record, ...buyerSearches]);
    setEditingSearchId(null);
    setPreSelectedBuyerClientId(null);
    navigateTo('buyer-searches-list');
    try { await supabase.from('buyer_searches').upsert(mapSearchToDB(record, session.user.id)); } catch (e) { }
  };
  const handleEditSearch = (id: string) => { setEditingSearchId(id); navigateTo('buyer-search-form'); };
  const handleNewSearch = () => { setEditingSearchId(null); setPreSelectedBuyerClientId(null); navigateTo('buyer-search-form'); };

  // --- Handlers (Visits) ---
  const handleSaveVisit = async (record: VisitRecord) => {
    if (!session?.user) return;
    if (editingVisitId) setVisits(prev => prev.map(v => v.id === record.id ? record : v));
    else setVisits([record, ...visits]);
    setEditingVisitId(null);
    navigateTo('visits-list');
    try { await supabase.from('visits').upsert(mapVisitToDB(record, session.user.id)); } catch (err) { console.error(err); }
  };
  const handleEditVisit = (id: string) => { setEditingVisitId(id); navigateTo('visit-form'); };
  const handleNewVisit = () => { setEditingVisitId(null); navigateTo('visit-form'); };

  // --- Handlers (Activities - My Week) ---
  const handleSaveActivity = async (act: ActivityRecord) => {
    if (!session?.user) return;
    setActivities(prev => [...prev, act]);
    try { await supabase.from('activities').upsert(mapActivityToDB(act, session.user.id)); } catch (e) { console.error(e); }
  };

  const handleDeleteActivity = async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    try { await supabase.from('activities').delete().eq('id', id); } catch (e) { console.error(e); }
  };

  // --- Handlers (Closings) ---
  const handleSaveClosing = async (closing: ClosingRecord) => {
    if (!session?.user) return;

    // Check if this is an update or new insert
    // Ideally we check if ID is not 'CL-...' and exists in our list.
    // Simplifying: If ID starts with CL-, it's new (unless we are persisting CL- IDs which is bad practice but we handle it).
    // Actually, `closing` passed here already has the ID from the form.
    // If it's an EDIT, the form passed the EXISTING ID.
    // If it's NEW, the form passed `CL-${Date.now()}`.

    const isNew = closing.id.toString().startsWith('CL-');

    // Optimistic Update
    if (isNew) {
      setClosingLogs(prev => [closing, ...prev]);
    } else {
      setClosingLogs(prev => prev.map(c => c.id === closing.id ? closing : c));
    }

    // Save to DB
    try {
      // Exclude the temporary ID "CL-..." so Supabase generates a valid UUID for NEW records
      const { id, ...closingData } = closing;
      const dbPayload = mapClosingToDB(closing, session.user.id);

      if (isNew) {
        // INSERT
        // Remove temp ID
        if (typeof dbPayload.id === 'string' && dbPayload.id.startsWith('CL-')) {
          delete (dbPayload as any).id;
        }
        const { data, error } = await supabase.from('closing_logs').insert(dbPayload).select().single();
        // Update local state with real ID if successful
        if (data) {
          const realRecord = mapClosingFromDB(data);
          setClosingLogs(prev => prev.map(c => c.id === closing.id ? realRecord : c));
        }
      } else {
        // UPDATE
        await supabase.from('closing_logs').update(dbPayload).eq('id', id);
      }

    } catch (err) {
      console.error("Error saving closing:", err);
      // Ideally revert optimistic update here on error
    }

    // Auto-create Activity 'cierre' (Only for NEW records to avoid duplication?)
    // Or should we update the activity too? For now, let's only create on NEW.
    if (isNew) {
      const propDesc = closing.manualProperty || (closing.propertyId ? properties.find(p => p.id === closing.propertyId)?.address.street : 'Propiedad');

      // Determine contact name
      let contactName = closing.manualBuyer || 'Comprador Externo';
      if (closing.buyerClientId) {
        const buyer = buyerClients.find(b => b.id === closing.buyerClientId);
        if (buyer) contactName = buyer.name;
      }

      const act: ActivityRecord = {
        id: `act-close-${Date.now()}`,
        date: closing.date,
        type: 'cierre',
        contactName: contactName,
        contactId: closing.buyerClientId,
        notes: `Cierre registrado: ${propDesc}. Facturación: ${closing.currency} ${closing.totalBilling.toLocaleString()}`,
        createdAt: new Date().toISOString()
      };
      // Save activity to state and DB
      handleSaveActivity(act);


      // Update property status to 'vendida' ONLY if it's an internal property
      if (closing.propertyId) {
        const prop = properties.find(p => p.id === closing.propertyId);
        if (prop) {
          handleSaveProperty({ ...prop, status: 'vendida' });
        }
      }
    }
  };

  const handleDeleteClosing = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cierre? Esta acción no se puede deshacer.')) return;
    setClosingLogs(prev => prev.filter(c => c.id !== id));
    try {
      await supabase.from('closing_logs').delete().eq('id', id);
    } catch (e) {
      console.error("Error deleting closing:", e);
    }
  };

  // Search Filtering
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const lowerQuery = searchQuery.toLowerCase();
    return clients.filter(client => {
      const nameMatch = client.owners.some(owner => owner.name.toLowerCase().includes(lowerQuery));
      const emailMatch = client.contact.email.toLowerCase().includes(lowerQuery);
      return nameMatch || emailMatch;
    });
  }, [clients, searchQuery]);

  // Render content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center flex-col">
          <Loader2 className="w-12 h-12 text-[#AA895F] animate-spin mb-4" />
          <p className="text-[#364649] font-medium animate-pulse">Cargando base de datos...</p>
        </div>
      );
    }

    switch (view) {
      // HOME
      // HOME
      case 'home':
      case 'metrics-home':
      case 'metrics-control':
        const historicalAvgTicket = closingLogs.length > 0
          ? closingLogs.reduce((sum, log) => sum + log.salePrice, 0) / closingLogs.length
          : 0;

        return <MetricsWrapper
          selectedTab={view === 'metrics-home' ? 'home' : 'control'}
          financialGoals={financialGoals}
          onUpdateGoals={handleUpdateFinancialGoals}
          // Data Props
          currentBilling={currentTotalBilling}
          currentActivities={currentTotalPLPB}
          currentRatio={historicalRatio}
          pipelineValue={pipelineValue}
          totalSides={currentTotalSides} // Passing sides count
          weeksOfData={new Set(activities.map(a => {
            const d = new Date(a.date);
            const onejan = new Date(d.getFullYear(), 0, 1);
            const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            return `${d.getFullYear()}-${week}`;
          })).size}
          totalClosings={closingLogs.length}
          captationStats={{
            preListings: activities.filter(a => a.type === 'pre_listing').length,
            listings: properties.length
          }}
          historicalAverageTicket={historicalAvgTicket}
          properties={properties}
          activities={activities}
          visits={visits}
          onNavigate={(view, params) => {
            navigateTo(view, params);
          }}
          clients={clients}
          buyers={buyerClients}
          marketingLogs={marketingLogs}
        />;

      // SELLERS
      case 'dashboard': return <SellersDashboard clients={filteredClients} properties={properties} onNewClient={() => { setEditingClientId(null); navigateTo('form'); }} onEditClient={handleEditClient} onAssignProperty={handleAssignProperty} onEditProperty={handleEditProperty} />;
      case 'form': const clientToEdit = editingClientId ? clients.find(c => c.id === editingClientId) : null; return <FormWrapper onBack={() => navigateTo('dashboard')}><ClientForm onSave={handleSaveClient} onCancel={() => navigateTo('dashboard')} initialData={clientToEdit} /></FormWrapper>;
      case 'properties-list': return <PropertyDashboard properties={properties} clients={clients} visits={visits} buyers={buyerClients} onNewProperty={handleNewProperty} onEditProperty={handleEditProperty} onOpenMarketing={handleOpenMarketing} />;
      case 'property-form': const propToEdit = editingPropertyId ? properties.find(p => p.id === editingPropertyId) : null; return <FormWrapper onBack={() => navigateTo('properties-list')}><PropertyForm clients={clients} onSave={handleSaveProperty} onCancel={() => navigateTo('properties-list')} initialData={propToEdit} defaultClientId={preSelectedClientId || undefined} /></FormWrapper>;

      // BUYERS
      case 'buyer-clients-list': return <BuyerClientDashboard clients={buyerClients} searches={buyerSearches} visits={visits} properties={properties} onNewClient={() => { setEditingBuyerClientId(null); navigateTo('buyer-client-form'); }} onEditClient={handleEditBuyerClient} onCreateSearch={handleCreateSearch} onEditSearch={handleEditSearch} />;
      case 'buyer-client-form': const buyerClientToEdit = editingBuyerClientId ? buyerClients.find(c => c.id === editingBuyerClientId) : null; return <FormWrapper onBack={() => navigateTo('buyer-clients-list')}><BuyerClientForm onSave={handleSaveBuyerClient} onCancel={() => navigateTo('buyer-clients-list')} initialData={buyerClientToEdit} /></FormWrapper>;
      case 'buyer-searches-list': return <BuyerSearchDashboard searches={buyerSearches} clients={buyerClients} onNewSearch={handleNewSearch} onEditSearch={handleEditSearch} />;
      case 'buyer-search-form': const searchToEdit = editingSearchId ? buyerSearches.find(s => s.id === editingSearchId) : null; return <FormWrapper onBack={() => navigateTo('buyer-searches-list')}><BuyerSearchForm clients={buyerClients} properties={properties} onSave={handleSaveSearch} onCancel={() => navigateTo('buyer-searches-list')} initialData={searchToEdit} defaultClientId={preSelectedBuyerClientId || undefined} /></FormWrapper>;

      // VISITS
      case 'visits-list': return <VisitDashboard visits={visits} properties={properties} buyers={buyerClients} onNewVisit={handleNewVisit} onEditVisit={handleEditVisit} />;
      case 'visit-form': const visitToEdit = editingVisitId ? visits.find(v => v.id === editingVisitId) : null; return <FormWrapper onBack={() => navigateTo('visits-list')}><VisitForm properties={properties} buyers={buyerClients} buyerSearches={buyerSearches} onSave={handleSaveVisit} onCancel={() => navigateTo('visits-list')} initialData={visitToEdit} /></FormWrapper>;

      // TRAKEO (Objectives, Weekly, Closings)
      case 'my-week':
        return (
          <WeeklyDashboard
            activities={activities}
            clients={clients}
            buyers={buyerClients}
            visits={visits}
            properties={properties}
            searches={buyerSearches}
            initialAction={viewParams?.action}
            onSaveActivity={handleSaveActivity}
            onDeleteActivity={handleDeleteActivity}
            // Pass global handlers for Deep Integration
            onSaveClient={handleSaveClient}
            onSaveProperty={handleSaveProperty}
            onSaveBuyer={handleSaveBuyerClient}
            onSaveSearch={handleSaveSearch}
            onSaveVisit={handleSaveVisit}
          />
        );
      case 'objectives':
        // Calculate Historical Average Ticket
        const historicalAverageTicket = closingLogs.length > 0
          ? closingLogs.reduce((sum, log) => sum + log.salePrice, 0) / closingLogs.length
          : 0;

        const weeksOfData = new Set(activities.map(a => {
          const d = new Date(a.date); // a.date is YYYY-MM-DD
          // Simple unique week identifier: Year-WeekNumber
          const onejan = new Date(d.getFullYear(), 0, 1);
          const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
          return `${d.getFullYear()}-${week}`;
        })).size;

        const totalClosings = closingLogs.length;

        const captationStats = {
          preListings: activities.filter(a => a.type === 'pre_listing').length,
          listings: properties.length // Using total properties as proxy for successful captations
        };

        return <ObjectivesDashboard
          key="objectives-dashboard"
          currentBilling={currentTotalBilling}
          currentActivities={currentTotalPLPB}
          currentRatio={historicalRatio} // Use Historic Ratio for planning
          pipelineValue={pipelineValue} // Pass the "Lag" Fix
          weeksOfData={weeksOfData}
          totalClosings={totalClosings}
          captationStats={captationStats}
          historicalAverageTicket={historicalAverageTicket}
          // New Props
          properties={properties}
          activities={activities}
          visits={visits}
          onNavigate={(view, params) => {
            navigateTo(view, params);
          }}
          financialGoals={financialGoals}
          onUpdateGoals={handleUpdateFinancialGoals}
          onSaveGoals={handleSaveFinancialGoals}
        />;
      case 'closings':
        return <ClosingsDashboard
          closings={closingLogs}
          activities={activities}
          properties={properties}
          clients={clients}
          buyers={buyerClients}
          onAddClosing={handleSaveClosing}
          onDeleteClosing={handleDeleteClosing}
          exchangeRate={financialGoals.exchangeRate || 1000}
          onUpdateExchangeRate={(rate) => handleUpdateFinancialGoals({ exchangeRate: rate })}
        />;

      case 'calendar':
        return <CalendarDashboard activities={activities} visits={visits} />;

      default: return null;
    }
  };

  const toggleGroup = (group: 'metrics' | 'sellers' | 'buyers' | 'trakeo') => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  // --- ERROR BOUNDARY COMPONENT ---
  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any, errorInfo: any }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false, error: null, errorInfo: null };
    }
    public state = { hasError: false, error: null, errorInfo: null };

    static getDerivedStateFromError(error: any) {
      return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
      this.setState({ error, errorInfo });
      console.error("Uncaught error:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-8 text-[#364649]">
            <h1 className="text-3xl font-bold mb-4 text-red-600">¡Ups! Algo salió mal.</h1>
            <p className="mb-4 text-lg">La aplicación ha encontrado un error inesperado.</p>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200 max-w-2xl w-full overflow-auto">
              <details className="whitespace-pre-wrap">
                <summary className="font-bold cursor-pointer mb-2 text-red-500">Ver detalles del error</summary>
                <p className="font-mono text-xs text-red-800 mb-4">{this.state.error && this.state.error.toString()}</p>
                <p className="font-mono text-xs text-gray-500">{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
              </details>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-3 bg-[#364649] text-white rounded-xl font-bold hover:bg-[#2C3A3D] transition-colors"
            >
              Recargar Aplicación
            </button>
          </div>
        );
      }

      return this.props.children;
    }
  }

  // --- RENDER LOGIN OR APP ---
  if (!session) {
    return <Login />;
  }

  // Wrap content in ErrorBoundary
  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-[#E0D8CC] text-[#364649] selection:bg-[#AA895F]/30">

        {/* Sidebar */}
        <aside className="w-20 lg:w-64 flex-shrink-0 z-20 flex flex-col justify-between bg-[#364649] text-white transition-all duration-300 shadow-xl">
          <div>
            <div className="h-24 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/10">
              <div className="w-10 h-10 bg-[#AA895F] rounded-xl flex items-center justify-center shadow-lg shadow-black/20 transform hover:scale-105 transition-transform duration-300 shrink-0">
                <Building2 className="text-white" size={22} />
              </div>
              <div className="hidden lg:flex flex-col ml-3 justify-center">
                <span className="font-semibold text-lg text-[#E0D8CC] leading-none">Entre</span>
                <span className="text-[10px] font-bold text-[#AA895F] uppercase tracking-[0.2em] leading-tight mt-1">Inmobiliarios</span>
              </div>
            </div>

            <nav className="mt-8 px-4 space-y-2">

              {/* METRICS GROUP */}
              <div>
                <button onClick={() => toggleGroup('metrics')} className="w-full flex items-center justify-between p-3 rounded-xl mb-1 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 group">
                  <div className="flex items-center"><BarChart3 size={20} className="group-hover:text-white transition-colors" /><span className="hidden lg:block ml-3 text-sm font-bold uppercase tracking-wider">Métricas</span></div>
                  <div className="hidden lg:block">{expandedGroup === 'metrics' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${expandedGroup === 'metrics' ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-0 lg:ml-4 border-l border-white/10 pl-2 space-y-1 mt-1">
                    <NavItem icon={<LayoutDashboard size={18} />} label="Resumen" active={view === 'home' || view === 'metrics-home'} onClick={() => navigateTo('metrics-home')} small />
                    <NavItem icon={<PieChart size={18} />} label="Control Negocio" active={view === 'metrics-control'} onClick={() => navigateTo('metrics-control')} small />
                  </div>
                </div>
              </div>

              <div><NavItem icon={<Calendar size={20} />} label="Calendario" active={view === 'calendar'} onClick={() => navigateTo('calendar')} /></div>

              {/* VENDEDORES GROUP */}
              <div>
                <button onClick={() => toggleGroup('sellers')} className="w-full flex items-center justify-between p-3 rounded-xl mb-1 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 group">
                  <div className="flex items-center"><Users size={20} className="group-hover:text-white transition-colors" /><span className="hidden lg:block ml-3 text-sm font-bold uppercase tracking-wider">Vendedores</span></div>
                  <div className="hidden lg:block">{expandedGroup === 'sellers' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${expandedGroup === 'sellers' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-0 lg:ml-4 border-l border-white/10 pl-2 space-y-1 mt-1">
                    <NavItem icon={<Users size={18} />} label="Mis Clientes" active={view === 'dashboard' || view === 'form'} onClick={() => navigateTo('dashboard')} small />
                    <NavItem icon={<Building2 size={18} />} label="Propiedades" active={view === 'properties-list' || view === 'property-form'} onClick={() => navigateTo('properties-list')} small />
                  </div>
                </div>
              </div>

              {/* COMPRADORES GROUP */}
              <div>
                <button onClick={() => toggleGroup('buyers')} className="w-full flex items-center justify-between p-3 rounded-xl mb-1 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 group">
                  <div className="flex items-center"><UserCheck size={20} className="group-hover:text-white transition-colors" /><span className="hidden lg:block ml-3 text-sm font-bold uppercase tracking-wider">Compradores</span></div>
                  <div className="hidden lg:block">{expandedGroup === 'buyers' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${expandedGroup === 'buyers' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-0 lg:ml-4 border-l border-white/10 pl-2 space-y-1 mt-1">
                    <NavItem icon={<UserCheck size={18} />} label="Mis Clientes" active={view === 'buyer-clients-list' || view === 'buyer-client-form'} onClick={() => navigateTo('buyer-clients-list')} small />
                    <NavItem icon={<Wallet size={18} />} label="Búsquedas Activas" active={view === 'buyer-searches-list' || view === 'buyer-search-form'} onClick={() => navigateTo('buyer-searches-list')} small />
                    <NavItem icon={<Calendar size={18} />} label="Visitas" active={view === 'visits-list' || view === 'visit-form'} onClick={() => navigateTo('visits-list')} small />
                  </div>
                </div>
              </div>

              {/* TRAKEO GROUP */}
              <div>
                <button onClick={() => toggleGroup('trakeo')} className="w-full flex items-center justify-between p-3 rounded-xl mb-1 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 group">
                  <div className="flex items-center"><Target size={20} className="group-hover:text-white transition-colors" /><span className="hidden lg:block ml-3 text-sm font-bold uppercase tracking-wider">Trakeo</span></div>
                  <div className="hidden lg:block">{expandedGroup === 'trakeo' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${expandedGroup === 'trakeo' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-0 lg:ml-4 border-l border-white/10 pl-2 space-y-1 mt-1">
                    <NavItem icon={<CalendarDays size={18} />} label="Mí Semana" active={view === 'my-week'} onClick={() => navigateTo('my-week')} small />
                    <NavItem icon={<DollarSign size={18} />} label="Cierres" active={view === 'closings'} onClick={() => navigateTo('closings')} small />
                    <NavItem icon={<Flag size={18} />} label="Objetivos" active={view === 'objectives'} onClick={() => navigateTo('objectives')} small />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-white/10">
                <NavItem icon={<Database size={20} />} label="Cargar Datos Prueba" active={false} onClick={handleLoadSeedData} />
              </div>
            </nav>
          </div>

          <div className="mb-8 px-4">
            <NavItem icon={<HelpCircle size={20} />} label="Ayuda" active={false} />
            <div className="mt-2">
              <button onClick={handleLogout} className="flex items-center w-full p-3 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 group">
                <LogOut size={20} className="group-hover:text-[#AA895F] transition-colors duration-300" />
                <span className="hidden lg:block ml-3 text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative no-scrollbar">
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#364649]/10 px-8 py-4 flex justify-between items-center shadow-sm">
            {/* Header Content Omitted for brevity, assuming standard header */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#364649] capitalize">
                {view === 'home' ? 'Panel Principal' :
                  view.includes('buyer') ? 'Gestión Compradores' :
                    view.includes('visit') ? 'Gestión Visitas' :
                      view.replace('-', ' ')}
              </h2>
            </div>

            {/* Header Content */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#364649] capitalize">
                {view === 'home' ? 'Panel Principal' :
                  view.includes('buyer') ? 'Gestión Compradores' :
                    view.includes('visit') ? 'Gestión Visitas' :
                      view.replace('-', ' ')}
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
                    onChange={(e) => setSelectedTeamUser(e.target.value || null)}
                    className="appearance-none bg-transparent font-bold text-sm text-[#364649] pr-6 cursor-pointer focus:outline-none"
                  >
                    <option value="">Vista Global (Todos)</option>
                    {teamUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
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
                  <p className="text-sm font-bold text-[#364649]">{session.user.email?.split('@')[0]}</p>
                  <p className="text-xs text-[#AA895F] font-bold tracking-wider">{isMother ? 'DIRECTOR (MADRE)' : 'AGENTE INMOBILIARIO'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#364649] text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:bg-[#AA895F] transition-colors" onClick={handleLogout}>
                  <LogOut size={16} className="ml-0.5" />
                </div>
              </div>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {marketingModalOpen && marketingPropertyId && (
          <MarketingModal
            property={properties.find(p => p.id === marketingPropertyId)!}
            logs={marketingLogs.filter(l => l.propertyId === marketingPropertyId)}
            onSave={handleSaveMarketing}
            onClose={() => setMarketingModalOpen(false)}
          />
        )}

      </div>
    </ErrorBoundary>
  );
}

const NavItem = ({ icon, label, active, onClick, disabled, small }: any) => (
  <button onClick={onClick} disabled={disabled} className={`w-full flex items-center p-3 rounded-xl mb-1 transition-all duration-300 group relative overflow-hidden ${active ? 'bg-[#E0D8CC] text-[#364649] shadow-lg shadow-black/20 font-semibold scale-[1.02]' : 'text-slate-300 hover:bg-white/10 hover:text-white hover:pl-4'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <span className={`relative z-10 transition-colors duration-300 ${active ? 'text-[#364649]' : 'text-slate-300 group-hover:text-white'}`}>{icon}</span>
    <span className={`relative z-10 hidden lg:block ml-3 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#AA895F] rounded-r-full lg:hidden animate-scale-in"></div>}
  </button>
);

const FormWrapper = ({ children, onBack }: any) => (
  <div className="max-w-5xl mx-auto pb-10">
    <button onClick={onBack} className="back-link mb-6 text-[#364649]/60 hover:text-[#AA895F] transition-colors font-medium text-sm flex items-center">
      <span className="group-hover:-translate-x-1 transition-transform inline-block mr-1">&larr;</span> Volver
    </button>
    {children}
  </div>
);
