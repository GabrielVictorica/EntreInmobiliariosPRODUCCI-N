
import React, { Component, useState, useMemo, useEffect, useCallback, useRef } from 'react';

// ... (imports)

// ...

// ... (imports)

// Auth
import Login from './components/auth/Login';

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
import HabitTracker from './components/habits/HabitTracker';

import SuccessNotification from './components/SuccessNotification';
import WelcomeScreen from './components/WelcomeScreen';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoadingSkeleton from './components/ui/LoadingSkeleton';

import { useTransition } from 'react';

// Zustand Stores
import { useBusinessStore } from './store/useBusinessStore';
import { useHabitStore } from './store/useHabitStore';
import { useShallow } from 'zustand/react/shallow';
import { FinancialGoals, DEFAULT_GOALS } from './store/slices/types';

import { supabase } from './services/supabaseClient';
import { seedDatabase } from './services/seedData';
import { Session } from '@supabase/supabase-js';
import { ClientRecord, PropertyRecord, BuyerClientRecord, BuyerSearchRecord, VisitRecord, MarketingLog, ActivityRecord, ClosingRecord, KPIDashboardRow } from './types';
import {
  Users,
  Search,
  Building2,
  Calendar,
  Loader2,
  BarChart3,
  Target,
  Flag,
  Save,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2
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
    time: db.time,
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
  time: a.time,
  notes: a.notes,
  reference_id: a.referenceId,
  system_generated: a.systemGenerated,
  created_at: a.createdAt
});


const mapClosingFromDB = (db: any): ClosingRecord => ({
  id: db.id,
  userId: db.user_id,
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
  user_id: c.userId || activeUserId,
  property_id: c.propertyId || null,
  manual_property: c.manualProperty,
  buyer_client_id: c.buyerClientId || null,
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


// --- ERROR BOUNDARY COMPONENT ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Using a properly typed class component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(">>> [CRITICAL] ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#E0D8CC] flex-col p-8 text-center">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-lg">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-black text-[#364649] mb-4 uppercase">Algo salió mal</h1>
            <p className="text-slate-500 mb-8 font-medium">La aplicación encontró un error inesperado. Hemos sido notificados y estamos trabajando en ello.</p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 w-full text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-800 break-all">{this.state.error.toString()}</p>
                {this.state.error.stack && <p className="text-[10px] font-mono text-red-600 mt-2 whitespace-pre-wrap">{this.state.error.stack.split('\n')[0]}</p>}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#364649] text-white font-black py-4 rounded-2xl hover:bg-[#242f31] transition-all shadow-lg shadow-black/10"
            >
              RECARGAR APLICACIÓN
            </button>
          </div>
        </div>
      );
    }

    const children = (this as any).props.children;
    return children;
  }
}

