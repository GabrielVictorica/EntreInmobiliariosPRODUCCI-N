import { differenceInWeeks, parseISO, isValid } from 'date-fns';

/**
 * Calculates the number of weeks between two dates.
 * Returns at least 1 week to avoid division by zero.
 * 
 * @param start ISO date string (YYYY-MM-DD)
 * @param end ISO date string (YYYY-MM-DD)
 * @returns number of weeks (minimum 1)
 */
export const calculateWeeks = (start: string, end: string): number => {
    try {
        const startDate = parseISO(start);
        const endDate = parseISO(end);

        if (!isValid(startDate) || !isValid(endDate)) return 4;

        const diff = differenceInWeeks(endDate, startDate);
        return Math.max(diff, 1);
    } catch (e) {
        console.error("[dateUtils] Error calculating weeks:", e);
        return 4;
    }
};
