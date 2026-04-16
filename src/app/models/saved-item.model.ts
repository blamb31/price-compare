import { CompareItem } from './compare-item.model';

export interface SavedItem extends CompareItem {
  name: string;
  store: string;
  brand: string;
  date: string;
}
