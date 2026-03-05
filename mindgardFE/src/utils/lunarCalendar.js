import { SolarDate } from 'lunar-date-vn';

/**
 * Returns a formatted Vietnamese Lunar Date string for a given Solar Date.
 * Format: "Âm lịch: Ngày DD tháng MM (Nhuận), năm Can Chi"
 * @param {Date} date - The Solar Date
 * @returns {string}
 */
export const getLunarDateString = (date) => {
    try {
        const solar = new SolarDate(date);
        const lunar = solar.toLunarDate();
        const day = lunar.day;
        const month = lunar.month;
        const yearName = lunar.getYearName();
        const isLeap = lunar.leap_month;

        return `Âm lịch: Ngày ${day} tháng ${month}${isLeap ? ' (Nhuận)' : ''}, năm ${yearName}`;
    } catch (error) {
        console.error("Error calculating lunar date:", error);
        return "";
    }
};
