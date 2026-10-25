import { getProgram } from './content.js';

// Week gates follow the active curriculum, so the admin checkpoint view and
// the learner journey always agree on which lessons belong to a week.
export const WEEK_CONCEPTS = Object.fromEntries(
  getProgram().weeks.map((week) => [week.number, week.ids]),
);

export const WEEKS = Object.keys(WEEK_CONCEPTS).map(Number);
