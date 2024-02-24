import { formatDate } from './date';
import { HABIT_COL, HABIT_ROW_END, globalVars } from './globals';
import { getRowNumberOfHabit } from './habits';
import { calculateMomentumForHabit } from './momentum';

// Dates
export const DATE_START_COL_NAME = 'B';
export const DATE_START_COL = 2;

// Habits positions according to the "Input" sheet.
export const HABIT_COL_NAME = 'A';
export const HABIT_ROW_START = 2;

// Habit inputs
const HABIT_DATA_START_COL = 2;
const HABIT_DATA_START_COL_NAME = 'B';

// Attributes according to the "Overview" sheet.
export const ROW_NUMBER_OF_OUTPUT_COLUMN_TITLES = 1;

let ss: GoogleAppsScript.Spreadsheet.Spreadsheet;

let habits;

let hasInitialised = false;

export const habitAttributes = {
  doneStreak: 'Done Streak',
  missedStreak: 'Missed Streak',
  momentum: 'Momentum',
  growthFactor: 'Growth Factor',
  decayFactor: 'Decay Factor',
  status: 'Status',
  updatedAt: 'Updated At',
};

export const habitAttributeCalculationStatus = {
  calculating: 'Calculating…',
  ready: 'Ready',
};

export function initialiser() {
  if (hasInitialised) {
    Logger.log('Already initialised, skipping re-initialisation.');
    return;
  }

  Logger.log('Initialising variables…');

  ss = SpreadsheetApp.getActiveSpreadsheet();
  globalVars.inputSheet = ss.getSheetByName('Input');
  globalVars.overviewSheet = ss.getSheetByName('Overview');
  globalVars.dates = getAllDates(globalVars.inputSheet);
  globalVars.todayIndex = globalVars.dates.indexOf(today());
  habits = generateHabitsObject();

  hasInitialised = true;
}

export function getAllDates(sheet) {
  // Get all data in the first row from column B onwards
  const dataRange = sheet.getRange(1, 2, 1, sheet.getLastColumn() - 1);
  const dateValues = dataRange.getDisplayValues()[0];

  // Trim values and filter out any empty cells
  const dates = dateValues
    .map(function (value) {
      return value.trim();
    })
    .filter(function (value) {
      return value !== ''; // Only keep non-empty values
    });

  return dates;
}

export function today() {
  return formatDate(new Date());
}

export function generateHabitsObject() {
  const habits = {};
  const range = globalVars.inputSheet.getRange(
    `${HABIT_COL_NAME}${HABIT_ROW_START}:${HABIT_COL_NAME}${HABIT_ROW_END}`
  );
  const values = range.getValues();

  values.forEach(function (row, index) {
    const habit = row[0].trim(); // Trim the habit to remove any extra spaces

    if (habit) {
      // Only add non-empty strings
      // Create a valid property key by removing spaces and converting to camelCase
      const key = habit
        .replace(/\s+/g, '')
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
          return index == 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
      habits[key] = habit;
    }
  });

  Logger.log('Generated habits object: ' + JSON.stringify(habits));
  return habits;
}

/**
 * @returns {string|undefined} The name of the column where the targetValue
 * is found, or null if the value is not found.
 */
function findInRow(sheet, rowNumber, targetValue) {
  // Get the range of the entire row
  const rowRange = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  // Get all values in the row as a 2D array
  const values = rowRange.getValues();

  // Iterate through the array to find the target value
  for (let i = 0; i < values[0].length; i++) {
    let cellValue = values[0][i];

    if (cellValue instanceof Date) {
      cellValue = formatDate(cellValue);
    }

    if (cellValue == targetValue) {
      // Return the column number (arrays are 0-indexed, columns are 1-indexed)
      const columnNumber = i + 1;
      const columnName = getColumnNameFromNumber(columnNumber);

      Logger.log(`Found "${targetValue}" => ${columnName}${rowNumber}`);
      return columnName;
    }
  }

  return null;
}

function columnNameToNumber(columnName) {
  let columnNumber = 0;
  for (let i = 0; i < columnName.length; i++) {
    const letter = columnName.toUpperCase().charCodeAt(i) - 64; // Convert letter to number (A=1, B=2, etc.)
    columnNumber = columnNumber * 26 + letter;
  }
  return columnNumber;
}

