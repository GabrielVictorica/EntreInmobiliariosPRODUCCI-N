import { StateCreator } from 'zustand';
import { supabase } from '../../services/supabaseClient';
import { BusinessState } from './types';
import { User, Session } from '@supabase/supabase-js';

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'authorized' | 'ready' | 'error';
export type UserRole = 'mother' | 'agent' | null;

export interface AuthSlice {
    authSession: Session | null;
    authUser: User | null;
    authRole: UserRole;
    authStatus: AuthStatus;
    authError: string | null;

    // Actions
    initializeSession: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const createAuthSlice: StateCreator<BusinessState, [], [], AuthSlice> = (set, get) => ({
    authSession: null,
    authUser: null,
    authRole: null,
    authStatus: 'idle',
    authError: null,

    initializeSession: async () => {
        const { setContextUser, setTeamUsers, authStatus, authUser } = get();

        // 0. GUARD: Prevent flickering loops
        if (authStatus === 'checking') {
            console.log("[AuthSlice] Already booting. Ignoring duplicate call.");
            return;
        }

        // 1. BOOT: Start
        // If we are already ready, we might want to just silent-validate, but for now, let's trust the "ready" state
        // unless this is an explicit re-init (which would require resetting status first outside this function if forced)
        if (authStatus === 'ready' && authUser) {
            console.log("[AuthSlice] Already READY. Skipping boot.");
            return;
        }

        set({ authStatus: 'checking', authError: null, isSystemInitializing: true, isAuthChecking: true });
        console.log("[AuthSlice] 1. BOOT STARTED");

        try {
            // 2. AUTH CHECK: Validate Supabase Session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;
            if (!session?.user) {
                console.log("[AuthSlice] No session found. Redirecting to Login.");
                set({ authStatus: 'idle', authUser: null, authSession: null, isAuthChecking: false, isSystemInitializing: false });
                return;
            }

            console.log("[AuthSlice] 2. AUTHENTICATED", session.user.id);
            set({ authStatus: 'authenticated', authUser: session.user, authSession: session });

            // 3. ROLE CHECK: Fetch "mother" status strictly
            const checkRole = async (uid: string) => {
                // Enterprise-grade resilience: Don't assume anything. Check clean.
                try {
                    const { data, error } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', uid)
                        .maybeSingle();

                    if (error) {
                        console.warn("[AuthSlice] Role check warning:", error.message);
                        return 'agent'; // Fail-safe default
                    }
                    return data?.role === 'mother' ? 'mother' : 'agent';
                } catch (e) {
                    console.error("[AuthSlice] Role check crashed:", e);
                    return 'agent'; // Fail-safe default
                }
            };

            const role = await checkRole(session.user.id);
            console.log("[AuthSlice] 3. AUTHORIZED as:", role);
            set({ authRole: role, authStatus: 'authorized' });

            // 4. TEAM FETCH (for Mothers)
            if (role === 'mother') {
                const { data: team } = await supabase.from('user_roles').select('user_id,email').eq('role', 'child');
                if (team) setTeamUsers(team);
            }

            // 5. CONTEXT SETUP: Configure Target ID & Permissions
            const storedTeamUser = localStorage.getItem('selectedTeamUser');
            let initialUid = session.user.id;
            let initialIsGlobal = false;

            if (role === 'mother') {
                if (storedTeamUser === 'global' || !storedTeamUser) {
                    initialIsGlobal = true;
                } else {
                    initialUid = storedTeamUser;
                    initialIsGlobal = false;
                }
            }

            // Centralized Context Logic
            await setContextUser(initialUid, initialIsGlobal);

            // 6. INITIALIZE GOOGLE (Non-blocking)
            get().initializeGoogleSync(session);

            console.log("[AuthSlice] 5. READY");
            set({ authStatus: 'ready', isSystemInitializing: false, isAuthChecking: false });

        } catch (err: any) {
            console.error("[AuthSlice] FATAL INIT ERROR:", err);
            set({
                authStatus: 'error',
                authError: err.message || "Error crítico de inicialización",
                isSystemInitializing: false,
                isAuthChecking: false
            });
            // Auto-recovery: If it's a 401/403, maybe sign out?
            if (err?.code === 'PGRST301' || err?.status === 401) {
                await get().signOut();
            }
        }
    },

    signOut: async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) { console.error(e); }
        set({
            authSession: null,
            authUser: null,
            authRole: null,
            authStatus: 'idle',
            targetUserId: null,
            selectedTeamUser: null,
            isGlobalView: false,
            teamUsers: [],
            closings: [], // Clear sensitive data
            clients: [],
            // Resetting other data handled by page reload usually
        });
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        window.location.href = '/';
    }
});
