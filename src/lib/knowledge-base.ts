export type PredefinedSubItem = {
  text: string;
  quantity?: number;
}

export type PredefinedChecklistItem = {
    key: string;
    text: string;
    // optional category key matching exported `categories`
    category?: string;
    quantity?: number;
    subItems: PredefinedSubItem[];
};

const predefinedChecklistItems: PredefinedChecklistItem[] = [
    {
        key: 'morning_routine',
        text: "Morning Routine",
        category: 'personal',
        subItems: [{ text: "Make bed" }, { text: "Brush teeth" }, { text: "Meditate for 10 minutes" }, { text: "Prepare breakfast" }],
    },
    {
        key: 'weekly_report',
        text: "Weekly Report",
        category: 'work',
        subItems: [{ text: "Compile sales data" }, { text: "Analyze key metrics" }, { text: "Write executive summary" }, { text: "Get it reviewed by manager" }],
    },
    {
        key: 'project_kickoff',
        text: "Project Kick-off Meeting",
        category: 'work',
        subItems: [{ text: "Define project goals" }, { text: "Assign roles and responsibilities" }, { text: "Establish timeline" }, { text: "Set up communication channels" }],
    },
    {
        key: 'new_feature_qa',
        text: "New Feature QA",
        category: 'work',
        subItems: [{ text: "Test on Chrome" }, { text: "Test on Firefox" }, { text: "Test on Safari" }, { text: "Test on mobile" }, { text: "Check for accessibility issues" }],
    },
    {
        key: 'grocery_shopping',
        text: "Grocery Shopping",
        category: 'shopping',
        subItems: [
            { text: "Milk", quantity: 2 },
            { text: "Eggs", quantity: 12 },
            { text: "Bread", quantity: 1 },
            { text: "Cheese", quantity: 1 },
            { text: "Fruits", quantity: 5 }
        ],
    },
    // ...no dummy items...
];

export function getPredefinedItems() {
    return predefinedChecklistItems;
}

export function getPredefinedItemByKey(key: string): PredefinedChecklistItem | undefined {
    return predefinedChecklistItems.find(item => item.key === key);
}

export type Category = {
    key: string;
    name: string;
    // optional display props used by UI
    color?: string;
    bgColor?: string;
    textColor?: string;
    // icon can be an emoji string or a React node in the consuming component
    icon?: string | any;
}

// Basic set of categories used by components. Consumers will fall back to a default
// if an item's category is not present here.
export const categories: Category[] = [
    { key: 'general', name: 'General', color: '#64748b', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📝' },
    { key: 'work', name: 'Work', color: '#0ea5e9', bgColor: 'bg-sky-100', textColor: 'text-sky-700', icon: '💼' },
    { key: 'personal', name: 'Personal', color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-700', icon: '🏠' },
    { key: 'shopping', name: 'Shopping', color: '#06b6d4', bgColor: 'bg-teal-100', textColor: 'text-teal-700', icon: '🛒' },
    { key: 'health', name: 'Health', color: '#10b981', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', icon: '💊' },
];
