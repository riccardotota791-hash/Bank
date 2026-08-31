// Categorie predefinite. Vivendo con i genitori, NON esiste alcuna voce
// di affitto/mutuo/bollette di casa: non va mai aggiunta.
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  SAVING: 'saving',
};

export const DEFAULT_CATEGORIES = [
  // Entrate
  { name: 'Stipendio', type: 'income', icon: 'cash-outline', color: '#1E8E5A', monthly_budget: null },
  { name: 'Lavoro autonomo', type: 'income', icon: 'briefcase-outline', color: '#2E9E68', monthly_budget: null },
  { name: 'Regali e bonus', type: 'income', icon: 'gift-outline', color: '#3FAE76', monthly_budget: null },
  { name: 'Altre entrate', type: 'income', icon: 'wallet-outline', color: '#4EBB82', monthly_budget: null },

  // Uscite (mai casa/affitto/mutuo/bollette)
  { name: 'Cibo e spesa', type: 'expense', icon: 'fast-food-outline', color: '#E08E45', monthly_budget: 250 },
  { name: 'Trasporti', type: 'expense', icon: 'car-outline', color: '#2E86AB', monthly_budget: 100 },
  { name: 'Svago', type: 'expense', icon: 'game-controller-outline', color: '#8E5FB0', monthly_budget: 120 },
  { name: 'Abbonamenti', type: 'expense', icon: 'repeat-outline', color: '#C2554F', monthly_budget: 40 },
  { name: 'Salute', type: 'expense', icon: 'medkit-outline', color: '#D6483F', monthly_budget: 60 },
  { name: 'Formazione', type: 'expense', icon: 'school-outline', color: '#2E9E9E', monthly_budget: 60 },
  { name: 'Imprevisti', type: 'expense', icon: 'alert-circle-outline', color: '#C99A2E', monthly_budget: 80 },
  { name: 'Altro', type: 'expense', icon: 'ellipsis-horizontal-circle-outline', color: '#6B7280', monthly_budget: null },

  // Risparmio / investimenti (allocazione del risparmio già calcolato)
  { name: 'Investimenti (ETF/Azioni)', type: 'saving', icon: 'trending-up-outline', color: '#C9A227', monthly_budget: null },
  { name: 'Fondo emergenza', type: 'saving', icon: 'shield-checkmark-outline', color: '#B8901E', monthly_budget: null },
  { name: 'Altro risparmio', type: 'saving', icon: 'save-outline', color: '#A67F19', monthly_budget: null },
];

export const CATEGORY_TYPE_LABELS = {
  income: 'Entrata',
  expense: 'Uscita',
  saving: 'Risparmio/Investimento',
};
