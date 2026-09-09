import Dexie, { type EntityTable } from 'dexie'

export type MacroSource = 'usda' | 'estimated' | 'manual'

export interface PantryItem {
  id: string
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
  source: MacroSource
  createdAt: number
}

export interface ComboLine {
  pantryItemId: string
  quantity: number
}

export interface Combo {
  id: string
  name: string
  lines: ComboLine[]
  createdAt: number
}

export type LogSourceType = 'item' | 'combo'

export interface LogEntry {
  id: string
  timestamp: number
  sourceType: LogSourceType
  sourceId: string
  name: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface SplitDay {
  id: string
  name: string
  order: number
  createdAt: number
}

export interface Exercise {
  id: string
  splitDayId: string
  name: string
  order: number
  createdAt: number
}

export interface WorkoutSession {
  id: string
  splitDayId: string
  splitDayName: string
  timestamp: number
}

export interface SetEntry {
  id: string
  sessionId: string
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  order: number
  createdAt: number
}

export const db = new Dexie('gym-app') as Dexie & {
  pantryItems: EntityTable<PantryItem, 'id'>
  combos: EntityTable<Combo, 'id'>
  logEntries: EntityTable<LogEntry, 'id'>
  splitDays: EntityTable<SplitDay, 'id'>
  exercises: EntityTable<Exercise, 'id'>
  workoutSessions: EntityTable<WorkoutSession, 'id'>
  setEntries: EntityTable<SetEntry, 'id'>
}

db.version(1).stores({
  pantryItems: 'id, name, createdAt',
  combos: 'id, name, createdAt',
  logEntries: 'id, timestamp, sourceType, sourceId',
  splitDays: 'id, order, createdAt',
  exercises: 'id, splitDayId, order, createdAt',
  workoutSessions: 'id, splitDayId, timestamp',
  setEntries: 'id, sessionId, exerciseId, order',
})

export function newId(): string {
  return crypto.randomUUID()
}