function setActiveColumn(columnName) {
  const columnNumber = columnNameToNumber(columnName);
  // Sets the first cell in the target column active
  globalVars.inputSheet.setActiveRange(
    globalVars.inputSheet.getRange(1, columnNumber)
  );
  SpreadsheetApp.flush(); // Ensure the UI updates to reflect the change
  Logger.log(`Scrolled to today's column`);
}

export function scrollToToday() {
  initialiser();
  const todaysCell = findInRow(globalVars.inputSheet, 1, today());
  setActiveColumn(todaysCell);
}

function getActiveCellValue() {
  const habit = globalVars.overviewSheet.getActiveCell().getValue();
  Logger.log(`Active cell value: ${habit}`);
}

/**
 * Reads the current value of a habit's attribute.
 */
function readHabitAttributeValue(habit, attribute) {
  const habitRow = findInColumn(globalVars.overviewSheet, HABIT_COL, habit);
  const attributeColumn = findInRow(
    globalVars.overviewSheet,
    ROW_NUMBER_OF_OUTPUT_COLUMN_TITLES,
    attribute
  );
  const cell = attributeColumn + habitRow;
  const value = globalVars.overviewSheet.getRange(cell).getValue();
  Logger.log(`Value for ${habit} : ${attribute} => ${value}`);
}

/**
 * @returns {string} The cell that contains the value of a habit's
 * chosen attribute
 */
function getHabitAttributeCell(habit, attribute) {
  const habitRow = findInColumn(globalVars.overviewSheet, HABIT_COL, habit);
  const attributeColumn = findInRow(
    globalVars.overviewSheet,
    ROW_NUMBER_OF_OUTPUT_COLUMN_TITLES,
    attribute
  );
  const cell = attributeColumn + habitRow;
  Logger.log(`${habit} : ${attribute} : Cell => ${cell}`);

  return cell;
}

/**
 * Recalculates a habit's attribute value and write to cell.
 */
export function refreshHabitAttribute(habit, attribute) {
  let newValue = 0;
  const cell = getHabitAttributeCell(habit, attribute);

  switch (attribute) {
    case habitAttributes.doneStreak:
      newValue = calculateDoneStreak(habit);
      globalVars.overviewSheet.getRange(cell).setValue(newValue);
      break;

    case habitAttributes.missedStreak:
      newValue = calculateMissedStreak(habit);
      globalVars.overviewSheet.getRange(cell).setValue(newValue);
      break;

    case habitAttributes.momentum:
      newValue = calculateMomentumForHabit(habit);
      globalVars.overviewSheet.getRange(cell).setValue(newValue);
      break;

    default:
      console.error('Invalid attribute:', JSON.stringify(attribute));
  }

  Logger.log(`Recalculated value for ${habit} : ${attribute} => ${newValue}`);
  return newValue;
}

export function getHabitAtRow(rowNumber) {
  const cell = globalVars.inputSheet.getRange(rowNumber, HABIT_COL);
  return cell.getValue();
}

export function printHabitAttributeStatus(habit, status) {
  const cell = getHabitAttributeCell(habit, habitAttributes.status);
  globalVars.overviewSheet.getRange(cell).setValue(status);
}

export function printHabitAttributeTimestamp(habit) {
  const cell = getHabitAttributeCell(habit, habitAttributes.updatedAt);
  let now = new Date();
  globalVars.overviewSheet.getRange(cell).setValue(now);
}

function getColumnNameFromNumber(columnNumber) {
  let columnName = '';
  while (columnNumber > 0) {
    const modulo = (columnNumber - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    columnNumber = Math.floor((columnNumber - modulo) / 26);
  }
  return columnName;
}

/**
 * @returns {number|undefined} The number the row where the targetValue
 * is found, or null if the value is not found.
 */
function findInColumn(sheet, columnNumber, targetValue) {
  // Get the range of the entire column
  const columnRange = globalVars.inputSheet.getRange(
    1,
    columnNumber,
    sheet.getLastRow()
  );
  // Get all values in the column as a 2D array
  const values = columnRange.getValues();

  // Iterate through the array to find the target value
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] == targetValue) {
      // Return the row number (arrays are 0-indexed, rows are 1-indexed)
      Logger.log(
        `Found "${targetValue}" => ${getColumnNameFromNumber(columnNumber)}${
          i + 1
        }`
      );
      return i + 1;
    }
  }
}