export default function App() {
  // --- 1. CORE STATUS & AUTH ---
  const session = useBusinessStore(state => state.authSession);
  const authStatus = useBusinessStore(state => state.authStatus);
  const authRole = useBusinessStore(state => state.authRole);
  const targetUserId = useBusinessStore(state => state.targetUserId);
  const isSystemInitializing = useBusinessStore(state => state.isSystemInitializing);
  const isAuthChecking = useBusinessStore(state => state.isAuthChecking);
  const selectedYear = useBusinessStore(state => state.selectedYear);
  const isHistoricalView = useBusinessStore(state => state.isHistoricalView);
  const googleAccessToken = useBusinessStore(state => state.googleAccessToken);
  const selectedTeamUser = useBusinessStore(state => state.selectedTeamUser);
  const teamUsers = useBusinessStore(state => state.teamUsers);
  const isGlobalView = useBusinessStore(state => state.isGlobalView);
  const isSynced = useBusinessStore(state => state.isGoogleSynced);

  // Store Actions (Atomic references)
  const initializeSession = useBusinessStore(state => state.initializeSession);
  const signOut = useBusinessStore(state => state.signOut);
  const setContextUser = useBusinessStore(state => state.setContextUser);
  const setTargetUserId = useBusinessStore(state => state.setTargetUserId);
  const setIsAuthChecking = useBusinessStore(state => state.setIsAuthChecking);
  const setIsSystemInitializing = useBusinessStore(state => state.setIsSystemInitializing);
  const fetchBusinessData = useBusinessStore(state => state.fetchBusinessData);
  const saveFinancialGoalsStore = useBusinessStore(state => state.saveFinancialGoals);
  const updateFinancialGoalsStore = useBusinessStore(state => state.updateFinancialGoals);
  const addClient = useBusinessStore(state => state.addClient);
  const updateClient = useBusinessStore(state => state.updateClient);
  const addProperty = useBusinessStore(state => state.addProperty);
  const updateProperty = useBusinessStore(state => state.updateProperty);
  const addBuyer = useBusinessStore(state => state.addBuyer);
  const updateBuyer = useBusinessStore(state => state.updateBuyer);
  const addSearch = useBusinessStore(state => state.addSearch);
  const updateSearch = useBusinessStore(state => state.updateSearch);
  const addVisit = useBusinessStore(state => state.addVisit);
  const updateVisit = useBusinessStore(state => state.updateVisit);
  const addMarketingLog = useBusinessStore(state => state.addMarketingLog);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Derived State Compatibility
  const isDataReady = authStatus === 'ready';
  // Loading is now handled by isAuthChecking from store

  // --- 2. NAVIGATION STATE ---
  const [immediateView, setImmediateView] = useState<'home' | 'dashboard' | 'form' | 'properties-list' | 'property-form' | 'buyer-clients-list' | 'buyer-client-form' | 'buyer-searches-list' | 'buyer-search-form' | 'visits-list' | 'visit-form' | 'my-week' | 'objectives' | 'closings' | 'calendar' | 'metrics-home' | 'metrics-control'>('metrics-home');
  const [view, setView] = useState(immediateView);
  const [viewParams, setViewParams] = useState<any>(null);
  const [returnTo, setReturnTo] = useState<{ view: string, params?: any } | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableYears = useMemo(() => [2024, 2025, 2026, 2027, 2028], []);
  const currentYear = selectedYear;

  // --- 5. EDITING & UI SELECTION ---
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [marketingPropertyId, setMarketingPropertyId] = useState<string | null>(null);
  const storeGoals = useBusinessStore(state => state.goalsByYear[selectedYear] || DEFAULT_GOALS);

  // --- 7. CORE FUNCTIONS & NAVIGATION ---
  const [hasVisited, setHasVisited] = useState<Record<string, boolean>>({ [view]: true });

  const navigateTo = useCallback((newView: typeof immediateView, params?: any) => {
    // 1. Instant Feedback
    setImmediateView(newView);

    // 2. Heavy Render in Transition
    startTransition(() => {
      setHasVisited(prev => prev[newView] ? prev : { ...prev, [newView]: true });
      if (params?.returnTo) {
        setReturnTo({ view: params.returnTo, params: params.returnParams });
      } else if (!params?.isReturning) {
        if (['home', 'dashboard', 'buyer-clients-list', 'my-week'].includes(newView)) {
          setReturnTo(null);
        }
      }
      setView(newView);
      if (params) setViewParams(params);
      else setViewParams(null);
    });
  }, [startTransition, setHasVisited, setReturnTo, setView, setImmediateView, setViewParams]); // Stable across view changes

  const handleReturn = () => {
    if (returnTo) {
      const { view: rView, params: rParams } = returnTo;
      setReturnTo(null);
      navigateTo(rView as any, { ...rParams, isReturning: true });
    }
  };

  const handleUpdateFinancialGoals = useCallback((newGoals: Partial<FinancialGoals>) => {
    updateFinancialGoalsStore(newGoals, selectedYear);
  }, [updateFinancialGoalsStore, selectedYear]);

  const handleSaveFinancialGoals = useCallback(async (goalsToSave: typeof storeGoals) => {
    if (!session?.user?.id) return;
    try {
      await saveFinancialGoalsStore(session.user.id, selectedYear);
      setShowSuccessNotification(true);
    } catch (e: any) { console.error("Exception saving goals:", e); }
  }, [session, selectedYear, saveFinancialGoalsStore]);

  // --- Auth & Session Management ---


  // Historical Ratio & Pipeline calculations moved to store or simplified


  // --- Initial Data Load ---
  const hasLoadedOnce = React.useRef(false);








  // Guard against double-initialization (Brave/React Strict Mode/Race Conditions)
  const hasInitialized = useRef(false);

  // --- Auth & Session Management ---

  // Derived status (prevents an extra render cycle from useEffect)
  const isMother = authRole === 'mother';

  useEffect(() => {
    // URL/Hash param handling (Calendar Tab)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    if (urlParams.get('tab') === 'calendar' || hashParams.get('tab') === 'calendar') {
      const hasTokenInHash = window.location.hash.includes('access_token');
      if (!hasTokenInHash) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      // CRITICAL FIX: Update ALL view states, not just 'view'.
      // This ensures Sidebar is active and, most importantly, 'hasVisited' is true so content mounts.
      setImmediateView('calendar');
      setView('calendar');
      setHasVisited(prev => ({ ...prev, calendar: true }));
    }

    // Listen for Auth Changes & System Boot
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthListener] Event: ${event}`, { hasToken: !!session?.provider_token });

      // 1. PRIORITY: Capture & Persist Google Token before any state reset
      if (session?.provider_token) {
        useBusinessStore.getState().persistGoogleConnection(session);
      }

      // 2. CONSOLIDATED BOOT: Handle fresh sign-ins and recovery
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        initializeSession();
      }
      if (event === 'SIGNED_OUT') {
        signOut();
      }

      // Keep store session in sync for silent refreshes (optional but good)
      if (event === 'TOKEN_REFRESHED' && session) {
        useBusinessStore.setState({ authSession: session, authUser: session.user });
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeSession, setImmediateView, setView, signOut]);

  // Failsafe: Ensure Loading Screen Clears after 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSystemInitializing || isAuthChecking) {
        console.log("[App] Failsafe Triggered: Unlocking boot gate manually.");
        setIsAuthChecking(false);
        setIsSystemInitializing(false);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isSystemInitializing, isAuthChecking, setIsAuthChecking, setIsSystemInitializing]);

  // 1. Handle TEAM USER change (Full Data Reload)
  // This effect is removed as team user selection and data fetching logic is now handled internally by the store
  // based on `setContextUser` and `fetchBusinessData` being called from the store's actions.

  // Failsafe: If Target ID is missing but Session exists (e.g. after crash), sync it.
  useEffect(() => {
    if (session?.user?.id && !targetUserId && !isSystemInitializing) {
      console.warn("[App] FAILSAFE: Target ID was lost. Restoring from Session.");
      setTargetUserId(session.user.id);
      // Trigger a repair fetch
      fetchBusinessData(session.user.id, false, session.access_token);
    }
  }, [session, isSystemInitializing, targetUserId, setTargetUserId, fetchBusinessData]);


  // 3. Orphan Habit Cleanup (Automatic once system is ready)
  useEffect(() => {
    // CRITICAL: Only run if we are actually synced to avoid spamming 401/400 errors
    if (googleAccessToken && isDataReady && isSynced) {
      // Trigger background cleanup of inactive habits' Google events
      // This is a fire-and-forget background process
      useHabitStore.getState().cleanupOrphanHabitEvents(googleAccessToken);
    }
  }, [googleAccessToken, isDataReady, isSynced]);



  // Re-filter data when team user or mother status changes (NO loading indicator)


  // --- Handle Logout ---
  // --- Handle Logout ---
  // --- Handle Logout ---
  // --- Handle Logout ---
  const handleLogout = useCallback(async () => {
    await signOut();
    window.location.href = '/';
  }, [signOut]);

  // --- Handle Seed Data ---
  const handleLoadSeedData = async () => {
    if (confirm("¿Estás seguro de que quieres cargar datos de prueba?")) {
      try {
        const result = await seedDatabase(supabase);
        if (result === true) {
          await initializeSession(); // Re-init
          alert("¡Datos de prueba cargados correctamente!");
        }
      } catch (error) { console.error(error); }
    }
  };

  // --- Handlers (Sellers) ---
  const handleSaveClient = useCallback(async (record: ClientRecord) => {
    if (!session?.user) return;
    navigateTo('dashboard');
    try {
      if (record.id) await updateClient(record.id, record);
      else await addClient(record);
    } catch (err: any) { console.error(err); }
  }, [session, navigateTo, updateClient, addClient]);

  const handleEditClient = useCallback((clientId: string) => {
    navigateTo('form', { editingClientId: clientId });
  }, [navigateTo]);
  const handleAssignProperty = useCallback((clientId: string) => {
    navigateTo('property-form', { preSelectedClientId: clientId });
  }, [navigateTo]);

  const handleSaveProperty = useCallback(async (record: PropertyRecord) => {
    if (!session?.user) return;
    navigateTo('properties-list');
    try {
      if (record.id) await updateProperty(record.id, record);
      else await addProperty(record);
    } catch (err: any) { console.error(err); }
  }, [session, navigateTo, updateProperty, addProperty]);

  const handleEditProperty = useCallback((id: string) => {
    navigateTo('property-form', { editingPropertyId: id });
  }, [navigateTo]);

  const handleNewProperty = useCallback(() => {
    navigateTo('property-form');
  }, [navigateTo]);

  // --- Handlers (Marketing) ---
  const handleOpenMarketing = useCallback((propertyId: string) => { setMarketingPropertyId(propertyId); setMarketingModalOpen(true); }, []);
  const handleSaveMarketing = useCallback(async (log: MarketingLog) => {
    if (!session?.user) return;
    setMarketingModalOpen(false);
    try {
      await addMarketingLog(log);
      alert("MARKETING GUARDADO OK");
    } catch (err: any) {
      console.error(err);
      alert("ERROR GUARDANDO MARKETING: " + (err.message || JSON.stringify(err)));
    }
  }, [session, addMarketingLog]);

  // --- Handlers (Buyers) ---
  const handleSaveBuyerClient = useCallback(async (record: BuyerClientRecord) => {
    if (!session?.user) { alert("ERROR DE SESIÓN: No hay usuario autenticado."); return; }

    const newRecord = {
      ...record,
      createdByEmail: record.createdByEmail || session.user.email,
      userId: record.userId || session.user.id
    };

    navigateTo('buyer-clients-list');

    try {
      if (record.id) {
        await updateBuyer(newRecord.id, newRecord);
      } else {
        await addBuyer(newRecord);
      }
      alert("COMPRADOR GUARDADO OK");
    } catch (e: any) {
      console.error(e);
      alert("ERROR GUARDANDO COMPRADOR: " + (e.message || JSON.stringify(e)));
    }
  }, [session, navigateTo, updateBuyer, addBuyer]);

  const handleEditBuyerClient = useCallback((id: string) => {
    navigateTo('buyer-client-form', { editingBuyerClientId: id });
  }, [navigateTo]);

  const handleCreateSearch = useCallback((buyerClientId: string) => {
    navigateTo('buyer-search-form', { preSelectedBuyerClientId: buyerClientId });
  }, [navigateTo]);

  const handleSaveSearch = useCallback(async (record: BuyerSearchRecord) => {
    if (!session?.user) return;
    navigateTo('buyer-searches-list');
    try {
      if (record.id) await updateSearch(record.id, record);
      else await addSearch(record);
    } catch (e) { console.error("Error saving search", e); }
  }, [session, navigateTo, updateSearch, addSearch]);

  const handleEditSearch = useCallback((id: string) => {
    navigateTo('buyer-search-form', { editingSearchId: id });
  }, [navigateTo]);

  const handleNewSearch = useCallback(() => {
    navigateTo('buyer-search-form');
  }, [navigateTo]);

  // --- Handlers (Visits) ---
  const handleSaveVisit = useCallback(async (record: VisitRecord) => {
    if (!session?.user) return;
    navigateTo('visits-list');
    try {
      if (record.id) await updateVisit(record.id, record);
      else await addVisit(record);
    } catch (err) { console.error(err); }
  }, [session, navigateTo, updateVisit, addVisit]);

  const handleEditVisit = useCallback((id: string) => {
    navigateTo('visit-form', { editingVisitId: id });
  }, [navigateTo]);

  const handleNewVisit = useCallback(() => {
    navigateTo('visit-form');
  }, [navigateTo]);

  // --- NEW HANDLERS FOR NAVIGATION STABILITY ---
  const handleNewSeller = useCallback(() => navigateTo('form'), [navigateTo]);
  const handleNewBuyer = useCallback(() => navigateTo('buyer-client-form'), [navigateTo]);

  // Handlers for Activities and Closings are now managed directly by the store

  // Search Filtering
  // Search Filtering logic moved to individual dashboards


  const currentTargetUid = targetUserId || session?.user?.id;
  // --- RENDER LOGIN OR APP ---

  // DEBOUNCED LOADER STATE
  // To avoid unmounting the entire app (Sidebar, etc.) during millisecond-long "checking" states,
  // we only show the loader if the checking state persists for > 500ms.
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isAuthChecking) {
      timer = setTimeout(() => setShowLoader(true), 500); // 500ms grace period
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timer);
  }, [isAuthChecking]);

  // If session exists, we render the MainLayout and only show the loader as an overlay if needed.
  // This prevents unmounting Sidebar/Habits/Calendar.

  // --- RENDER SELECTION ---

  // 1. Initial boot: No session and still checking auth
  if (!session && isAuthChecking && !showLoader) {
    return null; // Silent grace period
  }

  // 2. No session and loader should be shown
  if (!session && showLoader) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#E0D8CC] flex-col">
        <Loader2 className="w-16 h-16 text-[#AA895F] animate-spin mb-4" />
        <p className="text-[#364649] font-medium animate-pulse text-lg tracking-wider">Iniciando sistema...</p>
      </div>
    );
  }

  // 3. No session and not checking: Show Login
  if (!session) {
    return <Login />;
  }

  // 4. Authenticated state: Render Main Layout
  // This block is now stable - as long as session exists, we never return null or Login
  return (
    <ErrorBoundary>
      <WelcomeScreen
        isVisible={showWelcome}
        onClose={() => setShowWelcome(false)}
        userName={session?.user?.email || 'Agente'}
      />
      <SuccessNotification
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
      />
      <div className="flex h-screen overflow-hidden bg-[#E0D8CC] text-[#364649] selection:bg-[#AA895F]/30">

        <Sidebar
          view={immediateView}
          navigateTo={navigateTo}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative no-scrollbar">

          <Header
            view={view}
            isMother={isMother}
            selectedTeamUser={isGlobalView ? 'global' : selectedTeamUser}
            teamUsers={teamUsers}
            session={session}
            onLogout={handleLogout}
            onSelectTeamUser={(val) => {
              if (val === 'global') setContextUser(session?.user?.id || null, true);
              else setContextUser(val, false);
            }}
          />

          <div className="p-8 max-w-7xl mx-auto">


            {/* Loader Overlay (Persistent Sidebar) */}
            {isSystemInitializing && (
              <div className="absolute inset-0 z-[100] flex flex-col bg-[#E0D8CC]">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {view === 'calendar' ? <LoadingSkeleton type="calendar" /> :
                    (view === 'home' || view === 'metrics-home' || view === 'metrics-control') ? <LoadingSkeleton type="metrics" /> :
                      (view === 'objectives' || view === 'my-week') ? <LoadingSkeleton type="home" /> :
                        (view === 'closings') ? <LoadingSkeleton type="list" /> :
                          <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 className="w-12 h-12 text-[#AA895F] animate-spin mb-4" />
                            <p className="text-[#364649] font-bold uppercase tracking-widest text-sm">Actualizando...</p>
                          </div>
                  }
                </div>
              </div>
            )}

            {/* Persistent Mount for Habits (Gated by Lazy Load) */}
            {hasVisited['habits'] && (
              <div style={{ display: view === 'habits' ? 'block' : 'none' }}>
                <HabitTracker
                  session={session}
                  isActive={view === 'habits'}
                  googleAccessToken={googleAccessToken}
                  customUserId={isGlobalView ? undefined : selectedTeamUser || undefined}
                />
              </div>
            )}

            {/* Persistent Mount for Calendar (Gated by Lazy Load) */}
            {hasVisited['calendar'] && (
              <div style={{ display: view === 'calendar' ? 'block' : 'none' }}>
                <CalendarDashboard
                  session={session}
                  isActive={view === 'calendar'}
                  targetUserId={(isMother && selectedTeamUser) ? selectedTeamUser : session?.user?.id}
                />
              </div>
            )}

            {/* Metrics (Home/Control) - Persistent Mount */}
            {(hasVisited['home'] || hasVisited['metrics-home'] || hasVisited['metrics-control']) && (
              <div style={{ display: (view === 'home' || view === 'metrics-home' || view === 'metrics-control') ? 'block' : 'none' }}>
                <MetricsWrapper
                  selectedTab={view === 'metrics-control' ? 'control' : 'home'}
                  availableYears={availableYears}
                  onNavigate={navigateTo}
                  targetUserId={(isMother && selectedTeamUser) ? selectedTeamUser : session?.user?.id}
                />
              </div>
            )}

            {/* Objectives - Persistent Mount */}
            {hasVisited['objectives'] && (
              <div style={{ display: view === 'objectives' ? 'block' : 'none' }}>
                <ObjectivesDashboard
                  key="objectives-dashboard-persistent"
                  onNavigate={navigateTo}
                  availableYears={availableYears}
                  targetUserId={(isMother && selectedTeamUser) ? (selectedTeamUser === 'global' ? undefined : selectedTeamUser) : session?.user?.id}
                  token={session?.access_token}
                />
              </div>
            )}

            {/* Weekly Dashboard (Mi Semana) - Persistent Mount */}
            {hasVisited['my-week'] && (
              <div style={{ display: view === 'my-week' ? 'block' : 'none' }}>
                <WeeklyDashboard
                  onNavigateTo={navigateTo}
                  targetUserId={(isMother && selectedTeamUser) ? (selectedTeamUser === 'global' ? undefined : selectedTeamUser) : session?.user?.id}
                />
              </div>
            )}

            {/* Closings - Persistent after first visit */}
            {hasVisited['closings'] && (
              <div style={{ display: view === 'closings' ? 'block' : 'none' }}>
                <ClosingsDashboard
                  availableYears={availableYears}
                />
              </div>
            )}

            {/* --- PERSISTENT MOUNTS FOR MAIN DASHBOARDS (Performance Optimization) --- */}

            {/* Sellers Dashboard (view='dashboard') */}
            {hasVisited['dashboard'] && (
              <div style={{ display: view === 'dashboard' ? 'block' : 'none' }}>
                <SellersDashboard
                  onEditClient={handleEditClient}
                  onAssignProperty={handleAssignProperty}
                  onNewSeller={handleNewSeller}
                  onEditProperty={handleEditProperty}
                />
              </div>
            )}

            {/* Buyer Clients Dashboard */}
            {hasVisited['buyer-clients-list'] && (
              <div style={{ display: view === 'buyer-clients-list' ? 'block' : 'none' }}>
                <BuyerClientDashboard
                  onEditClient={handleEditBuyerClient}
                  onCreateSearch={handleCreateSearch}
                  onNewClient={handleNewBuyer}
                  onEditSearch={handleEditSearch}
                />
              </div>
            )}

            {/* Properties List Dashboard */}
            {hasVisited['properties-list'] && (
              <div style={{ display: view === 'properties-list' ? 'block' : 'none' }}>
                <PropertyDashboard
                  onEditProperty={handleEditProperty}
                  onNewProperty={handleNewProperty}
                  onOpenMarketing={handleOpenMarketing}
                />
              </div>
            )}

            {/* Visits Dashboard */}
            {hasVisited['visits-list'] && (
              <div style={{ display: view === 'visits-list' ? 'block' : 'none' }}>
                <VisitDashboard
                  onEdit={handleEditVisit}
                  onNew={handleNewVisit}
                />
              </div>
            )}

            {/* Buyer Searches Dashboard */}
            {hasVisited['buyer-searches-list'] && (
              <div style={{ display: view === 'buyer-searches-list' ? 'block' : 'none' }}>
                <BuyerSearchDashboard
                  onEdit={handleEditSearch}
                  onNew={handleNewSearch}
                />
              </div>
            )}

            {/* Conditional Mount for other views (forms, lists, etc.) */}
            {/* Conditional Mount for other views (forms, lists, etc.) */}
            {!['habits', 'calendar', 'home', 'metrics-home', 'metrics-control', 'objectives', 'closings', 'my-week',
              'dashboard', 'buyer-clients-list', 'properties-list', 'visits-list', 'buyer-searches-list'].includes(view) && (
                <ViewSwitcher
                  view={view}
                  viewParams={viewParams}
                  session={session}
                  onBack={handleReturn}
                  onSaveClient={handleSaveClient}
                  onSaveProperty={handleSaveProperty}
                  onEditProperty={handleEditProperty}
                  onNewProperty={handleNewProperty}
                  onOpenMarketing={handleOpenMarketing}
                  onEditBuyerClient={handleEditBuyerClient}
                  onCreateSearch={handleCreateSearch}
                  onNewBuyer={handleNewBuyer}
                  onEditSearch={handleEditSearch}
                  onNewSearch={handleNewSearch}
                  onSaveBuyerClient={handleSaveBuyerClient}
                  onSaveSearch={handleSaveSearch}
                  onEditVisit={handleEditVisit}
                  onNewVisit={handleNewVisit}
                  onSaveVisit={handleSaveVisit}
                  onEditClient={handleEditClient}
                  onAssignProperty={handleAssignProperty}
                  onNewSeller={handleNewSeller}
                />
              )}
          </div>
        </main>

        {
          marketingModalOpen && marketingPropertyId && (
            <MarketingModal
              propertyId={marketingPropertyId}
              onClose={() => setMarketingModalOpen(false)}
              onSave={handleSaveMarketing}
            />
          )
        }

      </div >
    </ErrorBoundary >
  );
}


// --- COMPONENTS DEFINED OUTSIDE TO PREVENT REMOUNTING LAGG ---

const FormWrapper = ({ children, onBack }: any) => (
  <div className="max-w-5xl mx-auto pb-10">
    <button onClick={onBack} className="back-link mb-6 text-[#364649]/60 hover:text-[#AA895F] transition-colors font-medium text-sm flex items-center">
      <span className="group-hover:-translate-x-1 transition-transform inline-block mr-1">&larr;</span> Volver
    </button>
    {children}
  </div>
);

// ViewSwitcher defined outside App so its identity is stable
const ViewSwitcher = React.memo(({
  view,
  viewParams,
  session,
  onBack,
  onSaveClient,
  onSaveProperty,
  onEditProperty,
  onNewProperty,
  onOpenMarketing,
  onEditBuyerClient,
  onCreateSearch,
  onNewBuyer,
  onEditSearch,
  onNewSearch,
  onSaveBuyerClient,
  onSaveSearch,
  onEditVisit,
  onNewVisit,
  onSaveVisit,
  onEditClient,
  onAssignProperty,
  onNewSeller
}: any) => {
  switch (view) {
    case 'form':
      return <FormWrapper onBack={onBack}><ClientForm session={session} editingId={viewParams?.editingClientId} onSave={onSaveClient} /></FormWrapper>;
    case 'property-form':
      return <FormWrapper onBack={onBack}><PropertyForm session={session} editingId={viewParams?.editingPropertyId} preSelectedClientId={viewParams?.preSelectedClientId} onSave={onSaveProperty} /></FormWrapper>;
    case 'buyer-client-form':
      return <FormWrapper onBack={onBack}><BuyerClientForm session={session} editingId={viewParams?.editingBuyerClientId} onSave={onSaveBuyerClient} /></FormWrapper>;
    case 'buyer-search-form':
      return <FormWrapper onBack={onBack}><BuyerSearchForm session={session} editingId={viewParams?.editingSearchId} preSelectedBuyerClientId={viewParams?.preSelectedBuyerClientId} onSave={onSaveSearch} /></FormWrapper>;
    case 'visit-form':
      return <FormWrapper onBack={onBack}><VisitForm session={session} editingId={viewParams?.editingVisitId} onSave={onSaveVisit} /></FormWrapper>;

    // Persistent Views (Returned null here as they are mounted in App.tsx)
    case 'properties-list':
    case 'buyer-clients-list':
    case 'buyer-searches-list':
    case 'visits-list':
    case 'dashboard':
    case 'calendar':
      return null;
    default:
      return null;
  }
});
