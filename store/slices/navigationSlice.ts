import { StateCreator } from 'zustand';
import { BusinessState } from './types';

export interface NavigationSlice {
    activeView: string;
    viewParams: any;
    returnTo: { view: string, params?: any } | null;

    // Actions
    navigateTo: (view: string, params?: any) => void;
    setReturnTo: (returnTo: { view: string, params?: any } | null) => void;
}

export const createNavigationSlice: StateCreator<BusinessState, [], [], NavigationSlice> = (set, get) => ({
    activeView: 'metrics-home', // Default view
    viewParams: null,
    returnTo: null,

    navigateTo: (newView, params) => {
        console.log(`[Navigation] Navigating to: ${newView}`, params);

        // Handle ReturnTo Logic
        if (params?.returnTo) {
            set({ returnTo: { view: params.returnTo, params: params.returnParams } });
        } else if (!params?.isReturning) {
            // Clear return path if navigating to a main section
            if (['home', 'dashboard', 'buyer-clients-list', 'my-week', 'metrics-home'].includes(newView)) {
                set({ returnTo: null });
            }
        }

        set({
            activeView: newView,
            viewParams: params || null
        });
    },

    setReturnTo: (returnTo) => set({ returnTo }),
});
