import { CCNA_TOTAL_LESSONS, WATER_GOAL_ML } from './schedule';
import { computeBestReadingStreak, countActivityDone, sumActivityValue } from './stats';
import { DailyRecord } from './types';

interface AchievementContext {
  records: Record<string, DailyRecord>;
  ccnaProgress: number;
  bestReadingStreak: number;
}

export interface AchievementDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

export interface Achievement extends AchievementDef {
  unlocked: boolean;
}

/** Elenco dei traguardi sbloccabili mostrati nella Tab Statistiche. */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'steps-100k',
    label: '100k Passi Totali',
    description: 'Somma 100.000 passi camminati in totale.',
    icon: 'walk-outline',
    isUnlocked: (ctx) => sumActivityValue(ctx.records, 'walking') >= 100000,
  },
  {
    id: 'ccna-10',
    label: '10 Lezioni CCNA',
    description: 'Completa 10 videolezioni del corso CCNA.',
    icon: 'server-outline',
    isUnlocked: (ctx) => ctx.ccnaProgress >= 10,
  },
  {
    id: 'ccna-complete',
    label: 'Corso CCNA Completato',
    description: `Completa tutte le ${CCNA_TOTAL_LESSONS} videolezioni.`,
    icon: 'ribbon-outline',
    isUnlocked: (ctx) => ctx.ccnaProgress >= CCNA_TOTAL_LESSONS,
  },
  {
    id: 'reading-streak-7',
    label: 'Streak Lettura 7 Giorni',
    description: 'Leggi per 7 giorni consecutivi.',
    icon: 'book-outline',
    isUnlocked: (ctx) => ctx.bestReadingStreak >= 7,
  },
  {
    id: 'reading-streak-30',
    label: 'Streak Lettura 30 Giorni',
    description: 'Leggi per 30 giorni consecutivi.',
    icon: 'flame-outline',
    isUnlocked: (ctx) => ctx.bestReadingStreak >= 30,
  },
  {
    id: 'weights-50',
    label: '50 Sessioni Sala Pesi',
    description: 'Completa 50 sessioni in sala pesi.',
    icon: 'barbell-outline',
    isUnlocked: (ctx) => countActivityDone(ctx.records, 'weights') >= 50,
  },
  {
    id: 'water-30',
    label: '30 Giorni Idratato',
    description: `Raggiungi l'obiettivo dei ${WATER_GOAL_ML / 1000} litri d'acqua per 30 giorni.`,
    icon: 'water-outline',
    isUnlocked: (ctx) => countActivityDone(ctx.records, 'water') >= 30,
  },
  {
    id: 'pages-10k',
    label: '10.000 Pagine Lette',
    description: 'Somma 10.000 pagine lette in totale.',
    icon: 'library-outline',
    isUnlocked: (ctx) => sumActivityValue(ctx.records, 'reading') >= 10000,
  },
];

export function evaluateAchievements(
  records: Record<string, DailyRecord>,
  ccnaProgress: number
): Achievement[] {
  const ctx: AchievementContext = {
    records,
    ccnaProgress,
    bestReadingStreak: computeBestReadingStreak(records),
  };
  return ACHIEVEMENTS.map((def) => ({ ...def, unlocked: def.isUnlocked(ctx) }));
}
