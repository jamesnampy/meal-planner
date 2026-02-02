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
Create a `.env.local` file with (see `.env.example` for full list):
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
CRON_SECRET=your-random-secret-here
AUTH_SECRET=generate-a-random-32-char-string
ADMIN_PASSWORD=your-family-password
MONGODB_URI=mongodb+srv://...
NTFY_TOPIC=meal-planner-sdfui901  # optional, for push notifications
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
   - `AUTH_SECRET`: Random 32-char string for NextAuth.js JWT
   - `ADMIN_PASSWORD`: Family login password
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `NTFY_TOPIC`: (optional) ntfy.sh topic for push notifications
4. Deploy

The weekly cron job runs every Wednesday at 6 PM PST (Thursday 2 AM UTC).
An approval reminder cron runs Thursday & Friday at 6 PM PST.

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

### Feature 1: Security Login (Bot Protection) ✅ IMPLEMENTED

**Purpose**: Prevent unauthorized bot usage and protect API costs.

**Implementation**: NextAuth.js with simple password protection.

**Flow**:
1. User visits any page → redirected to /login if not authenticated
2. User enters password → validated against ADMIN_PASSWORD
3. Session created with JWT → user can access app
4. Sessions expire after 7 days

**Files**:
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth API route
- `app/login/page.tsx` - Login page
- `middleware.ts` - Protects all routes except login and `/api/cron/*`

---

### Feature 2: Recipe Exclusion List ✅ IMPLEMENTED

**Purpose**: Allow users to exclude certain ingredients (dietary restrictions, allergies, preferences).

**Default Exclusions**: beef, pork, shellfish

**Implementation**: Exclusions stored in MongoDB settings, passed to Claude in all recipe prompts.

**Files**:
- `lib/settings.ts` - Read/write settings with exclusions
- `app/settings/page.tsx` - Settings page UI for managing exclusions
- `app/api/settings/route.ts` - Settings API
- `lib/claude.ts` - Prompts include exclusion list

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
- **Weekly plan generation**: `0 2 * * 4` (Wednesday 6 PM PST = Thursday 2 AM UTC)
- **Approval reminders**: `0 2 * * 5,6` (Thursday & Friday 6 PM PST = Friday & Saturday 2 AM UTC)
- **Purpose**: Auto-generate weekly plan and send reminders before Sunday 6 PM PT lockdown

#### 7.2 Push Notifications (ntfy.sh)
- Push notifications via ntfy.sh (no SDK needed, plain HTTP POST)
- **Plan ready notification**: Sent after weekly cron generates the plan
- **Approval reminder**: Sent Thu/Fri if unapproved meals remain
- **Configuration**: Set `NTFY_TOPIC` env var, subscribe to the topic in ntfy app
- **Click action**: Opens meal planner app at `/plan`

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

### Meal Prep Suggestions (Post-Approval) ✅ IMPLEMENTED

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

**Files Created/Modified**:
- `lib/claude.ts` - Added `generatePrepSuggestions()` function
- `app/api/plan/prep-suggestions/route.ts` - API endpoint for prep generation
- `components/PrepSuggestions.tsx` - UI component for displaying prep tasks
- `app/plan/page.tsx` - Shows prep suggestions section after approval
- `types/index.ts` - Added PrepTask and PrepSuggestions types

**How to Use**:
1. Generate and approve a weekly meal plan
2. After approval, a "Weekend Meal Prep" section appears
3. Click to expand and view AI-generated prep suggestions
4. Tasks are organized by Saturday (items that keep well) and Sunday (fresher items)
5. Use "Regenerate Suggestions" button for alternative prep plans

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

**Future Enhancements**:
- Send prep reminder notification on Saturday morning

---

### Always Split Meals ✅ IMPLEMENTED

**Purpose**: Always generate separate adult and kids meals. No more shared meal option.

**What Changed**:
- Removed `sharedMeal` toggle, badge, and conditional rendering from plan UI
- Claude prompts now explicitly request separate and distinct recipes for adults and kids
- `sharedMeal` field kept on `Meal` type for backward data compatibility (always `false`)
- Removed `updateMealSharedStatus` function from `lib/plans.ts`
- Simplified `replaceMealRecipe` to remove shared meal check logic

**Files Modified**:
- `types/index.ts` - Deprecated `sharedMeal` field
- `lib/claude.ts` - Removed sharedMeal from interfaces and prompts
- `lib/meal-generator.ts` - Always creates separate kids recipe with own ID
- `lib/plans.ts` - Removed `updateMealSharedStatus`, simplified `replaceMealRecipe`
- `app/api/plan/route.ts` - Removed shared meal handler
- `app/plan/page.tsx` - Removed shared meal UI (toggle, badge, conditional rendering)
- `components/MealCard.tsx` - Removed `sharedMeal` prop and "Shared" badge

