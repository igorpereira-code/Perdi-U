import {
  Backpack,
  BookOpen,
  CupSoda,
  IdCard,
  KeyRound,
  Package,
  Shirt,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electrónicos: Smartphone,
  'Mochilas y bolsos': Backpack,
  'Ropa y accesorios': Shirt,
  Llaves: KeyRound,
  'Botellas y termos': CupSoda,
  'Útiles y libros': BookOpen,
  'Documentos y carnets': IdCard,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Package;
}
