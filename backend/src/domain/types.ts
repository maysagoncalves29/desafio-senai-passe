export const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
export type Position = (typeof POSITIONS)[number];

export const CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const FORMATIONS = ['3-1', '2-2', '2-1-1', '1-2-1'] as const;
export type Formation = (typeof FORMATIONS)[number];

export const TRANSACTION_TYPES = ['COMPRA', 'VENDA'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CONTRACT_STATUSES = ['ATIVO', 'ENCERRADO', 'RESCINDIDO'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface Attributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export type AttributeName = keyof Attributes;
