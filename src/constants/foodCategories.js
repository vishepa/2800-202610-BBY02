

export const FOOD_CATEGORIES = [
  { id: 'Grocery Stores',      label: 'Grocery Stores', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png' },
  { id: 'Commissary Kitchens',       label: 'Community Kitchens', icon: 'https://cdn-icons-png.flaticon.com/512/10630/10630027.png' },
  { id: 'Kitchen Access',       label: 'Kitchen Access', icon: 'https://cdn-icons-png.flaticon.com/512/2728/2728879.png' },
  { id: 'Community Gardens', label: 'Community Gardens', icon: 'https://cdn-icons-png.flaticon.com/512/628/628324.png' },
  { id: 'Free Meal',        label: 'Free Meals', icon: 'https://cdn-icons-png.flaticon.com/512/6188/6188570.png' },
  { id: 'Low Cost Meal',    label: 'Low-Cost Meals', icon: 'https://cdn-icons-png.flaticon.com/512/1027/1027943.png' },
  { id: 'Supermarkets',      label: 'Supermarkets', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png' },
  { id: 'Specialty Food Stores',      label: 'Specialty Food Stores', icon: 'https://cdn-icons-png.flaticon.com/512/3724/3724788.png' },

  // EVEYRTHING BELOW HERE HAD NO PLACEHOLDER ASSET
  { id: 'Community Shared Agriculture (CSA)',      label: 'Community Shared Agriculture', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Food Recovery and Waste Prevention',      label: 'Food Recovery and Waste Prevention', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Food Shopping and Delivery',              label: 'Food Shopping and Delivery', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Free Food Pantries',                                       label: 'Free Food Pantries', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Free Food Pantries / Community Fridges',                   label: 'Free Food Pantries / Community Fridges', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Free Grocery Items',                                       label: 'Free Grocery Items', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Indigenous Food Program',                                  label: 'Indigenous Food Program', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Indigenous Gardens',                                       label: 'Indigenous Gardens', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Low Cost Grocery and Food Markets',                        label: 'Low Cost Grocery and Food Markets', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Neighbourhood Food Networks',                              label: 'Neighbourhood Food Networks', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Other Community-based Food Organizations',                 label: 'Other Community-based Food Organizations', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Public Markets',                                           label: 'Public Markets', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Seed Libraries',                                           label: 'Seed Libraries', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Small Cultural Food Business',                             label: 'Small Cultural Food Business', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Small Food Stores',                                        label: 'Small Food Stores', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Urban Farms',                                              label: 'Urban Farms', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Urban Forests',                                            label: 'Urban Forests', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Yard Share Programs',                                      label: 'Yard Share Programs', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Young Adult Free and low cost meals',                      label: 'Young Adult Free and low cost meals', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Youth Community Kitchens',                                 label: 'Youth Community Kitchens', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
  { id: 'Youth Free and low cost meals',                            label: 'Youth Free and low cost meals', icon: 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png' },
];

export const FOOD_CATEGORY_IDS = FOOD_CATEGORIES.map(c => c.id);

export const FOOD_CATEGORY_BY_ID = Object.fromEntries(
  FOOD_CATEGORIES.map(c => [c.id, c])
);

export const DEFAULT_FOOD_ICON = 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png';

export function getFoodCategoryIcon(categoryId) {
  return FOOD_CATEGORY_BY_ID[categoryId]?.icon ?? DEFAULT_FOOD_ICON;
}