---

### "Not Recommended" Recipe System ✅ IMPLEMENTED

**Purpose**: Allow users to mark recipes they don't want to see again, with per-audience tracking.

**How It Works**:
1. Click thumbs-down button next to any recipe in the plan
2. Confirm dialog asks to block the recipe
3. Recipe is added to not-recommended list for that audience (adults/kids)
4. If a day is specified, that meal is immediately regenerated
5. Claude prompts include the not-recommended list to avoid suggesting blocked recipes

**Data Format** (`NotRecommendedRecipe`):
```json
{
  "recipeName": "Spaghetti Bolognese",
  "audience": "kids",
  "addedAt": "2026-02-01T00:00:00.000Z"
}
```

**Files Created**:
- `lib/not-recommended.ts` - CRUD operations for not-recommended list
- `app/api/not-recommended/route.ts` - GET/POST/DELETE API endpoints

**Files Modified**:
- `types/index.ts` - Added `NotRecommendedRecipe` interface, added to `Settings`
- `lib/settings.ts` - Added `notRecommended: []` to defaults
- `lib/claude.ts` - `buildContextPrompt()` includes not-recommended list in prompts
- `app/plan/page.tsx` - Thumbs-down button on each meal card
- `app/settings/page.tsx` - "Not Recommended Recipes" management section

---

### Full Recipe Display ✅ IMPLEMENTED

**Purpose**: Allow users to view full recipe details (ingredients and instructions) inline in the plan view.

**How It Works**:
- Each meal card has a "View Recipe" / "Hide Recipe" toggle button
- Expanded view shows full ingredients list (amount + unit + name) and numbered instructions
- Collapsed view shows ingredient name summary (first 5)

**Files Modified**:
- `app/plan/page.tsx` - Added `expanded` state and recipe detail rendering to inline MealCard

---

### Sunday 6 PM PT Plan Lockdown ✅ IMPLEMENTED

**Purpose**: Enforce a weekly deadline for meal plan approval to ensure grocery shopping can happen on time.

**How It Works**:
- Lockdown time: Sunday 6 PM PST (= Monday 2 AM UTC, calculated as `weekStart + 7 days, 2:00 AM UTC`)
- After lockdown: Approve Day and Approve All buttons are disabled
- Banner displayed: "Approval deadline has passed (Sunday 6 PM). A new plan will be generated Wednesday."
- AI Suggest, Not Recommended, and Favorite buttons remain active (affect future plans)
- Already-approved plans are not affected by the lock
- Server computes `locked` field and returns it in GET `/api/plan` response

**Files Created**:
- `lib/plan-lock.ts` - `isPlanLocked(plan)` function

**Files Modified**:
- `app/api/plan/route.ts` - Returns 403 on approval actions when locked; adds `locked` to GET response
- `app/plan/page.tsx` - Disables approve buttons and shows banner when locked

---

### Ntfy.sh Push Notifications ✅ IMPLEMENTED

**Purpose**: Send push notifications when the weekly plan is ready and when approval reminders are due.

**Configuration**:
- Set `NTFY_TOPIC` env var (e.g., `meal-planner-sdfui901`)
- Subscribe to the topic in the ntfy mobile app or web client
- Notifications are optional; skipped gracefully if `NTFY_TOPIC` is not set

**Notifications Sent**:
1. **Plan Ready** (after weekly cron): "Your weekly meal plan is ready! X meals to review."
2. **Approval Reminder** (Thu/Fri cron): "You have X unapproved meals for week of Y. Deadline: Sunday 6 PM PT."

**Click Action**: Tapping notification opens `https://meal-planner.jamesvibecode.com/plan`

**Files Created**:
- `lib/notify.ts` - `sendNotification()`, `sendPlanReadyNotification()`, `sendApprovalReminder()`

**Files Modified**:
- `app/api/cron/weekly/route.ts` - Sends plan ready notification after generation
- `vercel.json` - Updated cron to `0 2 * * 4` (Wed 6 PM PST)
- `.env.example` - Added `NTFY_TOPIC`

---

### Approval Reminder Cron ✅ IMPLEMENTED

**Purpose**: Remind users to approve their meal plan before the Sunday 6 PM PT deadline.

**Schedule**: Thursday & Friday at 6 PM PST (`0 2 * * 5,6` UTC)

**Logic**:
- Skips if no plan, no meals, plan already approved, all meals individually approved, or plan is locked
- Counts unapproved meals and sends reminder via ntfy
- Gracefully skips if ntfy is not configured

**Files Created**:
- `app/api/cron/reminder/route.ts` - Reminder cron endpoint (auth via `CRON_SECRET`)

**Files Modified**:
- `vercel.json` - Added reminder cron entry (2 total cron jobs, Hobby plan compatible)