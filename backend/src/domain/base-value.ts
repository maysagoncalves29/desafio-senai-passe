import { roundDiv, type Cents } from './money.js';

const MIN_BASE_VALUE: Cents = 100;
const YOUNG_PROMISE_MAX_AGE = 21;

interface OverallBracket {
  from: number;
  to: number;
  centsPerPoint: Cents;
}

const OVERALL_BRACKETS: OverallBracket[] = [
  { from: 40, to: 60, centsPerPoint: 50 },
  { from: 60, to: 75, centsPerPoint: 200 },
  { from: 75, to: 99, centsPerPoint: 600 },
];

function overallPart(overall: number): Cents {
  return OVERALL_BRACKETS.reduce((total, bracket) => {
    const pointsInBracket = Math.max(0, Math.min(overall, bracket.to) - bracket.from);
    return total + pointsInBracket * bracket.centsPerPoint;
  }, 0);
}

export interface BaseValueInput {
  overall: number;
  potential: number;
  age: number;
}

export function calculateBaseValue({ overall, potential, age }: BaseValueInput): Cents {
  const part = overallPart(overall);
  const value =
    age <= YOUNG_PROMISE_MAX_AGE ? roundDiv(part * (100 + potential - overall), 100) : part;
  return Math.max(value, MIN_BASE_VALUE);
}
