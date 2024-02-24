import {
  DATE_START_COL,
  getHabitAtRow,
  initialiser,
  refreshHabit,
  scrollToToday,
} from './helpers';

initialiser();

function onOpen() {
  initialiser();

  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Habit Tracker')
    .addItem('Refresh all habits', 'refreshAllHabits')
    .addItem('Refresh habit', 'refreshHabit')
    .addToUi();

  scrollToToday();
}

function onEdit(e) {
  initialiser();

  // e is the event object; it contains information about the edit
  Logger.log('Event object: ' + JSON.stringify(e, undefined, 2));

  const row = e.range.rowStart;
  const targetedHabit = getHabitAtRow(row);

  const range = e.range; // The range that was edited
  const sheet = range.getSheet();
  const sheetName = sheet.getName();

  // Check if the edit was made in the "Input" sheet and if the edited range is a checkbox
  // This means a habit was marked as done or not done.
  if (
    sheetName === 'Input' &&
    range.getColumn() >= DATE_START_COL &&
    range.isChecked() !== null
  ) {
    Logger.log(
      `Status => ${
        range.isChecked() ? 'Checked' : 'Unchecked'
      }. Recalculating attributes for ${targetedHabit}.`
    );
    refreshHabit(targetedHabit);
  }
}
