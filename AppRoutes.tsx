import React, { Suspense, useMemo } from 'react';
import { useBusinessStore } from '../store/useBusinessStore';
import { useShallow } from 'zustand/react/shallow';
import LoadingSkeleton from './ui/LoadingSkeleton';

// Lazy Load Heavy Components
const DashboardHome = React.lazy(() => import('./home/DashboardHome'));
const SellersDashboard = React.lazy(() => import('./sellers/SellersDashboard'));
const ClientForm = React.lazy(() => import('./sellers/SellerForm'));
const PropertyDashboard = React.lazy(() => import('./sellers/PropertyDashboard'));
const PropertyForm = React.lazy(() => import('./sellers/PropertyForm'));
const BuyerClientDashboard = React.lazy(() => import('./buyers/BuyerClientDashboard'));
const BuyerClientForm = React.lazy(() => import('./buyers/BuyerClientForm'));
const BuyerSearchDashboard = React.lazy(() => import('./buyers/BuyerSearchDashboard'));
const BuyerSearchForm = React.lazy(() => import('./buyers/BuyerSearchForm'));
const VisitDashboard = React.lazy(() => import('./buyers/VisitDashboard'));
const VisitForm = React.lazy(() => import('./buyers/VisitForm'));
const WeeklyDashboard = React.lazy(() => import('./tracking/WeeklyDashboard'));
const ClosingsDashboard = React.lazy(() => import('./tracking/ClosingsDashboard'));
const ObjectivesDashboard = React.lazy(() => import('./tracking/ObjectivesDashboard'));
const HabitTracker = React.lazy(() => import('./habits/HabitTracker'));
const CalendarDashboard = React.lazy(() => import('./tracking/CalendarDashboard'));
const MetricsWrapper = React.lazy(() => import('./tracking/MetricsWrapper'));
const BusinessControl = React.lazy(() => import('./tracking/BusinessControl'));

// Loading Fallback
const PageLoader = () => (
    <div className="h-full w-full flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#364649]"></div>
    </div>
);

const AppRoutes = () => {
    const {
        activeView,
        viewParams,
        navigateTo,
        returnTo,
        setReturnTo,
        authSession
    } = useBusinessStore(useShallow(state => ({
        activeView: state.activeView,
        viewParams: state.viewParams,
        navigateTo: state.navigateTo,
        returnTo: state.returnTo,
        setReturnTo: state.setReturnTo,
        authSession: state.authSession
    })));

    // Generic Return Handler
    const handleReturnTo = () => {
        if (returnTo) {
            const { view: retView, params: retParams } = returnTo;
            setReturnTo(null);
            navigateTo(retView, { ...retParams, isReturning: true });
        } else {
            // Default fallbacks based on current view context
            if (activeView === 'form') navigateTo('dashboard');
            else if (activeView === 'property-form') navigateTo('properties-list');
            else if (activeView.includes('buyer')) navigateTo('buyer-clients-list');
            else if (activeView.includes('visit')) navigateTo('visits-list');
            else navigateTo('metrics-home');
        }
    };

    // Derived Nav Helpers
    const onNewSeller = () => navigateTo('form');
    const onEditClient = (id: string) => navigateTo('form', { editingClientId: id });
    const onAssignProperty = (id: string) => navigateTo('property-form', { preSelectedClientId: id });
    const onEditProperty = (id: string) => navigateTo('property-form', { editingPropertyId: id });
    const onNewProperty = () => navigateTo('property-form');

    const onNewBuyer = () => navigateTo('buyer-client-form');
    const onEditBuyer = (id: string) => navigateTo('buyer-client-form', { editingBuyerClientId: id });
    const onCreateSearch = (id: string) => navigateTo('buyer-search-form', { preSelectedBuyerClientId: id });
    const onNewSearch = () => navigateTo('buyer-search-form');
    const onEditSearch = (id: string) => navigateTo('buyer-search-form', { editingSearchId: id });
    const onNewVisit = () => navigateTo('visit-form');
    const onEditVisit = (id: string) => navigateTo('visit-form', { editingVisitId: id });

    return (
        <Suspense fallback={<PageLoader />}>
            {activeView === 'metrics-home' && <DashboardHome />}

            {activeView === 'metrics-control' && <BusinessControl />}

            {activeView === 'dashboard' && (
                <SellersDashboard
                    onNewSeller={onNewSeller}
                    onEditClient={onEditClient}
                    onAssignProperty={onAssignProperty}
                    onEditProperty={onEditProperty}
                />
            )}

            {activeView === 'form' && (
                <ClientForm
                    editingClientId={viewParams?.editingClientId}
                    onClose={handleReturnTo}
                />
            )}

            {activeView === 'properties-list' && (
                <PropertyDashboard
                    onNewProperty={onNewProperty}
                    onEditProperty={onEditProperty}
                />
            )}

            {activeView === 'property-form' && (
                <PropertyForm
                    editingPropertyId={viewParams?.editingPropertyId}
                    preSelectedClientId={viewParams?.preSelectedClientId}
                    onClose={handleReturnTo}
                />
            )}

            {activeView === 'buyer-clients-list' && (
                <BuyerClientDashboard
                    onNewBuyer={onNewBuyer}
                    onEditBuyer={onEditBuyer}
                    onCreateSearch={onCreateSearch}
                />
            )}

            {activeView === 'buyer-client-form' && (
                <BuyerClientForm
                    editingClientId={viewParams?.editingBuyerClientId}
                    onClose={handleReturnTo}
                />
            )}

            {activeView === 'buyer-searches-list' && (
                <BuyerSearchDashboard
                    onNewSearch={onNewSearch}
                    onEditSearch={onEditSearch}
                />
            )}

            {activeView === 'buyer-search-form' && (
                <BuyerSearchForm
                    editingSearchId={viewParams?.editingSearchId}
                    preSelectedBuyerClientId={viewParams?.preSelectedBuyerClientId}
                    onClose={handleReturnTo}
                />
            )}
            {activeView === 'visits-list' && (
                <VisitDashboard
                    onNewVisit={onNewVisit}
                    onEditVisit={onEditVisit}
                />
            )}

            {activeView === 'visit-form' && (
                <VisitForm
                    editingVisitId={viewParams?.editingVisitId}
                    onClose={handleReturnTo}
                />
            )}

            {activeView === 'my-week' && <WeeklyDashboard />}

            {activeView === 'closings' && <ClosingsDashboard />}

            {activeView === 'objectives' && <ObjectivesDashboard />}

            {activeView === 'habits' && (
                <HabitTracker
                    session={authSession}
                    isActive={true}
                />
            )}

            {activeView === 'calendar' && <CalendarDashboard />}
        </Suspense>
    );
};

export default React.memo(AppRoutes);
