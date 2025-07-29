
export type PredefinedChecklistItem = {
    key: string;
    text: string;
    subItems: string[];
};

const predefinedChecklistItems: PredefinedChecklistItem[] = [
    {
        key: 'morning_routine',
        text: "Morning Routine",
        subItems: ["Make bed", "Brush teeth", "Meditate for 10 minutes", "Prepare breakfast"],
    },
    {
        key: 'weekly_report',
        text: "Weekly Report",
        subItems: ["Compile sales data", "Analyze key metrics", "Write executive summary", "Get it reviewed by manager"],
    },
    {
        key: 'project_kickoff',
        text: "Project Kick-off Meeting",
        subItems: ["Define project goals", "Assign roles and responsibilities", "Establish timeline", "Set up communication channels"],
    },
    {
        key: 'new_feature_qa',
        text: "New Feature QA",
        subItems: ["Test on Chrome", "Test on Firefox", "Test on Safari", "Test on mobile", "Check for accessibility issues"],
    },
    {
        key: 'grocery_shopping',
        text: "Grocery Shopping",
        subItems: ["Milk", "Eggs", "Bread", "Cheese", "Fruits"],
    }
];

export function getPredefinedItems() {
    return predefinedChecklistItems;
}

export function getPredefinedItemByKey(key: string): PredefinedChecklistItem | undefined {
    return predefinedChecklistItems.find(item => item.key === key);
}
