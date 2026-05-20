

export const FOOD_CATEGORIES = [
  { id: 'Grocery Stores',      label: 'Grocery Stores', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png' },
  { id: 'Commissary Kitchens',       label: 'Community Kitchens', icon: 'https://cdn-icons-png.flaticon.com/512/10630/10630027.png' },
  { id: 'Kitchen Access',       label: 'Kitchen Access', icon: 'https://cdn-icons-png.flaticon.com/512/2728/2728879.png' },
  { id: 'Community Gardens', label: 'Community Gardens', icon: 'https://cdn-icons-png.flaticon.com/512/628/628324.png' },
  { id: 'Free Meal',        label: 'Free Meals', icon: 'https://cdn-icons-png.flaticon.com/512/6188/6188570.png' },
  { id: 'Low Cost Meal',    label: 'Low-Cost Meals', icon: 'https://cdn-icons-png.flaticon.com/512/1027/1027943.png' },
  { id: 'Supermarkets',      label: 'Supermarkets', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png' },
  { id: 'Specialty Food Stores',      label: 'Specialty Food Stores', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png' },
];

export const FOOD_CATEGORY_IDS = FOOD_CATEGORIES.map(c => c.id);

export const FOOD_CATEGORY_BY_ID = Object.fromEntries(
  FOOD_CATEGORIES.map(c => [c.id, c])
);

export const DEFAULT_FOOD_ICON = 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png';

export function getFoodCategoryIcon(categoryId) {
  return FOOD_CATEGORY_BY_ID[categoryId]?.icon ?? DEFAULT_FOOD_ICON;
}
