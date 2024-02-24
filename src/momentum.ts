import { TODAY } from './globals';
import { getAllCompletionDataForHabit } from './habits';

export function calculateMomentumForHabit(habit) {
  const MIN_MOMENTUM = 0;
  const MAX_MOMENTUM = 100;

  const completionData = getAllCompletionDataForHabit(habit);

  let doneStreak = 0;
  let missedStreak = 0;
  let momentum = 0;

  for (let { date, isChecked } of completionData) {
    /**
     * In order to prevent counting an "unchecked" today-streak
     * towards a negative momentum.
     */
    if (date === TODAY && !isChecked) {
      continue;
    }

    if (isChecked) {
      missedStreak = 0;
      doneStreak++;

      /**
       * With these values, it takes about 61 consecutive days to reach
       * a momentum of 100.
       */
      if (doneStreak >= 60) {
        momentum = Math.min(MAX_MOMENTUM, momentum + 2.5);
      } else if (doneStreak >= 30) {
        momentum = Math.min(MAX_MOMENTUM, momentum + 2);
      } else if (doneStreak >= 20) {
        momentum = Math.min(MAX_MOMENTUM, momentum + 1.5);
      } else if (doneStreak >= 10) {
        momentum = Math.min(MAX_MOMENTUM, momentum + 1.2);
      } else if (doneStreak > 0) {
        momentum = Math.min(MAX_MOMENTUM, momentum + 1);
      } else {
        throw new Error('Done streak out of range.');
      }
    } else {
      doneStreak = 0;
      missedStreak++;

      if (missedStreak >= 10) {
        momentum = Math.max(MIN_MOMENTUM, momentum - 4);
      } else if (missedStreak >= 7) {
        momentum = Math.max(MIN_MOMENTUM, momentum - 3);
      } else if (missedStreak >= 3) {
        momentum = Math.max(MIN_MOMENTUM, momentum - 2);
      } else if (missedStreak > 0) {
        momentum = Math.max(MIN_MOMENTUM, momentum - 1);
      } else {
        throw new Error('Missed streak out of range.');
      }
    }
  }

  Logger.log(`${habit} : Momentum => ${momentum}`);
  return momentum;
}
