import quotes from '../data/quotes.json';
import categories from '../data/categories.json';
import { getStoredValue, setStoredValue } from './storage';
import { QuoteCategory, QuoteCategoryConfig, QuoteCategoryID, QuoteOrVerse } from './types';

const lastSelectedDateKey = 'lastSelectedDate';
const currentDailyIDsKey = 'currentDailyIDs';
const currentDailyCategoryKey = 'currentDailyCategory';

function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pickRandom(items: QuoteOrVerse[]): QuoteOrVerse {
  return items[Math.floor(Math.random() * items.length)];
}

export class DataRepository {
  private readonly allQuotes = quotes as QuoteOrVerse[];
  private readonly categoryConfigs = categories as QuoteCategoryConfig[];
  private readonly quotesByID = new Map<number, QuoteOrVerse>();
  private readonly categoriesByName = new Map<QuoteCategory, QuoteCategoryConfig>();
  private readonly categoriesByID = new Map<QuoteCategoryID, QuoteCategoryConfig>();
  private readonly quotesByCategory = new Map<QuoteCategory, QuoteOrVerse[]>();
  private readonly quotesByCategoryID = new Map<QuoteCategoryID, QuoteOrVerse[]>();

  constructor() {
    this.categoryConfigs.forEach((categoryConfig) => {
      this.categoriesByName.set(categoryConfig.category, categoryConfig);
      this.categoriesByID.set(categoryConfig.id, categoryConfig);
      this.quotesByCategory.set(categoryConfig.category, []);
      this.quotesByCategoryID.set(categoryConfig.id, []);
    });

    this.allQuotes.forEach((quote) => {
      this.quotesByID.set(quote.id, quote);
      this.quotesByCategory.get(quote.category)?.push(quote);
      this.quotesByCategoryID.get(quote.categoryID)?.push(quote);
    });
  }

  loadQuotes(): QuoteOrVerse[] {
    return this.allQuotes;
  }

  loadCategories(): QuoteCategoryConfig[] {
    return this.categoryConfigs;
  }

  getCategoryConfig(category: QuoteCategory): QuoteCategoryConfig | undefined {
    return this.categoriesByName.get(category);
  }

  getCategoryConfigByID(categoryID: QuoteCategoryID): QuoteCategoryConfig | undefined {
    return this.categoriesByID.get(categoryID);
  }

  getByID(id: number): QuoteOrVerse | undefined {
    return this.quotesByID.get(id);
  }

  getByCategory(category: QuoteCategory): QuoteOrVerse[] {
    return this.quotesByCategory.get(category) ?? [];
  }

  getByCategoryID(categoryID: QuoteCategoryID): QuoteOrVerse[] {
    return this.quotesByCategoryID.get(categoryID) ?? [];
  }

  private parseStoredIDs(storedIDsValue: string | null): Partial<Record<QuoteCategory, number>> {
    if (!storedIDsValue) {
      return {};
    }

    try {
      return JSON.parse(storedIDsValue) as Partial<Record<QuoteCategory, number>>;
    } catch {
      return {};
    }
  }

  async getDailySelection(category: QuoteCategory): Promise<QuoteOrVerse> {
    const categoryItems = this.getByCategory(category);
    if (categoryItems.length === 0) {
      throw new Error(`No quotes found for category: ${category}`);
    }

    const storedDate = await getStoredValue(lastSelectedDateKey);
    const storedIDsValue = await getStoredValue(currentDailyIDsKey);
    const storedIDs = this.parseStoredIDs(storedIDsValue);
    const currentDay = todayKey();

    if (storedDate === currentDay) {
      const cachedID = storedIDs[category];
      const cachedItem = typeof cachedID === 'number' ? this.getByID(cachedID) : undefined;
      if (cachedItem?.category === category) {
        return cachedItem;
      }
    }

    const nextIDs = storedDate === currentDay ? storedIDs : {};
    const nextSelection = pickRandom(categoryItems);
    nextIDs[category] = nextSelection.id;

    await setStoredValue(lastSelectedDateKey, currentDay);
    await setStoredValue(currentDailyIDsKey, JSON.stringify(nextIDs));

    return nextSelection;
  }

  async getDailySelectionForCategories(selectedCategories: QuoteCategory[]): Promise<QuoteOrVerse> {
    const enabledCategories = selectedCategories.filter((category) => this.getByCategory(category).length > 0);
    const fallbackCategories = enabledCategories.length > 0 ? enabledCategories : ['Meditation' as QuoteCategory];
    const storedDate = await getStoredValue(lastSelectedDateKey);
    const storedCategory = await getStoredValue(currentDailyCategoryKey) as QuoteCategory | null;
    const currentDay = todayKey();

    if (storedDate === currentDay && storedCategory && fallbackCategories.includes(storedCategory)) {
      return this.getDailySelection(storedCategory);
    }

    const nextCategory = fallbackCategories[Math.floor(Math.random() * fallbackCategories.length)];
    await setStoredValue(currentDailyCategoryKey, nextCategory);
    return this.getDailySelection(nextCategory);
  }
}

export const dataRepository = new DataRepository();