/**
 * Refreshes (recalculates and writes to cell all attributes
 * for the currently active habit.
 */
export function refreshHabit(habit) {
  initialiser();

  /**
   * If no habit was passed in, we check if the active
   * cell points to a habit.
   */
  if (!habit) {
    habit = globalVars.overviewSheet.getActiveCell().getValue();
  }

  /**
   * If still no, then we don't have a habit
   */
  if (!habit) {
    throw new Error('No habit found or invalid habit');
  }

  printHabitAttributeStatus(habit, habitAttributeCalculationStatus.calculating);

  // Refresh all attribute values.
  refreshHabitAttribute(habit, habitAttributes.doneStreak);
  refreshHabitAttribute(habit, habitAttributes.missedStreak);
  refreshHabitAttribute(habit, habitAttributes.momentum);
  printHabitAttributeTimestamp(habit);

  printHabitAttributeStatus(habit, habitAttributeCalculationStatus.ready);
}

/**
 * Refreshes (recalculates and writes to cell), all attributes
 * for all habits.
 */
export function refreshAllHabits() {
  initialiser();
  const habitsArray = Array.from(Object.values(habits));

  for (let habit of habitsArray) {
    refreshHabit(habit);
  }
}

function calculateMissedStreak(habit) {
  // If today's date is not found, log an error and return
  if (globalVars.todayIndex === -1) {
    Logger.log("Today's date is not found in the sheet");
    return;
  }

  const habitRow = getRowNumberOfHabit(globalVars.overviewSheet, habit);

  let columnIndex = globalVars.todayIndex + 2; // +2 because array is 0-indexed and dates start at column B
  let streak = 0;

  // Special handling for today's column
  let isTodayChecked = globalVars.inputSheet
    .getRange(habitRow, columnIndex)
    .isChecked();
  if (isTodayChecked) {
    return 0;
  }

  // Loop backwards from today's column until the start of the date columns
  for (let i = columnIndex - 1; i >= 2; i--) {
    const isChecked = globalVars.inputSheet.getRange(habitRow, i).isChecked();

    if (!isChecked) {
      // Change condition to check for unchecked boxes
      streak++;
    } else {
      break; // Stop counting when a checked box is found
    }
  }

  return streak;
}

function calculateDoneStreak(habit) {
  // If today's date is not found, log an error and return
  if (globalVars.todayIndex === -1) {
    Logger.log("Today's date is not found in the sheet");
    return;
  }

  const habitRow = getRowNumberOfHabit(globalVars.overviewSheet, habit);

  const columnIndex = globalVars.todayIndex + 2; // +2 because array is 0-indexed and dates start at column B
  let streak = 0;

  // Loop backwards from today's column until the start of the date columns
  for (let i = columnIndex; i >= 2; i--) {
    let isChecked = globalVars.inputSheet.getRange(habitRow, i).isChecked();

    // Special handling for today's column
    if (i === columnIndex && !isChecked) {
      continue; // Don't break the streak, but skip incrementing for today
    }

    if (isChecked) {
      streak++;
    } else {
      break; // Stop counting when an unchecked box is found
    }
  }

  return streak;
}

export function scrollToTodaysDate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const column = 1; // Assuming dates are in column A
  const maxRows = sheet.getMaxRows();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part to ensure comparison works with dates only

  // Get the range of dates in column A
  const dateRange = sheet.getRange(1, column, maxRows).getValues();

  for (let i = 0; i < dateRange.length; i++) {
    const cellDate = new Date(dateRange[i][0]);
    cellDate.setHours(0, 0, 0, 0); // Reset time part for accurate comparison
    if (cellDate.getTime() === today.getTime()) {
      // Set the active range to the cell with today's date
      sheet.setActiveRange(sheet.getRange(i + 1, column));
      SpreadsheetApp.flush(); // Apply changes
      break;
    }
  }
}
