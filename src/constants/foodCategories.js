

export const FOOD_CATEGORIES = [
  { id: 'Grocery Stores',      label: 'Grocery Stores', icon: '/icons/grocerypng.png' },
  { id: 'Commissary Kitchens',       label: 'Community Kitchens', icon: '/icons/assets.png' },
  { id: 'Kitchen Access',       label: 'Kitchen Access', icon: '/icons/kitchen.png' },
  { id: 'Community Gardens', label: 'Community Gardens', icon: '/icons/garden.png' },
  { id: 'Free Meal',        label: 'Free Meals', icon: 'https://cdn-icons-png.flaticon.com/512/6188/6188570.png' },
  { id: 'Low Cost Meal',    label: 'Low-Cost Meals', icon: '/icons/lowcost.png' },
  { id: 'Supermarkets',      label: 'Supermarkets', icon: '/icons/supermarket.png' },
  { id: 'Specialty Food Stores',      label: 'Specialty Food Stores', icon: '/icons/special;.png' },

  // EVEYRTHING BELOW HERE HAD NO PLACEHOLDER ASSET
  { id: 'Community Shared Agriculture (CSA)',      label: 'Community Shared Agriculture', icon: '/icons/agri.png' },
  { id: 'Food Recovery and Waste Prevention',      label: 'Food Recovery and Waste Prevention', icon: '/icons/atom.png' },
  { id: 'Food Shopping and Delivery',              label: 'Food Shopping and Delivery', icon: '/icons/delivery.png' },
  { id: 'Free Food Pantries',                                       label: 'Free Food Pantries', icon: '/icons/pantry.png' },
  { id: 'Free Food Pantries / Community Fridges',                   label: 'Free Food Pantries / Community Fridges', icon: '/icons/fridge.png' },
  { id: 'Free Grocery Items',                                       label: 'Free Grocery Items', icon: '/icons/vegetable.png' },
  { id: 'Indigenous Food Program',                                  label: 'Indigenous Food Program', icon: '/icons/indigenous.png' },
  { id: 'Indigenous Gardens',                                       label: 'Indigenous Gardens', icon: '/icons/indigardens.png' },
  { id: 'Low Cost Grocery and Food Markets',                        label: 'Low Cost Grocery and Food Markets', icon: '/icons/lowcostgrocery.png' },
  { id: 'Neighbourhood Food Networks',                              label: 'Neighbourhood Food Networks', icon: '/icons/neighborhood.png' },
  { id: 'Other Community-based Food Organizations',                 label: 'Other Community-based Food Organizations', icon: '/icons/commuityfood.png' },
  { id: 'Public Markets',                                           label: 'Public Markets', icon: '/icons/public market.png' },
  { id: 'Seed Libraries',                                           label: 'Seed Libraries', icon: '/icons/seed.png' },
  { id: 'Small Cultural Food Business',                             label: 'Small Cultural Food Business', icon: '/icons/glone.png' },
  { id: 'Small Food Stores',                                        label: 'Small Food Stores', icon: '/icons/smallbussines.png' },
  { id: 'Urban Farms',                                              label: 'Urban Farms', icon: '/icons/farm.png' },
  { id: 'Urban Forests',                                            label: 'Urban Forests', icon: '/icons/forest.png' },
  { id: 'Yard Share Programs',                                      label: 'Yard Share Programs', icon: '/icons/yard.png' },
  { id: 'Young Adult Free and low cost meals',                      label: 'Young Adult Free and low cost meals', icon: '/icons/youthlowcost.png' },
  { id: 'Youth Community Kitchens',                                 label: 'Youth Community Kitchens', icon: '/icons/youthcommunityfood.png' },
  { id: 'Youth Free and low cost meals',                            label: 'Youth Free and low cost meals', icon: '/icons/child.png' },
];

export const FOOD_CATEGORY_IDS = FOOD_CATEGORIES.map(c => c.id);

export const FOOD_CATEGORY_BY_ID = Object.fromEntries(
  FOOD_CATEGORIES.map(c => [c.id, c])
);

export const DEFAULT_FOOD_ICON = 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png';

export function getFoodCategoryIcon(categoryId) {
  return FOOD_CATEGORY_BY_ID[categoryId]?.icon ?? DEFAULT_FOOD_ICON;
}
