import { create } from 'zustand';
import { BusinessState, FinancialGoals, DEFAULT_GOALS } from './slices/types';
import { createNavigationSlice } from './slices/navigationSlice';
export type { BusinessState, FinancialGoals };
export { DEFAULT_GOALS };
import { createDataSlice } from './slices/dataSlice';
import { createObjectivesSlice } from './slices/objectivesSlice';
import { createCalendarSlice } from './slices/calendarSlice';
import { createAnalysisSlice } from './slices/analysisSlice';
import { createAuthSlice } from './slices/createAuthSlice';

export const useBusinessStore = create<BusinessState>()((...a) => ({
    ...createDataSlice(...a),
    ...createObjectivesSlice(...a),
    ...createCalendarSlice(...a),
    ...createAnalysisSlice(...a),
    ...createAuthSlice(...a),
    ...createNavigationSlice(...a),
}));
