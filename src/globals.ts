import { formatDate } from './date';

export const TODAY = formatDate(new Date());

export const HABIT_COL = 1;
export const HABIT_ROW_END = 102;

interface GlobalVars {
  inputSheet?: GoogleAppsScript.Spreadsheet.Sheet;
  overviewSheet?: GoogleAppsScript.Spreadsheet.Sheet;
  dates?: string[];
  todayIndex?: number;
}

export const globalVars: GlobalVars = {
  inputSheet: null,
  overviewSheet: null,
  dates: null,
  todayIndex: null,
};
