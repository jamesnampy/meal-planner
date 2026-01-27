# Meal Planner

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Anthropic API key (for AI recipe search)

### Installation
```bash
cd meal-planner
npm install
```

### Environment Setup
Create a `.env.local` file with:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
CRON_SECRET=your-random-secret-here
```

### Running Locally
```bash
npm run dev
```
Open http://localhost:3000

### Deployment to Vercel
1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `CRON_SECRET`: Random string for cron job authentication
4. Deploy

The weekly cron job runs every Wednesday at 9 AM UTC.

---

## Claude AI Integration

This app uses Claude AI for:

### 1. Recipe Search (`/api/recipes/search`)
- Users can search for recipes by cuisine, ingredient, or description
- Claude searches and returns 3 recipe suggestions with full details
- Each suggestion includes ingredients (with categories) and step-by-step instructions

### 2. Meal Regeneration (`/api/plan/regenerate`)
- When reviewing the weekly plan, users can ask Claude to suggest a different meal
- Claude generates a new recipe that doesn't duplicate other meals in the plan
- The new recipe is automatically added to the recipe library

### API Key
Get your API key from: https://console.anthropic.com/

The app uses `claude-sonnet-4-20250514` for recipe generation.

---

## New Features Implementation Plan

### Feature 1: Security Login (Bot Protection)

**Purpose**: Prevent unauthorized bot usage and protect API costs.

**Implementation Approach**: NextAuth.js with simple password protection

**Files to Create/Modify**:
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth API route
- `app/login/page.tsx` - Login page
- `middleware.ts` - Protect all routes except login
- `.env.local` - Add AUTH_SECRET and ADMIN_PASSWORD

**Environment Variables**:
```
AUTH_SECRET=random-secret-for-jwt
ADMIN_PASSWORD=your-chosen-password
```

**Flow**:
1. User visits any page → redirected to /login if not authenticated
2. User enters password → validated against ADMIN_PASSWORD
3. Session created with JWT → user can access app
4. Sessions expire after 7 days

---

### Feature 2: Recipe Exclusion List

**Purpose**: Allow users to exclude certain ingredients (dietary restrictions, allergies, preferences).

**Default Exclusions**: beef, pork, shellfish

**Implementation Approach**:
- Store exclusions in `data/settings.json`
- Settings page to manage exclusions
- Pass exclusions to Claude in all recipe prompts

**Files to Create/Modify**:
- `data/settings.json` - Store user preferences including exclusions
- `types/index.ts` - Add Settings type
- `lib/settings.ts` - Read/write settings
- `app/settings/page.tsx` - Settings page UI
- `app/api/settings/route.ts` - Settings API
- `lib/claude.ts` - Update prompts to include exclusions
- `components/Navigation.tsx` - Add Settings link

**Data Format** (`data/settings.json`):
```json
{
  "exclusions": ["beef", "pork", "shellfish"],
  "customExclusions": []
}
```

**Claude Prompt Update**:
```
IMPORTANT: Do NOT include recipes containing these ingredients: beef, pork, shellfish, [user additions]
```

---

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

---

## Planned Features

### Multi-User Support (Next Up)

**Purpose**: Allow multiple users to have separate logins with individual settings, enabling sharing with colleagues or family members.

**Scope**:
- User accounts stored in database
- Per-user settings (exclusions, preferred cuisines, AI context, recipe websites)
- Per-user meal plans
- Separate recipe libraries or shared library with personal favorites

**Implementation Approach**:
- Extend NextAuth to support multiple user accounts
- Add `userId` field to Settings, WeeklyPlan, and potentially Recipes
- Update all data access functions to scope by user
- Add user registration or invite system

**Files to Modify**:
- `lib/auth.ts` - Support multiple users
- `lib/settings.ts` - Scope settings per user
- `lib/plans.ts` - Scope plans per user
- `lib/recipes.ts` - Consider shared vs. personal recipes
- `types/index.ts` - Add User type, add userId to relevant types
- Database schema updates for user accounts

---

### Meal Prep Suggestions (Post-Approval)

**Purpose**: Once a weekly meal plan is approved, automatically generate actionable meal prep suggestions with a focus on weekend preparation to streamline weeknight cooking.

**Trigger**: Fires when meal plan status changes to "approved"

**Features**:
- **Weekend Prep Schedule**: Suggest tasks for Saturday/Sunday to prep for the week ahead
- **Batch Cooking Recommendations**: Identify proteins, grains, and sauces that can be made in bulk
- **Vegetable Prep List**: Chop, wash, and store instructions for produce
- **Marination Timelines**: Flag proteins that benefit from overnight or 24-hour marinades
- **Storage Guidelines**: How long each prepped item stays fresh and proper storage methods
- **Time Estimates**: Total weekend prep time with breakdown per task
- **Day-Linking**: Connect each prep task to the specific meals it supports

**Implementation Approach**:
- Add Claude AI prompt to analyze approved meal plan and generate prep suggestions
- Create PrepSuggestions component to display on approval confirmation
- Store prep tasks in WeeklyPlan record
- Optional: Send prep reminder notification on Saturday morning

**Files to Create/Modify**:
- `lib/claude.ts` - Add `generatePrepSuggestions()` function
- `app/api/plan/prep-suggestions/route.ts` - API endpoint for prep generation
- `components/PrepSuggestions.tsx` - UI component for displaying prep tasks
- `app/plan/[id]/page.tsx` - Show prep suggestions after approval
- `types/index.ts` - Add PrepTask and PrepSuggestion types

**Data Format** (PrepTask):
```json
{
  "id": "string",
  "task": "Marinate chicken thighs in tikka masala spices",
  "category": "proteins" | "vegetables" | "grains" | "sauces" | "spices",
  "prepDay": "Saturday" | "Sunday",
  "timeMinutes": 15,
  "storageInstructions": "Refrigerate in sealed container for up to 3 days",
  "linkedMeals": ["Monday Dinner", "Wednesday Dinner"]
}
```