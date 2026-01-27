# Meal Planner

# Meal Planner Specification

## Overview
A weekly meal planning application for a family of 4 (2 adults, 2 kids) that generates personalized dinner plans (with optional breakfast) for weekdays, focusing on Indian fusion cuisine for adults while accommodating American-style preferences for kids.

## Core Requirements

### 1. User Profile & Family Setup
- **Family composition**: 2 adults, 2 kids
- **Meal frequency**: Weekdays (Monday-Friday)
- **Meal types**: Dinner (required), Breakfast (optional)
- **Dietary preferences**:
  - Adults: Indian fusion cuisine, health-conscious
  - Kids: American kids' meals with selective Indian dishes

### 2. Meal Planning Constraints

#### 2.1 Nutritional Guidelines
- **Calorie target**: ~600 calories per serving
- **Macronutrient balance**: Proportional distribution across:
  - Protein (e.g., 25-30%)
  - Carbohydrates (e.g., 40-45%)
  - Vegetables/Fiber (e.g., 25-30%)
- Display nutritional breakdown for each meal

#### 2.2 Time Constraints
- **Preparation time**: 30-45 minutes per meal
- **Weekly prep support**: 
  - Identify ingredients that can be prepped in advance
  - Suggest batch cooking opportunities
  - Group similar prep tasks across the week

#### 2.3 Cooking Efficiency
- **Minimize dishes**: Prioritize one-pot meals, sheet pan dinners, or meals with minimal cookware
- Flag meals that require multiple pots/pans during planning

### 3. Recipe Management

#### 3.1 Recipe Sources
- Accept recipe URLs from popular cooking sites as input
- Parse and extract:
  - Ingredients list
  - Cooking instructions
  - Prep/cook time
  - Nutritional information (if available)
  - Cuisine type
- Support manual recipe entry for custom family recipes

#### 3.2 Recipe Library
- Store recipes in a searchable database
- Categorize by:
  - Cuisine type (Indian fusion, American, etc.)
  - Meal type (breakfast, dinner)
  - Dietary tags (kid-friendly, vegetarian, etc.)
  - Prep time
  - Favorite status

#### 3.3 Favorites System
- Allow users to mark recipes as "favorites"
- **Favorite frequency rule**: Include at least one favorite recipe per week
- Track recipe rotation to ensure variety
- Display favorite recipes prominently during meal selection

### 4. Weekly Planning Workflow

#### 4.1 Initial Plan Generation
```
Input:
- Week start date
- Meal preferences per day (optional)
- Cuisine preferences per day (default: Indian fusion)
- Any constraints (avoid certain ingredients, etc.)

Output:
- 5 dinner meals (Monday-Friday)
- Optional 5 breakfast meals
- Each meal includes:
  - Recipe name and link (if from external source)
  - Prep time estimate
  - Nutritional breakdown
  - Servings (4)
  - Cuisine type
```

#### 4.2 Cuisine Customization
- **Default**: Indian fusion for all days
- **Per-day override**: Allow selection of specific cuisine for individual days
  - Indian fusion
  - American
  - Mexican
  - Italian
  - Mediterranean
  - Asian (Chinese, Thai, etc.)
  - Other
- Maintain kid-friendly constraint across cuisine types

#### 4.3 Meal Approval Process
**Per-meal review**:
- Display each day's meal(s) for approval
- Options for each meal:
  - ✓ Approve
  - ↻ Regenerate (suggest alternative)
  - ✗ Cancel/Skip
  - 📝 Replace with specific recipe

**Approval states**:
- Draft: Initial generation
- Under Review: User reviewing meals
- Approved: Ready for finalization
- Partial: Some meals approved, others pending

#### 4.4 Plan Finalization
Once all meals are approved:
1. Lock the weekly plan
2. Generate consolidated shopping list
3. Identify weekly prep tasks
4. Create cooking schedule/reminders (optional)

### 5. Shopping List Generation

#### 5.1 Ingredient Aggregation
- Combine all ingredients from approved meals
- Consolidate quantities:
  - Same ingredient across multiple meals
  - Convert to standard units
  - Group by measurement type (weight, volume, count)

