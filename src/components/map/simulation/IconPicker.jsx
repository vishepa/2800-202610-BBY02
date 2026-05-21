import { FOOD_CATEGORIES } from "../../../constants/foodCategories";


export const PLACEABLE_ICONS = [
  // TIER 10
  { 
    id: 'Supermarkets',      
    label: ['Supermarkets', 'Grocery Stores'], 
    icon: '/icons/10-supermarket.png',
    map_pin: '/icons/map-pins/10-supermarket.png',
    sim_pin: '/icons/sim-pins/10-supermarket.png'
  },
  { 
    id: 'Free Grocery Items',                                       
    label: ['Free/Low Cost Grocery Items'], 
    icon: '/icons/09-ncgrocery.png',
    map_pin: '/icons/map-pins/09-ncgrocery.png',
    sim_pin: '/icons/sim-pins/09-ncgrocery.png'
  },

  // TIER 8
  { 
    id: 'Specialty Food Stores',      
    label: ['Specialty Food Stores', 'Public Markets'], 
    icon: '/icons/08-specialty.png',
    map_pin: '/icons/map-pins/08-specialty.png',
    sim_pin: '/icons/sim-pins/08-specialty.png'
  },
  // TIER 7
  { 
    id: 'Small Food Stores',                                        
    label: ['Small Food Stores'], 
    icon: '/icons/07-smallfoodstore.png',
    map_pin: '/icons/map-pins/07-smallfoodstore.png',
    sim_pin: '/icons/sim-pins/07-smallfoodstore.png'
  },
  { 
    id: 'Small Cultural Food Business',                             
    label: ['Small Cultural Food Business'], 
    icon: '/icons/07-cultural.png',
    map_pin: '/icons/map-pins/07-cultural.png',
    sim_pin: '/icons/sim-pins/07-cultural.png'
  },
  // TIER 6
  { 
    id: 'Free Meal',        
    label: ['Free/Low Cost Meals'], 
    icon: '/icons/06-free.png',
    map_pin: '/icons/map-pins/06-free.png',
    sim_pin: '/icons/sim-pins/06-free.png'
  },
  // TIER 5
//   { 
//     id: 'Low Cost Meal',    
//     label: ['Free/Low Cost Meals'], 
//     icon: '/icons/05-meal.png',
//     map_pin: '/icons/map-pins/05-meal.png',
//     sim_pin: '/icons/sim-pins/05-meal.png' 
//   },
  // TIER 4
  { 
    id: 'Free Food Pantries',                                       
    label: ['Free Food Pantries', 'Community Fridges', 'Indigenous Food Programs'], 
    icon: '/icons/04-fridge.png',
    map_pin: '/icons/map-pins/04-fridge.png',
    sim_pin: '/icons/sim-pins/04-fridge.png'
  },
  // TIER 3
  { 
    id: 'Community Shared Agriculture (CSA)',      
    label: ['Community Shared Agriculture'], 
    icon: '/icons/03-csa.png',
    map_pin: '/icons/map-pins/03-csa.png',
    sim_pin: '/icons/sim-pins/03-csa.png'
  },
  // TIER 2
  { 
    id: 'Community Gardens', 
    label: ['Community Gardens', 'Indigenous Gardens'], 
    icon: '/icons/02-sprout.png',
    map_pin: '/icons/map-pins/02-sprout.png',
    sim_pin: '/icons/sim-pins/02-sprout.png' 
  },
  { 
    id: 'Urban Farms',                                              
    label: ['Urban Farms/Forests'], 
    icon: '/icons/02-urban.png',
    map_pin: '/icons/map-pins/02-urban.png',
    sim_pin: '/icons/sim-pins/02-urban.png'
  },
  { 
    id: 'Yard Share Programs',                                      
    label: ['Yard Share Programs'], 
    icon: '/icons/02-yard.png',
    map_pin: '/icons/map-pins/02-yard.png',
    sim_pin: '/icons/sim-pins/02-yard.png'
  },
  // TIER 1
  { 
    id: 'Commissary Kitchens',       
    label: ['Commissary Kitchens'], 
    icon: '/icons/01-kitchen.png',
    map_pin: '/icons/map-pins/01-kitchen.png',
    sim_pin: '/icons/sim-pins/01-kitchen.png'
  },
  { 
    id: 'Other Community-based Food Organizations',                 
    label: ['Community-based Food Organizations', 'Neighbourhood Food Networks'], 
    icon: '/icons/01-community.png',
    map_pin: '/icons/map-pins/01-community.png',
    sim_pin: '/icons/sim-pins/01-community.png'
  },
];

export function IconPicker({ selectedCategory, setSelectedCategory }) {
    const handleClick = (categoryId) => {
        // Click selected icon again to deselect
        setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    };

    return (
        <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Place a hypothetical food asset
            </h3>
            <div className="flex flex-col gap-0.5">
                {PLACEABLE_ICONS.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                    <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleClick(cat.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-colors text-left ${
                        isSelected
                        ? 'border-green-300 bg-green-50'
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                    >
                    <img
                        src={cat.icon}
                        alt={cat.label[0]}
                        className="w-8 h-8 flex-shrink-0"
                    />
                    <span className="text-sm leading-snug">
                        {cat.label.map((line, i) => (
                        <span key={i} className="block">{line}</span>
                        ))}
                    </span>
                    </button>
                );
                })}
            </div>
            {selectedCategory && (
                <p className="text-xs text-gray-500 mt-2">
                Click the map to place a {selectedCategory.toLowerCase()}.
                </p>
            )}
        </div>
    );
}

export default IconPicker;