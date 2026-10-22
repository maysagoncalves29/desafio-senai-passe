import type { Condition, Formation, Position } from '@/lib/domain';

export interface Player {
  id: number;
  name: string;
  position: Position;
  agility: number;
  age: number;
  condition: Condition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

export interface PlayerPage {
  data: Player[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
}

export interface Contract {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface SquadPlayer extends Player {
  contract: Contract | null;
}

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ClubDetail extends Club {
  players: SquadPlayer[];
}

export interface Transaction {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: 'COMPRA' | 'VENDA';
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface TransactionSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface TransactionHistory {
  data: Transaction[];
  summary: TransactionSummary;
}

export interface PurchaseResult extends Transaction {
  contract: { purchase_value: number; loyalty_until: string; status: string };
  club_cash: number;
}

export interface SaleResult extends Transaction {
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: 'ENCERRADO' | 'RESCINDIDO';
  club_cash: number;
}

export interface Lineup {
  club_id: number;
  formation: Formation | null;
  complete: boolean;
  players: Player[];
}

export interface MatchSide {
  club_id: number;
  club_name: string;
  formation: Formation;
  goals: number;
}

export interface DuelParticipant {
  player_id: number;
  player_name: string;
  position: Position;
  condition: Condition;
  attribute: 'shooting' | 'passing' | 'dribbling' | 'defending';
  value: number;
}

export interface Duel {
  order: number;
  attacking_club_id: number;
  attacker: DuelParticipant;
  defender: DuelParticipant;
  goal: boolean;
}

export interface Match {
  id: number;
  played_at: string;
  home: MatchSide;
  away: MatchSide;
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
}

export interface MatchDetail extends Match {
  duels: Duel[];
}

export interface Standing {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}
