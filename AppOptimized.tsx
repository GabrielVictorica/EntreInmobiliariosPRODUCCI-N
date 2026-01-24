import React, { useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { useBusinessStore } from './store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';

// Components
import SidebarOptimized from './components/layout/SidebarOptimized';
import Header from './components/layout/Header';
import AppRoutes from './AppRoutes';
import Login from './components/auth/Login';
import WelcomeScreen from './components/WelcomeScreen';
import SuccessNotification from './components/SuccessNotification';
import ErrorBoundary from './components/ui/ErrorBoundary';

const AppOptimized = () => {
    // 1. Core State Subscription (Minimally needed for layout)
    const {
        authSession,
        activeView,
        initializeSession,
        signOut,

        // Header Params
        authRole,
        selectedTeamUser,
        teamUsers,
        setContextUser
    } = useBusinessStore(useShallow(state => ({
        authSession: state.authSession,
        activeView: state.activeView,
        initializeSession: state.initializeSession,
        signOut: state.signOut,
        authRole: state.authRole,
        selectedTeamUser: state.selectedTeamUser,
        teamUsers: state.teamUsers,
        setContextUser: state.setContextUser
    })));

    // 2. Auth & Initialization
    useEffect(() => {
        // Initialize System
        initializeSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                initializeSession();
            }
            if (event === 'SIGNED_OUT') {
                signOut();
            }
            if (session?.provider_token && session.user) {
                useBusinessStore.getState().persistGoogleConnection(session);
            }
        });

        return () => subscription.unsubscribe();
    }, [initializeSession, signOut]);

    // 3. Render
    if (!authSession) {
        return <Login />;
    }

    if (activeView === 'welcome') {
        return <WelcomeScreen />;
    }

    const isMother = authRole === 'mother';

    return (
        <ErrorBoundary>
            <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden">
                {/* Decoupled Sidebar - Handles its own state */}
                <SidebarOptimized />

                <div className="flex flex-col flex-1 h-full overflow-hidden relative">
                    <Header
                        view={activeView}
                        isMother={isMother}
                        selectedTeamUser={selectedTeamUser}
                        teamUsers={teamUsers}
                        session={authSession}
                        onLogout={signOut}
                        onSelectTeamUser={(val) => {
                            if (val === 'global') setContextUser(authSession?.user?.id || null, true);
                            else setContextUser(val, false);
                        }}
                    />

                    <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
                        <div className="container mx-auto px-6 py-8 max-w-[1600px] min-h-full">
                            {/* Routes handling Lazy Loading internally */}
                            <AppRoutes />
                        </div>
                    </main>

                    <SuccessNotification />
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default AppOptimized;
