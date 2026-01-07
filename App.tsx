
import React, { Component, useState, useMemo, useEffect, useCallback, useRef } from 'react';

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
import BusinessControl from './components/tracking/BusinessControl';
import ObjectivesDashboard from './components/tracking/ObjectivesDashboard';
import WeeklyDashboard from './components/tracking/WeeklyDashboard';
import ClosingsDashboard from './components/tracking/ClosingsDashboard';
import CalendarDashboard from './components/tracking/CalendarDashboard';
import HabitTracker from './components/habits/HabitTracker';

import SuccessNotification from './components/SuccessNotification';
import WelcomeScreen from './components/WelcomeScreen';

import { supabase } from './services/supabaseClient';
import { seedDatabase } from './services/seedData';
import { ClientRecord, PropertyRecord, BuyerClientRecord, BuyerSearchRecord, VisitRecord, MarketingLog, ActivityRecord, ClosingRecord, KPIDashboardRow } from './types';
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
  Save,
  LayoutDashboard,
  PieChart,
  CalendarDays,
  DollarSign,
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
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
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

    return this.props.children;
  }
}

export default function App() {
  // Session State
  const [session, setSession] = useState<any>(null);

  // Navigation State
  const [view, setView] = useState<'home' | 'dashboard' | 'form' | 'properties-list' | 'property-form' | 'buyer-clients-list' | 'buyer-client-form' | 'buyer-searches-list' | 'buyer-search-form' | 'visits-list' | 'visit-form' | 'my-week' | 'objectives' | 'closings' | 'calendar' | 'metrics-home' | 'metrics-control' | 'habits'>('metrics-home');
  const [viewParams, setViewParams] = useState<any>(null);
  const [returnTo, setReturnTo] = useState<{ view: string, params?: any } | null>(null);

  // Auth Checking State (Prevents Login Flash)
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);

  // Navigation Group State (Collapsible)
  const [expandedGroup, setExpandedGroup] = useState<'metrics' | 'sellers' | 'buyers' | 'trakeo' | 'system' | null>(null);

  // Welcome Screen State
  const [showWelcome, setShowWelcome] = useState(false);

  // --- NAVIGATION HELPER (Prevents Flickering) ---
  const navigateTo = (newView: typeof view, params?: any) => {
    // Check for returnTo in params
    if (params?.returnTo) {
      setReturnTo({ view: params.returnTo, params: params.returnParams });
    } else if (!params?.isReturning) {
      // Clear returnTo if navigating normally to a major view, 
      // but keep it if we are just going deeper into a flow
      if (['home', 'dashboard', 'buyer-clients-list', 'my-week'].includes(newView)) {
        setReturnTo(null);
      }
    }

    setView(newView);
    if (params) setViewParams(params);
    else setViewParams(null); // Clear params if not provided

    // Synchronous Update for Expanded Group
    if (['dashboard', 'form', 'properties-list', 'property-form'].includes(newView)) {
      setExpandedGroup('sellers');
    } else if (['buyer-clients-list', 'buyer-client-form', 'buyer-searches-list', 'buyer-search-form', 'visits-list', 'visit-form'].includes(newView)) {
      setExpandedGroup('buyers');
    } else if (['my-week', 'objectives', 'closings', 'habits'].includes(newView)) {
      setExpandedGroup('trakeo');
    } else if (['home', 'metrics-home', 'metrics-control'].includes(newView)) {
      setExpandedGroup('metrics');
    } else {
      setExpandedGroup(null);
    }
  };

  const handleReturn = () => {
    if (returnTo) {
      const { view: rView, params: rParams } = returnTo;
      setReturnTo(null);
      navigateTo(rView as any, { ...rParams, isReturning: true });
    }
  };

  // ... (rest of the file) ...

  // RENDER LOGIC UPDATE (Conceptual - applying to the render part of App.tsx)
  // I need to find where ObjectivesDashboard is rendered and pass the new props.
  // Since I cannot do a view_file with search inside task_boundary, I will rely on reading the end of the file or searching for the render block.


  // Data State
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [buyerClients, setBuyerClients] = useState<BuyerClientRecord[]>([]);
  const [buyerSearches, setBuyerSearches] = useState<BuyerSearchRecord[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [marketingLogs, setMarketingLogs] = useState<MarketingLog[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]); // Tracking Activities
  const [closingLogs, setClosingLogs] = useState<ClosingRecord[]>([]); // NEW: Closings
  const [kpiData, setKpiData] = useState<KPIDashboardRow[]>([]); // NEW: KPI View Data
  const [googleEvents, setGoogleEvents] = useState<any[]>([]); // Added for global agenda
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isCheckingGoogleSync, setIsCheckingGoogleSync] = useState(false);

  // Fetch KPI Data from View


  const [loading, setLoading] = useState(true);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [hasUnsavedGoals, setHasUnsavedGoals] = useState(false);

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

  // Fetch KPI Data from View using Native Fetch for consistency and RLS bypass
  const fetchKPIs = useCallback(async (currentSession?: any, momStatus?: boolean, teamUser?: string | null) => {
    const sess = currentSession || session;
    if (!sess?.user?.id) return;

    const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';
    const token = sess?.access_token || SUPABASE_KEY;

    let url = `${SUPABASE_URL}/rest/v1/view_kpi_dashboard_anual?select=*`;

    const isMom = momStatus !== undefined ? momStatus : isMother;
    const targetTeamUser = teamUser !== undefined ? teamUser : selectedTeamUser;

    // Filter by user if not Mother (Global) or if specific team user selected
    if (!isMom) {
      url += `&user_id=eq.${sess.user.id}`;
    } else if (targetTeamUser === 'global') {
      // GLOBAL: No user_id filter to get sum of all team results
    } else if (targetTeamUser) {
      // Specific Child ID
      url += `&user_id=eq.${targetTeamUser}`;
    } else {
      // Default Mother Individual View
      url += `&user_id=eq.${sess.user.id}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data)) {
          // Ensure numeric types are actually numbers and handle falsy values
          const parsed = data.map(d => ({
            ...d,
            anio: Number(d.anio || 0),
            facturacion_total: Number(d.facturacion_total || 0),
            transacciones_cerradas: Number(d.transacciones_cerradas || 0),
            transacciones_operaciones: Number(d.transacciones_operaciones || 0),
            volumen_total: Number(d.volumen_total || 0),
            ticket_promedio: Number(d.ticket_promedio || 0),
            honorarios_reales: Number(d.honorarios_reales || 0),
            efectividad_cierre: Number(d.efectividad_cierre || 0),
            efectividad_captacion: Number(d.efectividad_captacion || 0),
            honorarios_promedio: Number(d.honorarios_promedio || 0),
            productividad_actividad: Number(d.productividad_actividad || 0),
            annual_billing: Number(d.annual_billing || 0),
            monthly_need: Number(d.monthly_need || 0)
          }));
          setKpiData(parsed);
          // Cache for instant load next time
          try {
            localStorage.setItem('kpi_data_cache', JSON.stringify(parsed));
          } catch (e) {
            console.error("Error caching KPI data:", e);
          }
        }
      } else {
        const errText = await response.text();
        console.error('Error fetching KPIs:', response.status, errText);
      }
    } catch (e) {
      console.error('Exception fetching KPIs:', e);
    }
  }, [session, isMother, selectedTeamUser]);

  // Initial Load from Cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem('kpi_data_cache');
      if (cached) {
        setKpiData(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Error loading KPI cache:", e);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs, selectedTeamUser]);

  // --- Financial Goals State (Shared between Objectives & Control) ---
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isHistoricalView, setIsHistoricalView] = useState<boolean>(false);
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
    isManualCaptationRatio: false,
    captationStartDate: new Date().toISOString().split('T')[0],
    captationEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });
  const [loadingGoals, setLoadingGoals] = useState(false);

  // Cache for goals by year - prevents delay when switching between years
  const goalsCacheRef = useRef<Record<number, typeof financialGoals>>({});
  const availableYears = [2024, 2025, 2026, 2027, 2028];

  // Helper function to fetch goals for a specific year
  const fetchGoalsForYear = async (year: number, userId: string, accessToken: string) => {
    const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

    const url = `${SUPABASE_URL}/rest/v1/agent_objectives?user_id=eq.${userId}&year=eq.${year}&order=created_at.desc&limit=1`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`
        }
      });

      if (response.ok) {
        const records = await response.json();
        const data = records && records.length > 0 ? records[0] : null;

        if (data) {
          return {
            annualBilling: data.annual_billing || 120000,
            monthlyNeed: data.monthly_need || 1500,
            averageTicket: data.average_ticket || 4000,
            commissionSplit: data.commission_split || 45,
            commercialWeeks: data.commercial_weeks || 48,
            manualRatio: data.manual_ratio || 6,
            isManualRatio: data.is_manual_ratio || false,
            isManualTicket: data.is_manual_ticket || false,
            exchangeRate: data.exchange_rate || 1100,
            captationGoalQty: data.captation_goal_qty || 2,
            captationGoalPeriod: data.captation_goal_period || 'month',
            manualCaptationRatio: data.manual_captation_ratio || 2.5,
            isManualCaptationRatio: data.is_manual_captation_ratio || false,
            captationStartDate: data.captation_start_date || new Date().toISOString().split('T')[0],
            captationEndDate: data.captation_end_date || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
          };
        }
      }
    } catch (e) {
      // Silent fail - goals will use defaults
    }
    return null;
  };

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('goals_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        goalsCacheRef.current = parsed;
        if (parsed[selectedYear]) {
          setFinancialGoals(parsed[selectedYear]);
        }
      }
    } catch (e) {
      // Silent fail - cache will be rebuilt
    }
  }, []);

  // Pre-fetch ALL years
  useEffect(() => {
    if (!session?.user?.id) return;

    const prefetchAllYears = async () => {
      const promises = availableYears.map(async (year) => {
        const goals = await fetchGoalsForYear(year, session.user.id, session.access_token);
        if (goals) {
          goalsCacheRef.current[year] = goals;
        }
      });
      await Promise.all(promises);

      try {
        localStorage.setItem('goals_cache', JSON.stringify(goalsCacheRef.current));
      } catch (e) {
        // Silent fail - cache save is non-critical
      }

      if (goalsCacheRef.current[selectedYear]) {
        setFinancialGoals(goalsCacheRef.current[selectedYear]);
      }
    };

    prefetchAllYears();
  }, [session]);

  // Load Goals for Selected Year
  useEffect(() => {
    if (!session?.user?.id) return;
    if (goalsCacheRef.current[selectedYear]) {
      setFinancialGoals(goalsCacheRef.current[selectedYear]);
      return;
    }
    const fetchGoals = async () => {
      const goals = await fetchGoalsForYear(selectedYear, session.user.id, session.access_token);
      if (goals) {
        goalsCacheRef.current[selectedYear] = goals;
        setFinancialGoals(goals);
      }
    };
    fetchGoals();
  }, [session, selectedYear]);

  const handleUpdateFinancialGoals = useCallback((newGoals: Partial<typeof financialGoals>) => {
    setFinancialGoals(prev => {
      return { ...prev, ...newGoals };
    });
    setHasUnsavedGoals(true);
  }, []);

  const handleSaveFinancialGoals = useCallback(async (goalsToSave: typeof financialGoals) => {
    if (!session?.user?.id) {
      alert("Error: No estás logueado.");
      return;
    }

    try {
      const payload = {
        user_id: session.user.id,
        year: selectedYear,
        annual_billing: goalsToSave.annualBilling,
        monthly_need: goalsToSave.monthlyNeed,
        average_ticket: goalsToSave.averageTicket,
        commission_split: goalsToSave.commissionSplit,
        commercial_weeks: goalsToSave.commercialWeeks,
        exchange_rate: goalsToSave.exchangeRate,
        manual_ratio: goalsToSave.manualRatio,
        is_manual_ratio: goalsToSave.isManualRatio,
        is_manual_ticket: goalsToSave.isManualTicket,
        captation_goal_qty: goalsToSave.captationGoalQty,
        captation_goal_period: goalsToSave.captationGoalPeriod,
        manual_captation_ratio: goalsToSave.manualCaptationRatio,
        is_manual_captation_ratio: goalsToSave.isManualCaptationRatio,
        captation_start_date: goalsToSave.captationStartDate,
        captation_end_date: goalsToSave.captationEndDate,
        created_at: new Date().toISOString()
      };

      const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

      const response = await fetch(`${SUPABASE_URL}/rest/v1/agent_objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token || SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        goalsCacheRef.current[selectedYear] = goalsToSave;
        try {
          localStorage.setItem('goals_cache', JSON.stringify(goalsCacheRef.current));
        } catch (e) {
          console.error("Error updating local cache:", e);
        }
        setShowSuccessNotification(true);
        setHasUnsavedGoals(false);
      } else {
        const errorText = await response.text();
        alert(`Error al guardar: ${errorText}`);
      }
    } catch (e: any) {
      console.error("Exception saving goals:", e);
      alert(`Error inesperado: ${e.message}`);
    }
  }, [session, selectedYear]);



  // --- MEMOIZED DATA FOR DASHBOARDS ---
  const objectivesData = useMemo(() => {
    // REFACTORED: Use ALL kpiData for true historical averages (Ticket, Ratio)
    // kpiData is already filtered by user_id in fetchKPIs based on selectedTeamUser
    const totalVolume = kpiData.reduce((acc, row) => acc + (row.volumen_total || 0), 0);
    const totalSides = kpiData.reduce((acc, row) => acc + (row.transacciones_cerradas || 0), 0);
    const totalOperations = kpiData.reduce((acc, row) => acc + (row.transacciones_operaciones || 0), 0);

    // 1. Historical Average Ticket (True Historical)
    const historicalAverageTicket = totalOperations > 0 ? totalVolume / totalOperations : 0;

    // 2. Weeks of Data (Contextual to Selected Year for current performance monitoring)
    const weeksOfData = new Set(activities.filter(a => new Date(a.date).getFullYear() === selectedYear).map(a => {
      const d = new Date(a.date);
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      return `${d.getFullYear()}-${week}`;
    })).size;

    const totalClosings = totalSides;

    // 3. Captation Stats (True Historical flow)
    const totalPL = kpiData.reduce((acc, row) => acc + (row.total_pl || 0), 0);
    const totalCaptaciones = kpiData.reduce((acc, row) => acc + (row.total_captaciones || 0), 0);

    const captationStats = {
      preListings: totalPL,
      listings: totalCaptaciones
    };

    return { historicalAverageTicket, weeksOfData, totalClosings, captationStats };
  }, [kpiData, activities, selectedYear]); // Added selectedYear dependency

  const handleNavigateCallback = useCallback((view: any, params?: any) => {
    navigateTo(view, params);
  }, []);

  // --- Auth & Session Management ---
  const checkUserRole = async (userId: string, currentSession?: any) => {
    try {
      const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';
      const token = currentSession?.access_token || session?.access_token || SUPABASE_KEY;

      // Check current user's role
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const isMom = data && data.length > 0 && data[0].role === 'mother';
        setIsMother(isMom);

        // If mother, fetch all team users (children)
        if (isMom) {
          const teamResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?role=eq.child&select=user_id,email`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${token}`
            }
          });

          if (teamResponse.ok) {
            const teamData = await teamResponse.json();
            setTeamUsers(teamData || []);
          }
        } else {
          setTeamUsers([]);
        }

        return isMom;
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
    setIsMother(false);
    setTeamUsers([]);
    return false;
  };

  // isMother is now set by checkUserRole, use state instead of hardcoded email
  const isMasterUser = isMother;


  // 1. Current Billing (Annual Reset)
  const currentTotalBilling = useMemo(() => {
    const currentYear = selectedYear;
    const rate = financialGoals.exchangeRate || 1000;

    return closingLogs
      .filter(c => new Date(c.date).getFullYear() === currentYear)
      .reduce((acc, curr) => {
        // Quick Normalization for Goal Calculation using MANUAL RATE
        const amount = curr.currency === 'ARS' ? curr.totalBilling / rate : curr.totalBilling;
        return acc + amount;
      }, 0);
  }, [closingLogs, financialGoals.exchangeRate, selectedYear]);

  // Calculate Total Sides for Transactions Metric
  const currentTotalSides = useMemo(() => {
    const currentYear = selectedYear;
    return closingLogs
      .filter(c => new Date(c.date).getFullYear() === currentYear)
      .reduce((acc, curr) => acc + (curr.sides || 0), 0);
  }, [closingLogs, selectedYear]);

  // 2. Current Year Activities (Annual Reset for Goals)
  const currentTotalPLPB = useMemo(() => {
    const currentYear = selectedYear;
    return activities.filter(a => {
      const date = new Date(a.date);
      return (a.type === 'pre_listing' || a.type === 'pre_buying') && date.getFullYear() === currentYear;
    }).length;
  }, [activities, selectedYear]);

  // 3. Historical Ratio (All Time Data - Stability)
  // Requires: minimum 4 months of data (~17 weeks) AND 5 closings
  // Standard default: 6:1 (6 PL-PB per closing = 16.67% closing rate)
  const MIN_WEEKS_FOR_RATIO = 17; // ~4 months
  const MIN_CLOSINGS_FOR_RATIO = 8;
  const STANDARD_RATIO = 6; // 6:1 standard

  const historicalRatio = useMemo(() => {
    const allTimePLPB = activities.filter(a => a.type === 'pre_listing' || a.type === 'pre_buying').length;
    const allTimeClosings = closingLogs.length;

    // Check if we have enough data for auto-calculation
    const hasEnoughData = objectivesData.weeksOfData >= MIN_WEEKS_FOR_RATIO && allTimeClosings >= MIN_CLOSINGS_FOR_RATIO;

    if (hasEnoughData && allTimeClosings > 0 && allTimePLPB > 0) {
      return allTimePLPB / allTimeClosings; // Auto-calculated ratio
    }

    return STANDARD_RATIO; // Standard 6:1 when insufficient data
  }, [activities, closingLogs, objectivesData.weeksOfData]);

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
  const loadAllData = async (activeUserId?: string, isMotherOverride?: boolean, teamUserOverride?: string | null, tokenOverride?: string) => {
    const uid = activeUserId || session?.user?.id;
    if (!uid) return;

    const isMom = isMotherOverride !== undefined ? isMotherOverride : isMother;
    const teamUser = teamUserOverride !== undefined ? teamUserOverride : selectedTeamUser;

    // Only show full screen loader on the very first load
    if (!hasLoadedOnce.current) setLoading(true);

    try {
      const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';
      const token = tokenOverride || session?.access_token || SUPABASE_KEY;

      const isGlobal = isMom && teamUser === 'global';
      const targetUserId = isMom && teamUser && teamUser !== 'global' ? teamUser : uid;

      // 1. Closings
      const closingsData = await fetch(`${SUPABASE_URL}/rest/v1/closing_logs?select=*&order=date.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      }).then(async res => {
        if (res.ok) return await res.json();
        console.error("Error fetching closings:", await res.text());
        return [];
      }).catch(e => {
        console.error("Closings fetch exception:", e);
        return [];
      });

      // 2. Visits
      let visitsRes: { data: any[] } = { data: [] };
      try {
        const visitsResponse = await fetch(`${SUPABASE_URL}/rest/v1/visits?select=*`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`
          }
        });
        if (visitsResponse.ok) {
          visitsRes = { data: await visitsResponse.json() || [] };
        } else {
          console.error("Visits fetch error:", await visitsResponse.text());
        }
      } catch (e) {
        console.error("Visits fetch exception:", e);
      }

      // 3. Activities
      const activitiesData = await fetch(`${SUPABASE_URL}/rest/v1/activities?select=*&order=date.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      }).then(async res => {
        if (res.ok) return await res.json();
        console.error("Error fetching activities:", await res.text());
        return [];
      }).catch(e => {
        console.error("Activities fetch exception:", e);
        return [];
      });

      // 4. KPIs (View)
      await fetchKPIs(session, isMom, teamUser);

      // Process Closings
      if (Array.isArray(closingsData)) {
        let mapped = closingsData.map(x => {
          try { return mapClosingFromDB(x); }
          catch (e) {
            console.error("Map error for closing:", x.id, e);
            return null;
          }
        }).filter((x): x is ClosingRecord => x !== null);

        // Filter by user based on role
        // Filter by user based on role
        if (isMom) {
          // If Global, show ALL (do not filter)
          if (teamUser === 'global') {
            // Keep all
          }
          // If Specific Team User selected, show theirs
          else if (teamUser) {
            mapped = mapped.filter(x => x.userId === teamUser);
          }
          // If "Mis Datos" (empty), show ONLY MY own
          else {
            mapped = mapped.filter(x => x.userId === uid);
          }
        } else {
          // Regular user: always specific to them
          mapped = mapped.filter(x => x.userId === uid);
        }

        setClosingLogs(mapped);
      }

      // Process Visits
      if (visitsRes.data) {
        const mapped = visitsRes.data.map(mapVisitFromDB);
        setVisits(isGlobal ? mapped : mapped.filter(x => x.userId === targetUserId));
      }

      // Process Activities
      if (Array.isArray(activitiesData)) {
        const mapped = activitiesData.map(mapActivityFromDB);
        setActivities(isGlobal ? mapped : mapped.filter(x => x.userId === targetUserId));
      }

      // STAGE 2: Settings & Heavy Lists
      // Settings load
      if (isGlobal) {
        fetch(`${SUPABASE_URL}/rest/v1/user_settings?select=*`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
        }).then(async r => {
          if (r.ok) {
            const allSettings = await r.json();
            if (Array.isArray(allSettings) && allSettings.length > 0) {
              const aggregated = allSettings.reduce((acc, curr) => ({
                annualBilling: acc.annualBilling + (Number(curr.annual_billing) || 0),
                monthlyNeed: acc.monthlyNeed + (Number(curr.monthly_need) || 0),
                averageTicket: acc.averageTicket,
                commissionSplit: acc.commissionSplit,
                commercialWeeks: Math.max(acc.commercialWeeks, Number(curr.commercial_weeks) || 48),
                manualRatio: acc.manualRatio,
                isManualRatio: acc.isManualRatio,
                isManualTicket: acc.isManualTicket,
                exchangeRate: curr.exchange_rate || acc.exchangeRate
              }), {
                annualBilling: 0, monthlyNeed: 0, averageTicket: 4000, commissionSplit: 45,
                commercialWeeks: 48, manualRatio: 6, isManualRatio: false, isManualTicket: false, exchangeRate: 1000
              });
              setFinancialGoals(aggregated);
            }
          }
        });
      } else {
        supabase.from('user_settings').select('*').eq('user_id', targetUserId).maybeSingle().then(({ data: settingsData }) => {
          if (settingsData) {
            setFinancialGoals({
              annualBilling: Number(settingsData.annual_billing) || 0,
              monthlyNeed: Number(settingsData.monthly_need) || 0,
              averageTicket: Number(settingsData.average_ticket) || 4000,
              commissionSplit: Number(settingsData.commission_split) || 45,
              commercialWeeks: Number(settingsData.commercial_weeks) || 48,
              manualRatio: Number(settingsData.manual_ratio) || 6,
              isManualRatio: !!settingsData.is_manual_ratio,
              isManualTicket: !!settingsData.is_manual_ticket,
              exchangeRate: Number(settingsData.exchange_rate) || 1000,
              captationGoalQty: Number(settingsData.captation_goal_qty) || 2,
              captationGoalPeriod: settingsData.captation_goal_period || 'month',
              manualCaptationRatio: Number(settingsData.manual_captation_ratio) || 2.5,
              isManualCaptationRatio: !!settingsData.is_manual_captation_ratio,
              captationStartDate: settingsData.captation_start_date || new Date().toISOString().split('T')[0],
              captationEndDate: settingsData.captation_end_date || new Date().toISOString().split('T')[0]
            });
          }
        });
      }

      // Background Heavy Lists
      Promise.all([
        supabase.from('seller_clients').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('buyer_clients').select('*'),
        supabase.from('buyer_searches').select('*'),
        supabase.from('property_marketing_logs').select('*').order('date', { ascending: false })
      ]).then(bgResults => {
        const [c, p, bc, bs, m] = bgResults;
        if (c.data) {
          const mapped = c.data.map(mapSellerFromDB);
          setClients(isGlobal ? mapped : mapped.filter(x => x.userId === targetUserId));
        }
        if (p.data) {
          const mapped = p.data.map(mapPropertyFromDB);
          setProperties(isGlobal ? mapped : mapped.filter(x => x.userId === targetUserId));
        }
        if (bc.data) {
          const mapped = bc.data.map(mapBuyerFromDB);
          setBuyerClients(isGlobal ? mapped : mapped.filter(x => x.userId === targetUserId));
        }
        if (bs.data) {
          const mapped = bs.data.map(mapSearchFromDB);
          setBuyerSearches(isGlobal ? mapped : mapped.filter(x => x.userId === targetUserId));
        }
        if (m.data) setMarketingLogs(m.data.map(mapMarketingFromDB));
      });

      // 🚀 UNBLOCK UI NOW
      if (!hasLoadedOnce.current) {
        setLoading(false);
        setIsAuthChecking(false);
        hasLoadedOnce.current = true;
        if (!sessionStorage.getItem('welcomeShown')) {
          setShowWelcome(true);
          sessionStorage.setItem('welcomeShown', 'true');
        }
      }
      setIsDataReady(true);

    } catch (error: any) {
      console.error("Critical Data Load Error:", error.message);
    } finally {
      setIsAuthChecking(false);
      setLoading(false);
    }
  };



  const fetchGoogleEvents = async (currentSession: any, targetEmail: string = 'primary') => {
    if (!currentSession?.user?.id) return;
    // If target is "primary" (default) or matches session user user, use 'primary' to avoid errors
    const targetId = targetEmail === 'primary' || targetEmail === currentSession?.user?.email ? 'primary' : targetEmail;

    setIsCheckingGoogleSync(true);
    try {
      const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

      // 1. Get Token (Always from Main User - the one viewing)
      const integResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_integrations?user_id=eq.${currentSession.user.id}&provider=eq.google_calendar&select=access_token,refresh_token,expires_at`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${currentSession.access_token || SUPABASE_KEY}`
        }
      });

      let integ: any = null;
      if (integResponse.ok) {
        const integData = await integResponse.json();
        integ = integData && integData.length > 0 ? integData[0] : null;
      }

      let token = integ?.access_token;
      if (!token) {
        setIsGoogleSynced(false);
        setIsCheckingGoogleSync(false);
        return;
      }

      setGoogleAccessToken(token);
      setIsGoogleSynced(true);

      // Fetch events for current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + mondayOffset);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${targetId}/events?timeMin=${startOfWeek.toISOString()}&timeMax=${endOfWeek.toISOString()}&singleEvents=true&orderBy=startTime`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        setIsGoogleSynced(false);
        // Attempt refresh via Edge Function
        const { data: refreshData } = await supabase.functions.invoke('refresh-google-token');
        if (refreshData?.access_token) {
          setGoogleAccessToken(refreshData.access_token);
          setIsGoogleSynced(true);
          const retryResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${targetId}/events?timeMin=${startOfWeek.toISOString()}&timeMax=${endOfWeek.toISOString()}&singleEvents=true&orderBy=startTime`, {
            headers: { 'Authorization': `Bearer ${refreshData.access_token}` }
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setGoogleEvents(data.items || []);
          }
        }
      } else if (response.ok) {
        const data = await response.json();
        setGoogleEvents(data.items || []);
      } else {
        // Handle 404 (Calendar not found) or 403 (Not shared)
        console.warn(`Could not fetch calendar for ${targetId}. Status: ${response.status}`);
        setGoogleEvents([]); // Clear events to avoid showing Mother's events
        if (targetId !== 'primary') {
          // Optional: You could set a UI state here to show a "Calendar not shared" warning
        }
      }
    } catch (error) {
      console.error("Error fetching Google Events:", error);
      setGoogleEvents([]);
    } finally {
      setIsCheckingGoogleSync(false);
    }
  };

  // --- Sequenced Initialization ---
  const initializeUser = async (currentSession: any) => {
    if (!currentSession?.user) {
      setIsAuthChecking(false);
      return;
    }

    try {
      const isMom = await checkUserRole(currentSession.user.id, currentSession);
      await loadAllData(currentSession.user.id, isMom, selectedTeamUser, currentSession.access_token);
      // Fetch Google Events for the dashboard/home view
      fetchGoogleEvents(currentSession);
    } catch (error) {
      console.error("Initialization Failed", error);
    } finally {
      setIsAuthChecking(false);
      setIsDataReady(true);
    }
  };

  // Guard against double-initialization (Brave/React Strict Mode/Race Conditions)
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 1. Initial Session Check (Critical for Reloads)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      // Check if we just returned from a Google OAuth flow
      // We look for tab=calendar in query params OR in the hash (Supabase sometimes mixes them)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1)); // remove #

      if (urlParams.get('tab') === 'calendar' || hashParams.get('tab') === 'calendar') {
        setView('calendar');
        setExpandedGroup('trakeo');
        // Clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }

      if (session && !hasInitialized.current) {
        hasInitialized.current = true;
        initializeUser(session);
      } else if (!session) {
        setIsAuthChecking(false);
      }
    });

    // 2. Auth State Listener (For Sign In / Sign Out events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_OUT') {
        hasInitialized.current = false;
        hasLoadedOnce.current = false; // Reset for next login
        setClients([]);
        setProperties([]);
        setIsAuthChecking(false);
        return;
      }

      if (session && !hasInitialized.current) {
        hasInitialized.current = true;
        await initializeUser(session);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Failsafe: Ensure Loading Screen Clears after 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthChecking(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Re-filter when filters change (Manual Trigger)
  useEffect(() => {
    if (session?.user && !isAuthChecking) {
      // 1. Reload DB Data (Supabase)
      loadAllData(session.user.id, isMother, selectedTeamUser);

      // 2. Reload Google Calendar (Attempt to switch to Team Member's calendar)
      let targetEmail = 'primary';
      if (isMother && selectedTeamUser && selectedTeamUser !== 'global') {
        const teamMember = teamUsers.find(u => u.user_id === selectedTeamUser);
        if (teamMember?.email) {
          targetEmail = teamMember.email;
        }
      }
      fetchGoogleEvents(session, targetEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamUser]); // only when specific filter changes. isMother change is handled by init.



  // Re-filter data when team user or mother status changes (NO loading indicator)


  // --- Handle Logout ---
  // --- Handle Logout ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSession(null);
      setClients([]);
      setProperties([]);
      setActivities([]);
      setClosingLogs([]);
      window.location.reload(); // FORCE RELOAD to clear all memory/cache
    }
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
    if (!session?.user) { alert("ERROR DE SESIÓN: No hay usuario autenticado."); return; }

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
    try {
      const { error } = await supabase.from('seller_clients').upsert(mapSellerToDB(newRecord, session.user.id));
      if (error) throw error;
      alert("CLIENTE GUARDADO OK");
    } catch (err: any) {
      console.error(err);
      alert("ERROR GUARDANDO CLIENTE: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleEditClient = (clientId: string) => { setEditingClientId(clientId); navigateTo('form'); };
  const handleAssignProperty = (clientId: string) => { setPreSelectedClientId(clientId); setEditingPropertyId(null); navigateTo('property-form'); };

  const handleSaveProperty = async (record: PropertyRecord) => {
    if (!session?.user) { alert("ERROR DE SESIÓN: No hay usuario autenticado."); return; }

    const newRecord = {
      ...record,
      createdByEmail: record.createdByEmail || session.user.email
    };

    if (editingPropertyId) setProperties(prev => prev.map(p => p.id === newRecord.id ? newRecord : p));
    else setProperties([newRecord, ...properties]);
    navigateTo('properties-list');
    setEditingPropertyId(null);
    setPreSelectedClientId(null);
    setPreSelectedClientId(null);
    try {
      const { error } = await supabase.from('properties').upsert(mapPropertyToDB(newRecord, session.user.id));
      if (error) throw error;
      alert("PROPIEDAD GUARDADA OK");
    } catch (err: any) {
      console.error(err);
      alert("ERROR GUARDANDO PROPIEDAD: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleEditProperty = (id: string) => { setEditingPropertyId(id); navigateTo('property-form'); };
  const handleNewProperty = () => { setEditingPropertyId(null); setPreSelectedClientId(null); navigateTo('property-form'); }

  // --- Handlers (Marketing) ---
  const handleOpenMarketing = (propertyId: string) => { setMarketingPropertyId(propertyId); setMarketingModalOpen(true); };
  const handleSaveMarketing = async (log: MarketingLog) => {
    if (!session?.user) return;
    setMarketingLogs(prev => [log, ...prev]);
    setMarketingModalOpen(false);
    try {
      const { error } = await supabase.from('property_marketing_logs').upsert(mapMarketingToDB(log, session.user.id));
      if (error) throw error;
      alert("MARKETING GUARDADO OK");
    } catch (err: any) {
      console.error(err);
      alert("ERROR GUARDANDO MARKETING: " + (err.message || JSON.stringify(err)));
    }
  };

  // --- Handlers (Buyers) ---
  const handleSaveBuyerClient = async (record: BuyerClientRecord) => {
    if (!session?.user) { alert("ERROR DE SESIÓN: No hay usuario autenticado."); return; }

    const newRecord = {
      ...record,
      createdByEmail: record.createdByEmail || session.user.email
    };

    if (editingBuyerClientId) setBuyerClients(prev => prev.map(c => c.id === newRecord.id ? newRecord : c));
    else setBuyerClients([newRecord, ...buyerClients]);
    setEditingBuyerClientId(null);
    navigateTo('buyer-clients-list');
    navigateTo('buyer-clients-list');
    try {
      const { error } = await supabase.from('buyer_clients').upsert(mapBuyerToDB(newRecord, session.user.id));
      if (error) throw error;
      alert("COMPRADOR GUARDADO OK");
    } catch (e: any) {
      console.error(e);
      alert("ERROR GUARDANDO COMPRADOR: " + (e.message || JSON.stringify(e)));
    }
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
    if (!session?.user) { alert("ERROR: No hay sesión de usuario."); return; }

    // Optimistic update
    setActivities(prev => [...prev, act]);

    try {
      const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

      const response = await fetch(`${SUPABASE_URL}/rest/v1/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session?.access_token || SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(mapActivityToDB(act, session.user.id))
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Success - no action needed
    } catch (e: any) {
      console.error("Error guardando actividad:", e);
      // Revert optimistic update
      setActivities(prev => prev.filter(a => a.id !== act.id));
      alert("Error guardando actividad: " + (e.message || JSON.stringify(e)));
    }
  };

  const handleDeleteActivity = async (id: string) => {
    // Optimistic update
    const previousActivities = [...activities];
    setActivities(prev => prev.filter(a => a.id !== id));

    try {
      const SUPABASE_URL = 'https://whfoflccshoztjlesnhh.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZm9mbGNjc2hvenRqbGVzbmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzUwMzEsImV4cCI6MjA4MTMxMTAzMX0.rPQdO1qCovC9WP3ttlDOArvTI7I15lg7fnOPkJseDos';

      const response = await fetch(`${SUPABASE_URL}/rest/v1/activities?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session?.access_token || SUPABASE_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Success - no action needed
    } catch (e: any) {
      console.error("Error eliminando actividad:", e);
      // Revert optimistic update
      setActivities(previousActivities);
      alert("Error eliminando actividad: " + (e.message || JSON.stringify(e)));
    }
  };

  // --- Handlers (Closings) ---
  const handleSaveClosing = async (closing: ClosingRecord) => {
    if (!session?.user) { alert("ERROR DE SESIÓN: No hay usuario autenticado."); return; }

    // Check if this is an update or new insert
    // Ideally we check if ID is not 'CL-...' and exists in our list.
    // Simplifying: If ID starts with CL-, it's new (unless we are persisting CL- IDs which is bad practice but we handle it).
    // Actually, `closing` passed here already has the ID from the form.
    // If it's an EDIT, the form passed the EXISTING ID.
    // If it's NEW, the form passed `CL-${Date.now()}`.

    // Check if ID exists in current logs to determine if it's new
    const isNew = !closingLogs.some(c => c.id === closing.id);

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
        // INSERT using Supabase SDK
        const { data, error } = await supabase
          .from('closing_logs')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const realRecord = mapClosingFromDB(data);
          setClosingLogs(prev => prev.map(c => c.id === closing.id ? realRecord : c));

          // Auto-create Activity 'cierre' (Only for NEW records)
          const propDesc = closing.manualProperty || (closing.propertyId ? properties.find(p => p.id === closing.propertyId)?.address.street : 'Propiedad');

          // Determine contact name
          let contactName = closing.manualBuyer || 'Comprador Externo';
          if (closing.buyerClientId) {
            const buyer = buyerClients.find(b => b.id === closing.buyerClientId);
            if (buyer) contactName = buyer.name;
          }

          const act: ActivityRecord = {
            id: crypto.randomUUID(),
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

          alert("¡Cierre guardado exitosamente!");
        }
      } else {
        // UPDATE
        const { error } = await supabase.from('closing_logs').update(dbPayload).eq('id', closing.id);
        if (error) throw error;
      }

    } catch (err: any) {
      console.error("Error saving closing:", err);
      // Revert optimistic update
      if (isNew) {
        setClosingLogs(prev => prev.filter(c => c.id !== closing.id));
      }
      alert(`Error guardando el cierre. Intenta de nuevo.\nDetalle: ${err.message || JSON.stringify(err)}`);
    }
  };

  const handleDeleteClosing = async (id: string) => {
    // Optimistic update
    const previousClosings = [...closingLogs];
    setClosingLogs(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase.from('closing_logs').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error("Error deleting closing:", e);
      // Revert on error
      setClosingLogs(previousClosings);
      alert("Error eliminando el cierre: " + (e.message || "Error desconocido"));
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

  // --- HELPER: NORMALIZE CURRENCY ---
  const normalizeToUSD = (amount: number, currency: string) => {
    const rate = financialGoals.exchangeRate || 1000;
    if (currency === 'USD') return amount;
    if (currency === 'ARS') return amount / rate;
    return amount;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Render content
  const renderContent = () => {
    // Pipeline Value: Consolidated realistic projection
    // 1. Portfolio: 40% of potential billing (3% of price) for available/reserved properties
    const inventoryPipeline = properties
      .filter(p => p.status === 'disponible' || p.status === 'reservada')
      .reduce((sum, p) => {
        const priceUSD = normalizeToUSD(p.price || 0, p.currency);
        return sum + (priceUSD * 0.03 * 0.40);
      }, 0);

    // 2. Buyers: 10% of potential billing (3% of max budget) for active searches
    const buyerPipeline = buyerSearches
      .filter(s => s.status === 'activo')
      .reduce((sum, s) => {
        const budgetUSD = normalizeToUSD(s.searchProfile.budget.max || 0, s.searchProfile.budget.currency);
        return sum + (budgetUSD * 0.03 * 0.10);
      }, 0);

    const pipelineValue = inventoryPipeline + buyerPipeline;

    switch (view) {
      // HOME
      case 'home':
      case 'metrics-home':
        // === UNIFIED METRICS CALCULATION (DB VIEW SOURCE) ===

        // --- 1. GET DATA FROM VIEW ---
        // --- 1. GET DATA FROM VIEW ---
        const getKpiStats = () => {
          // Filter rows based on view mode
          const relevantRows = isHistoricalView
            ? kpiData
            : kpiData.filter(d => d.anio === selectedYear);

          // Sum up metrics (Safe for Global/Team views)
          const totalRev = relevantRows.reduce((s, r) => s + (r.facturacion_total || 0), 0);
          const totalSides = relevantRows.reduce((s, r) => s + (r.transacciones_cerradas || 0), 0);
          const totalOperations = relevantRows.reduce((s, r) => s + (r.transacciones_operaciones || 0), 0);
          const totalVolume = relevantRows.reduce((s, r) => s + (r.volumen_total || 0), 0);
          const totalPL = relevantRows.reduce((s, r) => s + (r.total_pl || 0), 0);
          const totalFees = relevantRows.reduce((s, r) => s + (r.honorarios_reales || 0), 0);
          const totalActivities = relevantRows.reduce((s, r) => s + (r.total_reuniones_verdes || 0), 0);

          return {
            billing: totalRev,
            sides: totalSides,
            pl: totalPL,
            fees: totalFees,
            avgTicket: totalOperations > 0 ? totalVolume / totalOperations : 0,
            ratio: totalSides > 0 ? totalPL / totalSides : 0,
            honorariosPromedio: totalSides > 0 ? totalFees / totalSides : 0,
            productividadActividad: totalActivities > 0 ? totalFees / totalActivities : 0,
            isDataReliable: (() => {
              try {
                const acts = isHistoricalView ? activities : activities.filter(a => {
                  if (!a.date) return false;
                  const d = new Date(a.date);
                  return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
                });

                const months = new Set<string>();
                acts.forEach(a => {
                  if (!a.date) return;
                  const d = new Date(a.date);
                  if (!isNaN(d.getTime())) {
                    months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
                  }
                });

                return months.size >= 4 && totalSides >= 5;
              } catch (e) {
                console.error("Error calculating data reliability:", e);
                return false;
              }
            })()
          };
        };
        const kpiStats = getKpiStats();

        // --- 2. WEEKLY STATS (CURRENT REAL TIME) ---
        const hmToday = new Date();
        const hmStartOfWeek = new Date(hmToday);
        hmStartOfWeek.setDate(hmToday.getDate() - (hmToday.getDay() || 7) + 1); // Monday
        hmStartOfWeek.setHours(0, 0, 0, 0);

        const hmWeeklyPLDone = activities.filter(a => {
          const actDate = new Date(a.date);
          return actDate >= hmStartOfWeek && (a.type === 'pre_listing' || a.type === 'pre_buying');
        }).length;
        const hmWeeklyGreenDone = activities.filter(a => {
          const actDate = new Date(a.date);
          return actDate >= hmStartOfWeek && a.type === 'reunion_verde';
        }).length;

        // --- 3. TARGETS ---
        const hmEffectiveTicket = financialGoals.isManualTicket
          ? (financialGoals.averageTicket || 4000)
          : (objectivesData.historicalAverageTicket || financialGoals.averageTicket || 4000);

        const hmAnnBillingTarget = financialGoals.annualBilling || 40000;
        const hmCommPerSale = hmEffectiveTicket * 0.03;
        const hmTxNeeded = hmCommPerSale > 0 ? hmAnnBillingTarget / hmCommPerSale : 0;
        const hmPocketFeesTarget = hmAnnBillingTarget * ((financialGoals.commissionSplit || 45) / 100);

        const hmEffectiveRatio = financialGoals.isManualRatio
          ? (financialGoals.manualRatio || 6)
          : (historicalRatio || 6);

        const hmWeeks = financialGoals.commercialWeeks || 48;
        const hmWeeklyPLTarget = hmWeeks > 0 ? (hmTxNeeded * hmEffectiveRatio) / hmWeeks : 0;

        // --- 4. DISPLAY STRINGS ---
        const hmHasData = kpiStats.pl > 0 && kpiStats.sides > 0;
        let hmClosingRate: string;
        let hmRatioDisplay: string;
        let hmIsStandard = false;

        if (hmHasData) {
          hmClosingRate = ((kpiStats.sides / kpiStats.pl) * 100).toFixed(1);
          hmRatioDisplay = `${(kpiStats.pl / kpiStats.sides).toFixed(1)}:1`;
        } else {
          hmClosingRate = '16.7';
          hmRatioDisplay = '6.0:1 (estándar)';
          hmIsStandard = true;
        }

        const hmDisplayMetrics = {
          transactionsNeeded: hmTxNeeded,
          transactionsDone: kpiStats.sides,
          greenMeetingsTarget: 15,
          greenMeetingsDone: hmWeeklyGreenDone, // Real time
          pocketFees: kpiStats.fees,
          pocketFeesTarget: hmPocketFeesTarget,
          criticalNumberTarget: hmWeeklyPLTarget,
          criticalNumberDone: hmWeeklyPLDone, // Real time
          activeProperties: properties.filter(p => p.status === 'disponible' || p.status === 'reservada').length,
          honorariosPromedio: kpiStats.honorariosPromedio,
          productividadActividad: kpiStats.productividadActividad,
          isDataReliable: kpiStats.isDataReliable
        };

        return <MetricsWrapper
          selectedTab={view === 'metrics-home' ? 'home' : 'control'}
          financialGoals={financialGoals}
          onUpdateGoals={handleUpdateFinancialGoals}
          currentBilling={kpiStats.billing}
          currentActivities={kpiStats.pl}
          currentRatio={kpiStats.ratio}
          pipelineValue={pipelineValue}
          totalSides={kpiStats.sides}
          weeksOfData={objectivesData.weeksOfData}
          totalClosings={objectivesData.totalClosings}
          captationStats={objectivesData.captationStats}
          historicalAverageTicket={objectivesData.historicalAverageTicket}
          properties={properties}
          activities={activities}
          visits={visits}
          closingLogs={closingLogs}
          onNavigate={(view, params) => navigateTo(view, params)}
          clients={clients}
          buyers={buyerClients}
          marketingLogs={marketingLogs}
          availableYears={availableYears}
          currentYear={selectedYear}
          onSelectYear={setSelectedYear}
          isHistoricalView={isHistoricalView}
          onToggleHistorical={setIsHistoricalView}
          displayMetrics={hmDisplayMetrics}
          displayBilling={kpiStats.billing}
          displayTicket={kpiStats.avgTicket}
          displayClosingRate={hmClosingRate}
          displayClosingRatioDisplay={hmRatioDisplay}
          displayIsStandardRate={hmIsStandard}
          googleEvents={googleEvents}
          targetUserId={(isMother && selectedTeamUser) ? selectedTeamUser : session?.user?.id}
        />;

      // SELLERS
      case 'dashboard': return <SellersDashboard clients={filteredClients} properties={properties} isLoading={!isDataReady} onNewClient={() => { setEditingClientId(null); navigateTo('form'); }} onEditClient={handleEditClient} onAssignProperty={handleAssignProperty} onEditProperty={handleEditProperty} />;
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
            closingLogs={closingLogs}
            initialAction={viewParams?.action}
            onSaveActivity={handleSaveActivity}
            onDeleteActivity={handleDeleteActivity}
            // Pass global handlers for Deep Integration
            onSaveClient={handleSaveClient}
            onSaveProperty={handleSaveProperty}
            onSaveBuyer={handleSaveBuyerClient}
            onSaveSearch={handleSaveSearch}
            onSaveVisit={handleSaveVisit}
            onSaveClosing={handleSaveClosing}
            onDeleteClosing={handleDeleteClosing}
            onNavigateTo={navigateTo}
          />
        );
      case 'metrics-control':
        // --- 1. GET DATA FROM VIEW ---
        const getControlStats = () => {
          const relevantRows = isHistoricalView
            ? kpiData
            : kpiData.filter(d => d.anio === selectedYear);

          const totalRev = relevantRows.reduce((s, r) => s + (r.facturacion_total || 0), 0);
          const totalSides = relevantRows.reduce((s, r) => s + (r.transacciones_cerradas || 0), 0);
          const totalOperations = relevantRows.reduce((s, r) => s + (r.transacciones_operaciones || 0), 0);
          const totalVolume = relevantRows.reduce((s, r) => s + (r.volumen_total || 0), 0);
          const totalPL = relevantRows.reduce((s, r) => s + (r.total_pl || 0), 0);
          const totalFees = relevantRows.reduce((s, r) => s + (r.honorarios_reales || 0), 0);
          const totalActivities = relevantRows.reduce((s, r) => s + (r.total_reuniones_verdes || 0), 0);

          return {
            billing: totalRev,
            sides: totalSides,
            pl: totalPL,
            fees: totalFees,
            avgTicket: totalOperations > 0 ? totalVolume / totalOperations : 0,
            ratio: totalSides > 0 ? totalPL / totalSides : 0,
            honorariosPromedio: totalSides > 0 ? totalFees / totalSides : 0,
            productividadActividad: totalActivities > 0 ? totalFees / totalActivities : 0,
            isDataReliable: (() => {
              try {
                const acts = isHistoricalView ? activities : activities.filter(a => {
                  if (!a.date) return false;
                  const d = new Date(a.date);
                  return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
                });

                const months = new Set<string>();
                acts.forEach(a => {
                  if (!a.date) return;
                  const d = new Date(a.date);
                  if (!isNaN(d.getTime())) {
                    months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
                  }
                });

                return months.size >= 4 && totalSides >= 5;
              } catch (e) {
                console.error("Error calculating data reliability:", e);
                return false;
              }
            })()
          };
        };
        const mcStats = getControlStats();

        // --- 2. WEEKLY STATS (CURRENT REAL TIME) ---
        const mcToday = new Date();
        const mcStartOfWeek = new Date(mcToday);
        mcStartOfWeek.setDate(mcToday.getDate() - (mcToday.getDay() || 7) + 1);
        mcStartOfWeek.setHours(0, 0, 0, 0);

        const mcWeeklyPLDone = activities.filter(a => {
          const actDate = new Date(a.date);
          return actDate >= mcStartOfWeek && (a.type === 'pre_listing' || a.type === 'pre_buying');
        }).length;
        const mcWeeklyGreenDone = activities.filter(a => {
          const actDate = new Date(a.date);
          return actDate >= mcStartOfWeek && a.type === 'reunion_verde';
        }).length;

        // --- 3. TARGETS ---
        const mcEffectiveTicket = financialGoals.isManualTicket
          ? (financialGoals.averageTicket || 4000)
          : (objectivesData.historicalAverageTicket || financialGoals.averageTicket || 4000);

        const mcAnnBillingTarget = financialGoals.annualBilling || 40000;
        const mcCommPerSale = mcEffectiveTicket * 0.03;
        const mcTxNeeded = mcCommPerSale > 0 ? mcAnnBillingTarget / mcCommPerSale : 0;
        const mcPocketFeesTarget = mcAnnBillingTarget * ((financialGoals.commissionSplit || 45) / 100);

        const mcEffectiveRatio = financialGoals.isManualRatio
          ? (financialGoals.manualRatio || 6)
          : (objectivesData.historicalAverageTicket ? historicalRatio : 6); // Use true historical ratio or default
        const mcWeeks = financialGoals.commercialWeeks || 48;
        const mcWeeklyPLTarget = mcWeeks > 0 ? (mcTxNeeded * mcEffectiveRatio) / mcWeeks : 0;

        // --- 4. DISPLAY STRINGS ---
        const mcHasData = mcStats.pl > 0 && mcStats.sides > 0;
        let mcClosingRate: string;
        let mcRatioDisplay: string;
        let mcIsStandard = false;

        if (mcHasData) {
          mcClosingRate = ((mcStats.sides / mcStats.pl) * 100).toFixed(1);
          mcRatioDisplay = `${(mcStats.pl / mcStats.sides).toFixed(1)}:1`;
        } else {
          mcClosingRate = '16.7';
          mcRatioDisplay = '6.0:1 (estándar)';
          mcIsStandard = true;
        }

        const mcDisplayMetrics = {
          transactionsNeeded: mcTxNeeded,
          transactionsDone: mcStats.sides,
          greenMeetingsTarget: 15,
          greenMeetingsDone: mcWeeklyGreenDone,
          pocketFees: mcStats.fees,
          pocketFeesTarget: mcPocketFeesTarget,
          criticalNumberTarget: mcWeeklyPLTarget,
          criticalNumberDone: mcWeeklyPLDone,
          activeProperties: properties.filter(p => p.status === 'disponible' || p.status === 'reservada').length,
          honorariosPromedio: mcStats.honorariosPromedio,
          productividadActividad: mcStats.productividadActividad,
          isDataReliable: mcStats.isDataReliable
        };

        return <BusinessControl
          currentBilling={mcStats.billing}
          annualBillingTarget={financialGoals.annualBilling || 120000}
          averageTicket={mcStats.avgTicket}
          pipelineValue={pipelineValue}
          metrics={mcDisplayMetrics}
          captationGoals={(() => {
            // Calculate weeks from captation dates
            const startDate = financialGoals.captationStartDate || new Date().toISOString().split('T')[0];
            const endDate = financialGoals.captationEndDate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];
            const calculateWeeks = (start: string, end: string) => {
              try {
                const s = new Date(start);
                const e = new Date(end);
                if (isNaN(s.getTime()) || isNaN(e.getTime())) return 4;
                const diff = Math.floor((e.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000));
                return Math.max(diff, 1);
              } catch {
                return 4;
              }
            };
            const weeksDuration = calculateWeeks(startDate, endDate);
            const captationRatio = financialGoals.isManualCaptationRatio
              ? (financialGoals.manualCaptationRatio || 2.5)
              : (objectivesData.captationStats.listings > 0
                ? objectivesData.captationStats.preListings / objectivesData.captationStats.listings
                : 2.5);
            const preListingsNeeded = (financialGoals.captationGoalQty || 0) * captationRatio;
            const weeklyTarget = weeksDuration > 0 ? preListingsNeeded / weeksDuration : 0;

            return {
              goalQty: financialGoals.captationGoalQty || 0,
              startDate: startDate,
              endDate: endDate,
              weeksDuration: weeksDuration,
              weeklyPLTarget: weeklyTarget,
              weeklyPLDone: mcWeeklyPLDone
            };
          })()}
          onNavigateToWeek={() => setView('my-week')}
          onNavigateToCalendar={() => setView('calendar')}
          closingRate={mcClosingRate}
          closingRatioDisplay={mcRatioDisplay}
          isStandardRate={mcIsStandard}
          availableYears={availableYears}
          currentYear={selectedYear}
          onSelectYear={setSelectedYear}
          isHistoricalView={isHistoricalView}
          onToggleHistorical={setIsHistoricalView}
        />;

      case 'objectives':
        // Use memoized data to prevent flickering
        return <ObjectivesDashboard
          key="objectives-dashboard"
          currentBilling={currentTotalBilling}
          currentActivities={currentTotalPLPB}
          currentRatio={historicalRatio}
          pipelineValue={pipelineValue}
          weeksOfData={objectivesData.weeksOfData}
          totalClosings={objectivesData.totalClosings}
          captationStats={objectivesData.captationStats}
          historicalAverageTicket={objectivesData.historicalAverageTicket || financialGoals.averageTicket || 4000}
          properties={properties}
          activities={activities}
          visits={visits}
          onNavigate={handleNavigateCallback}
          financialGoals={financialGoals}
          onUpdateGoals={handleUpdateFinancialGoals}
          onSaveGoals={handleSaveFinancialGoals}
          availableYears={[2024, 2025, 2026, 2027, 2028]}
          currentYear={selectedYear}
          onSelectYear={setSelectedYear}
          isLoading={loadingGoals}
          hasUnsavedChanges={hasUnsavedGoals}
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
          availableYears={availableYears}
          currentYear={selectedYear}
          onSelectYear={setSelectedYear}
        />;

      case 'calendar':
        return <CalendarDashboard
          session={session}
          activities={activities}
          visits={visits}
          googleEvents={googleEvents}
          onEventsChange={setGoogleEvents}
          isGoogleSynced={isGoogleSynced}
          onSyncChange={setIsGoogleSynced}
          googleAccessToken={googleAccessToken}
          onTokenChange={setGoogleAccessToken}
          isCheckingSync={isCheckingGoogleSync}
          targetUserId={(isMother && selectedTeamUser) ? selectedTeamUser : session?.user?.id}
        />;

      // 'habits' is now persistently rendered below


      default: return null;
    }
  };

  const toggleGroup = (group: 'metrics' | 'sellers' | 'buyers' | 'trakeo') => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };



  // --- RENDER LOGIN OR APP ---
  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#E0D8CC] flex-col">
        <Loader2 className="w-16 h-16 text-[#AA895F] animate-spin mb-4" />
        <p className="text-[#364649] font-medium animate-pulse text-lg tracking-wider">Iniciando sistema...</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }



  // Wrap content in ErrorBoundary
  return (
    <ErrorBoundary>
      {/* Welcome Screen */}
      <WelcomeScreen
        isVisible={showWelcome}
        onClose={() => setShowWelcome(false)}
        userName={session?.user?.email || 'Agente'}
      />
      {/* Success Notification */}
      <SuccessNotification
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
      />
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

              <NavItem icon={<LayoutDashboard size={20} />} label="INICIO" active={view === 'home' || view === 'metrics-home'} onClick={() => navigateTo('metrics-home')} />
              <NavItem icon={<PieChart size={20} />} label="Control Negocio" active={view === 'metrics-control'} onClick={() => navigateTo('metrics-control')} />

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
                    <NavItem icon={<CheckCircle2 size={18} />} label="Mis Hábitos" active={view === 'habits'} onClick={() => navigateTo('habits')} small />

                  </div>
                </div>
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
                {view === 'home' || view === 'metrics-home' ? 'Inicio' :
                  view === 'metrics-control' ? 'Control de Negocio' :
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
            {/* Persistent Mount for Habits (Instant Load) */}
            <div style={{ display: view === 'habits' ? 'block' : 'none' }}>
              <HabitTracker
                session={session}
                googleAccessToken={googleAccessToken}
                customUserId={isMother && selectedTeamUser && selectedTeamUser !== 'global' ? selectedTeamUser : undefined}
              />
            </div>

            {/* Conditional Mount for other views */}
            {view !== 'habits' && renderContent()}
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
