import { HABIT_COL, HABIT_ROW_END, globalVars } from './globals';

export function getAllCompletionDataForHabit(habit) {
  const row = getRowNumberOfHabit(globalVars.inputSheet, habit);

  const completionData = [];

  // Since array's start from 0 and the data starts from the 2nd column.
  const offset = 2;

  for (let i = 2; i <= globalVars.todayIndex + offset; i++) {
    const date = globalVars.dates[i - 2];
    const isChecked = globalVars.inputSheet.getRange(row, i).isChecked();

    const data = {
      date,
      isChecked,
    };

    completionData.push(data);
  }

  return completionData;
}

export function getRowNumberOfHabit(sheet, habit) {
  const startingRow = 1;
  const range = sheet.getRange(startingRow, HABIT_COL, HABIT_ROW_END, 1);
  const values = range.getValues();

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === habit) {
      return i + 1; // +1 because array is 0-indexed and rows are 1-indexed
    }
  }

  return null;
}