#### 5.2 List Organization
Categorize ingredients by:
- Produce (vegetables, fruits)
- Proteins (meat, poultry, fish, tofu, legumes)
- Dairy & Eggs
- Grains & Pasta
- Pantry Staples (spices, oils, sauces)
- Frozen Items
- Other

#### 5.3 Smart Features
- Flag items likely already in pantry (user can mark owned items)
- Highlight weekly prep ingredients
- Estimate total cost (if price data available)
- Export formats: Print, Mobile-friendly, Email

### 6. Weekly Prep Recommendations

#### 6.1 Prep Task Identification
Analyze the week's meals to identify:
- Vegetables that can be chopped in advance
- Proteins that can be marinated
- Grains/legumes that can be cooked ahead
- Sauces/dressings that can be made in batches
- Spice blends to pre-mix

#### 6.2 Prep Schedule
- Suggest optimal prep day (e.g., Sunday)
- Estimate total prep time
- Provide storage instructions
- Link prep tasks to specific meals

## Automation & Notifications

### 7. Weekly Schedule

#### 7.1 Cron Schedule
- **Frequency**: Weekly, every Wednesday
- **Cron expression**: `0 0 * * 3` (runs at midnight on Wednesdays)
- **Purpose**: Automatically generate the upcoming week's meal plan draft

#### 7.2 Text Message Notification
- Send SMS notification when weekly plan is ready for review
- **Message content**:
  - Notification that new meal plan is available
  - Link to review/approve the plan
  - Quick summary (e.g., "5 dinners planned for next week")
- **Trigger**: After cron job generates the weekly plan
- **Recipient**: Primary family meal planner

## Technical Considerations

### Data Models

#### Recipe
```
{
  id: string
  name: string
  source_url?: string
  cuisine_type: string
  meal_type: ['breakfast', 'dinner']
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  ingredients: Ingredient[]
  instructions: string[]
  nutrition: NutritionInfo
  is_favorite: boolean
  kid_friendly: boolean
  dishes_required: number
  tags: string[]
}
```

#### Ingredient
```
{
  name: string
  quantity: number
  unit: string
  category: string
  prep_instructions?: string
}
```

#### NutritionInfo
```
{
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}
```

#### WeeklyPlan
```
{
  id: string
  week_start_date: date
  status: 'draft' | 'under_review' | 'approved'
  meals: DailyMeal[]
  shopping_list?: ShoppingList
  prep_tasks?: PrepTask[]
}
```

#### DailyMeal
```
{
  date: date
  day_of_week: string
  dinner: MealSlot
  breakfast?: MealSlot
}
```

#### MealSlot
```
{
  recipe: Recipe
  status: 'pending' | 'approved' | 'cancelled' | 'needs_replacement'
  cuisine_preference?: string
}
```

### User Interface Flow

1. **Planning Screen**
   - Calendar view of the week
   - Cuisine selector per day
   - "Generate Plan" button

2. **Review Screen**
   - Day-by-day meal cards
   - Nutrition summary per meal
   - Approve/Regenerate/Cancel buttons
   - "Replace with..." search

3. **Approval Summary**
   - Week overview
   - Total prep time
   - Favorite count
   - Cuisine distribution
   - "Finalize Plan" button

4. **Shopping List Screen**
   - Categorized ingredient list
   - Check-off functionality
   - Export options
   - Weekly prep section

## Success Metrics
- Meal approval rate (target: >80% first-pass approval)
- Average time to finalize weekly plan (target: <15 minutes)
- Favorite recipe rotation (target: 1-2 per week)
- Prep time accuracy (actual vs. estimated)
- Nutritional target adherence (within 10% of 600 cal/meal)

## Future Enhancements
- Leftover management and repurposing
- Dietary restriction filters (gluten-free, dairy-free, etc.)
- Budget tracking and cost optimization
- Integration with grocery delivery services
- Smart appliance integration (Instant Pot, slow cooker optimization)
- Meal history and analytics
- Family member feedback system
- Seasonal ingredient suggestions