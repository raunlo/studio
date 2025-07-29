export type PredefinedSubItem = {
  text: string;
  quantity?: number;
}

export type PredefinedChecklistItem = {
    key: string;
    text: string;
    quantity?: number;
    subItems: PredefinedSubItem[];
};

const predefinedChecklistItems: PredefinedChecklistItem[] = [
    {
        key: 'morning_routine',
        text: "Morning Routine",
        subItems: [{ text: "Make bed" }, { text: "Brush teeth" }, { text: "Meditate for 10 minutes" }, { text: "Prepare breakfast" }],
    },
    {
        key: 'weekly_report',
        text: "Weekly Report",
        subItems: [{ text: "Compile sales data" }, { text: "Analyze key metrics" }, { text: "Write executive summary" }, { text: "Get it reviewed by manager" }],
    },
    {
        key: 'project_kickoff',
        text: "Project Kick-off Meeting",
        subItems: [{ text: "Define project goals" }, { text: "Assign roles and responsibilities" }, { text: "Establish timeline" }, { text: "Set up communication channels" }],
    },
    {
        key: 'new_feature_qa',
        text: "New Feature QA",
        subItems: [{ text: "Test on Chrome" }, { text: "Test on Firefox" }, { text: "Test on Safari" }, { text: "Test on mobile" }, { text: "Check for accessibility issues" }],
    },
    {
        key: 'grocery_shopping',
        text: "Grocery Shopping",
        subItems: [
            { text: "Milk", quantity: 2 },
            { text: "Eggs", quantity: 12 },
            { text: "Bread", quantity: 1 },
            { text: "Cheese", quantity: 1 },
            { text: "Fruits", quantity: 5 }
        ],
    }
];

export function getPredefinedItems() {
    return predefinedChecklistItems;
}

export function getPredefinedItemByKey(key: string): PredefinedChecklistItem | undefined {
    return predefinedChecklistItems.find(item => item.key === key);
}
