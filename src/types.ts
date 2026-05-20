export type QuoteCategory = 'Meditation' | 'Bible' | 'Quote';
export type QuoteCategoryID = 'meditation' | 'bible' | 'quote';

export type QuoteCategoryConfig = {
  id: QuoteCategoryID;
  category: QuoteCategory;
  label: string;
  audioFolder: string;
  defaultAmbientAudioFileName: string;
  defaultAmbientAudioPath: string;
};

export type QuoteOrVerse = {
  id: number;
  text: string;
  referenceOrAuthor: string;
  category: QuoteCategory;
  categoryID: QuoteCategoryID;
  voiceAudioFileName: string;
  voiceAudioPath: string;
  ambientAudioFileName: string;
  ambientAudioPath: string;
};

export const categoryLabels: Record<QuoteCategory, string> = {
  Meditation: 'Meditation',
  Bible: 'Bible Verses',
  Quote: 'Daily Quotes',
};
