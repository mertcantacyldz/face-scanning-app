# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FaceLoom** - A React Native mobile application (iOS/Android/Web) that uses MediaPipe Face Mesh AI to detect 468 facial landmarks for face analysis, with AI-powered detailed analysis via OpenRouter API.

## Tech Stack

- **Expo SDK**: ~54.0.7 (React Native 0.81.4)
- **TypeScript**: Strict mode enabled
- **Expo Router**: v6 file-based routing with typed routes
- **NativeWind**: v4 (Tailwind CSS for React Native)
- **Supabase**: Authentication (anonymous + email) + PostgreSQL database + Edge Functions
- **MediaPipe Face Mesh**: v0.4 (via WebView implementation)
- **OpenRouter API**: AI analysis via Supabase Edge Functions (server-side)
- **RevenueCat**: In-app purchases and subscription management
- **i18next**: Internationalization (Turkish + English)
- **UI Components**: Shadcn-inspired primitives with class-variance-authority

## Development Commands

```bash
# Start development server
npm start
npx expo start --clear            # Clear cache (REQUIRED after .env changes)

# Platform-specific
npm run android                   # Run on Android
npm run ios                       # Run on iOS
npm run web                       # Run on web

# Code quality
npm run lint                      # Run ESLint

# Diagnostics
npx expo doctor                   # Check project setup

# Project reset (cleanup)
npm run reset-project             # Runs scripts/reset-project.js (starter cleanup)
```

**Important:** After modifying `.env` file, ALWAYS restart with `--clear` flag to reload environment variables.

## Architecture

### Routing Structure (Expo Router)

```
app/
├── _layout.tsx                   # Root layout (Stack, auth refresh)
├── index.tsx                     # Auth redirect (session check)
├── (auth)/                       # Unauthenticated group
│   ├── _layout.tsx              # Session guard
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (onboarding)/                 # New user onboarding flow
│   ├── _layout.tsx              # Onboarding layout
│   ├── welcome.tsx              # Welcome screen
│   ├── name.tsx                 # Name input
│   └── gender.tsx               # Gender selection
├── (tabs)/                       # Authenticated group
│   ├── _layout.tsx              # Bottom tabs (4 tabs)
│   ├── index.tsx                # Camera/MediaPipe screen
│   ├── analysis.tsx             # AI analysis results (FULLY IMPLEMENTED)
│   ├── progress.tsx             # Progress tracking (FULLY IMPLEMENTED)
│   └── profile.tsx              # User settings
├── exercises/[regionId].tsx      # Face exercises for specific region
├── region/[id].tsx              # Region detail with history
├── paywall.tsx                  # Premium paywall
├── modal.tsx                    # Generic modal
└── premium/                      # Premium features
    ├── advanced-analysis.tsx
    ├── payment.tsx
    └── subscribe.tsx
```

**Key Patterns:**
- Groups with `(parentheses)` are hidden from URL
- Session-based navigation guards in layout files
- `unstable_settings.anchor` set to '(tabs)' in root layout
- Root `index.tsx` handles initial auth redirect logic
- Onboarding flow checks `onboarding_completed` in profile

### Authentication Flow

**Anonymous-First Design:**
1. App starts → `contexts/AuthContext.tsx` checks for saved session
2. No session → Creates anonymous user via `supabase.auth.signInAnonymously()`
3. Device ID is generated and stored (`lib/device-id.ts`)
4. Device-to-user mapping created in `device_users` table
5. User can convert to email account later (preserves data)

**Onboarding:**
- First-time users go through `(onboarding)` flow (welcome → name → gender)
- `onboarding_completed` flag in profiles table tracks completion
- Hook: `hooks/use-onboarding-check.ts` checks status and redirects

**Configuration:** `lib/supabase.ts`
- Environment variables: `.env` file with `EXPO_PUBLIC_` prefix
- AsyncStorage for manual session persistence (custom implementation)
- `persistSession: false` in Supabase config (security)
- Session refresh handled in `contexts/AuthContext.tsx`

**Auth Context:** `contexts/AuthContext.tsx`
- Provides `{ session, loading, isAnonymous }` to entire app
- Handles device ID generation and mapping
- Manages session persistence via AsyncStorage
- Creates anonymous users automatically

### Premium System

**Dual Premium Sources:**
The app checks BOTH RevenueCat and Supabase database for premium status:
- **RevenueCat**: In-app purchases (iOS/Android)
- **Database**: Manual grants, trials, or promotions
- **Combined**: User is premium if EITHER source returns true

**Implementation:** `contexts/PremiumContext.tsx`
- Provides: `{ isPremium, isRevenueCatPremium, isDatabasePremium, monthlyPackage, yearlyPackage, ... }`
- Free users: 1 free analysis (spin wheel to choose region)
- Premium users: Unlimited analyses + progress tracking

**Free Analysis System:**
- Stored in `profiles.free_analysis_used` and `profiles.free_analysis_region`
- Spin wheel component: `components/SpinWheel.tsx`
- Once used, can only analyze that region (or upgrade to premium)

### Database Schema (Supabase)

**profiles table:**
- `id` (UUID), `user_id` (UUID, references auth.users)
- `email`, `full_name`, `gender` ('male'|'female'|'other')
- `is_premium` (boolean), `premium_expires_at` (timestamp)
- `onboarding_completed` (boolean)
- `free_analysis_used` (boolean), `free_analysis_region` (text)
- `created_at`, `updated_at`

**device_users table:**
- Maps device IDs to Supabase user IDs
- `device_id` (text, unique), `supabase_user_id` (UUID)
- Used for anonymous user persistence across app restarts

**face_analysis table:**
- `id` (UUID primary key)
- `user_id` (UUID, references auth.users)
- `landmarks` (JSONB: array of 468 {x, y, z, index} objects)
- `analysis_data` (JSONB): metadata from MediaPipe scan
- `created_at` (TIMESTAMPTZ)

**region_analysis table:** (NEW - main analysis storage)
- `id` (UUID primary key)
- `user_id` (UUID), `face_analysis_id` (UUID)
- `region_id` (text: 'eyebrows'|'eyes'|'nose'|'lips'|'jawline'|'face_shape')
- `raw_response` (JSONB): Complete AI response
- `metrics` (JSONB): Extracted comparison metrics
- `overall_score` (integer): Calculated score (0-100)
- `created_at` (TIMESTAMPTZ)

**exercise_tracking table:**
- Tracks daily exercise completion per region
- `user_id`, `region_id`, `date`, `completed_at`

### MediaPipe Integration (Critical)

**Hybrid WebView Approach** - NOT using native MediaPipe directly.

**Implementation:** `app/(tabs)/index.tsx` (camera/scan screen)
- Embeds MediaPipe Web library via CDN in hidden WebView
- Communicates via `postMessage` API
- Processes images at 1024x1024 resolution (high precision)

**Workflow:**
```
Camera/Gallery (expo-image-picker)
  ↓
Resize to 1024x1024 (expo-image-manipulator)
  ↓
Convert to base64
  ↓
Inject to WebView → window.processImage(base64)
  ↓
MediaPipe Face Mesh analysis (468 landmarks)
  ↓
Save landmarks to face_analysis table
  ↓
Navigate to analysis screen
```

**MediaPipe Configuration (in WebView):**
```javascript
faceMesh.setOptions({
  maxNumFaces: 1,                    // Single face detection
  refineLandmarks: true,             // Iris detail enabled
  minDetectionConfidence: 0.7,       // 70% confidence threshold
  minTrackingConfidence: 0.5,
  selfieMode: false,                 // No horizontal flip
  staticImageMode: true,             // Optimized for photos
  modelComplexity: 1                 // Full model (optimal)
});
```

**Face Regions (6 Total):**
- `eyebrows`, `eyes`, `nose`, `lips`, `jawline`, `face_shape`
- Defined in `lib/face-prompts.ts` with icons and descriptions
- Each region has custom AI analysis prompt

### AI Analysis System (OpenRouter via Edge Functions)

**Security Architecture:**
- API key stored server-side in Supabase secrets (NOT in client code)
- Client calls Supabase Edge Function: `analyze-face-region`
- Edge Function proxies request to OpenRouter API
- User authentication via Supabase JWT

**Two-Phase Analysis:** (TypeScript + AI)

1. **TypeScript Pre-calculation** (`lib/calculations/*.ts`):
   - Calculates precise metrics from landmarks (symmetry, angles, distances)
   - Files: `nose.ts`, `eyes.ts`, `lips.ts`, `jawline.ts`, `eyebrows.ts`, `face-shape.ts`
   - Example metrics: `tipDeviation`, `nostrilAsymmetry`, `rotationAngle`
   - Produces scores: 0-100 per metric + overall score

2. **AI Analysis** (OpenRouter via Edge Function):
   - Prompt template injection: Replace `{metricName}` with calculated values
   - AI provides natural language explanation + recommendations
   - AI's score is OVERRIDDEN by TypeScript calculation (more accurate)
   - Model: Configurable in Edge Function

**Implementation:** `app/(tabs)/analysis.tsx`
- Region selection UI with premium gating
- Spin wheel for free users
- AI analysis modal with structured display components
- Score calculation: `calculateOverallScore()` overrides AI

**Display Components:** (`components/analysis/`)
- `HeroCard.tsx`: Main score and assessment
- `UserFriendlySummary.tsx`: Plain language explanation
- `JsonRenderer.tsx`: Structured data renderer
- `RecommendationsList.tsx`: Actionable tips
- `MetadataSection.tsx`: Technical details (collapsible)

**Test Mode:**
```typescript
// In app/(tabs)/analysis.tsx
const TEST_MODE = true;  // Skips AI call, shows TypeScript metrics only
```

### Progress Tracking System

**Implementation:** `app/(tabs)/progress.tsx` (FULLY FUNCTIONAL)
- Overall progress chart (average scores over time)
- Per-region progress cards with comparison badges
- Exercise statistics with monthly calendar
- Premium-gated (free users see paywall)

**Features:**
- Pull-to-refresh
- Region history: `app/region/[id].tsx` shows all analyses for a region
- Comparison system: `lib/comparison.ts` calculates improvement percentages
- Charts: `react-native-gifted-charts` library

**Exercise Tracking:**
- Daily completion tracking per region
- Monthly calendar view: `components/progress/ExerciseMonthCalendar.tsx`
- Exercise guides: `app/exercises/[regionId].tsx`
- Exercise data: `lib/exercises.ts` defines exercises per region

### Internationalization (i18n)

**Implementation:** `react-i18next`
- Languages: Turkish (tr) + English (en)
- Translation files: `locales/{lang}/{namespace}.json`
- Namespaces: `analysis`, `auth`, `common`, `errors`, `exercises`, `home`, `onboarding`, `premium`, `profile`, `progress`, `region`, `tabs`

**Usage:**
```typescript
const { t, i18n } = useTranslation('namespace');
const text = t('key.path', { variable: value });
const language = i18n.language; // 'tr' or 'en'
```

**Language Selector:** `components/LanguageSelector.tsx`
- Stores preference in AsyncStorage: `lib/language-storage.ts`

### Styling System

**NativeWind + CVA Pattern:**
```typescript
// Component usage
<View className="bg-primary dark:bg-secondary p-4" />

// Variants with CVA
const buttonVariants = cva("base-classes", {
  variants: { variant: { default: "...", destructive: "..." } }
})
```

**Configuration:**
- Global CSS: `global.css` with HSL CSS variables
- Dark mode: class-based (`dark:` prefix)
- Tailwind config: Custom theme with shadcn colors
- Metro config: NativeWind plugin, inline rem: 16

**Key Pattern - TextClassContext:**
```typescript
<TextClassContext.Provider value={buttonTextVariants({ variant })}>
  <Pressable className={buttonVariants({ variant })}>
    <Text />  {/* Automatically styled from context */}
  </Pressable>
</TextClassContext.Provider>
```

## Configuration Files

### app.json (Expo Config)
```json
{
  "newArchEnabled": true,        // React Native new architecture
  "typedRoutes": true,           // Expo Router typed routes
  "reactCompiler": true          // React Compiler experimental
}
```

### babel.config.js (Order Critical!)
```js
presets: [
  ["babel-preset-expo", { jsxImportSource: "nativewind" }],  // 1. Expo + NativeWind JSX
  "nativewind/babel"                                         // 2. NativeWind transform
],
plugins: ['react-native-reanimated/plugin']  // 3. MUST BE LAST (official docs requirement)
```

**Why order matters:** Reanimated modifies function bodies and must run after all other transforms.

### Environment Variables (.env)

**Required variables:**
```bash
# Supabase (public keys - safe to expose)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# RevenueCat (public key - safe to expose)
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_xxx

# OpenRouter (DEPRECATED - now server-side)
# EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxx  # DO NOT USE - security risk
# Instead, set in Supabase: supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxx
```

**Security Notes:**
- `EXPO_PUBLIC_` prefix makes variables accessible in client code
- OpenRouter API key MUST be in Supabase secrets, NOT in .env
- Never commit `.env` file (already in `.gitignore`)

## State Management

**Context-Based Architecture:**
1. **AuthContext** (`contexts/AuthContext.tsx`):
   - Session management, anonymous auth, device mapping
   - Provides: `{ session, loading, isAnonymous }`

2. **PremiumContext** (`contexts/PremiumContext.tsx`):
   - Premium status from RevenueCat + database
   - Free analysis tracking
   - Provides: `{ isPremium, freeAnalysisUsed, freeAnalysisRegion, ... }`

**No Redux/Zustand:**
- Local component state with `useState`/`useEffect`
- Supabase for server state
- AsyncStorage for local persistence

## Important Implementation Details

### Image Processing (Critical Requirements)
- **ALWAYS resize to 1024x1024** before MediaPipe analysis (high precision)
- Use `expo-image-manipulator` with the new API:
  ```typescript
  const context = ImageManipulator.manipulate(imageUri);
  context.resize({ width: 1024, height: 1024 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.95,  // High quality (95%)
    base64: true     // Required for WebView communication
  });
  ```
- Old `manipulateAsync()` API is deprecated

### AI Analysis Score Calculation

**Critical Pattern:** TypeScript calculates scores, AI provides explanations.

```typescript
// 1. Calculate metrics in TypeScript
const calculatedMetrics = calculateNoseMetrics(landmarks);

// 2. Inject metrics into AI prompt template
const finalPrompt = region.prompt
  .replace(/{tipDeviation}/g, calculatedMetrics.tipDeviation.toFixed(2))
  .replace(/{tipScore}/g, calculatedMetrics.tipScore.toString())
  // ... (all metrics)

// 3. Call AI with pre-filled prompt
const result = await analyzeFaceRegion({
  landmarks,
  region: 'nose',
  customPrompt: finalPrompt,
  language: 'tr'
});

// 4. Override AI's score with TypeScript calculation
if (result.analysis_result) {
  result.analysis_result.overall_score = calculatedMetrics.overallScore;
}
```

**Why?** AI often miscalculates weighted averages. TypeScript ensures accuracy.

### Premium Feature Gating

```typescript
const { isPremium, freeAnalysisUsed, freeAnalysisRegion } = usePremium();

// Check access
if (!isPremium && freeAnalysisRegion !== 'nose') {
  // Show premium modal or spin wheel
  setShowPremiumModal(true);
  return;
}

// Access granted
performAnalysis();
```

### Device ID Persistence

**Implementation:** `lib/device-id.ts` + `lib/device-id-with-fallback.ts`
- Uses `expo-device` for hardware ID
- Fallback: UUID stored in AsyncStorage
- Maps device to Supabase user in `device_users` table
- Enables data persistence for anonymous users across app restarts

## Development Tips

### WebView Debugging
- MediaPipe runs in WebView (hidden: 1x1 pixels, opacity: 0)
- Communication: `injectJavaScript()` (RN → WebView) and `onMessage` (WebView → RN)
- Message types: `READY`, `LANDMARKS`, `NO_FACE`, `ERROR`
- HTML template: `lib/mediapipe-html.ts`

### Testing AI Without Spending Money
Set `TEST_MODE = true` in `app/(tabs)/analysis.tsx`:
- Skips OpenRouter API call
- Shows TypeScript-calculated metrics
- Displays mock AI response

### Type Safety
- TypeScript strict mode enforced
- Expo Router generates typed routes (experimental)
- Define interfaces for all data structures
- Example: `RegionId` union type in `lib/exercises.ts`

### Performance
- MediaPipe in WebView offloads heavy ML processing
- 1024x1024 image size provides high precision
- Processing time: ~2-4 seconds on modern devices
- Charts use lightweight `react-native-gifted-charts`

### Common Gotchas
1. **Reanimated plugin MUST be last** in `babel.config.js` plugins array
2. **1024x1024 resize is mandatory** - optimal landmark precision
3. **WebView requires `javaScriptEnabled={true}`**
4. **`EXPO_PUBLIC_` prefix is required** for client-side env vars
5. **Session persistence is manual** - handled in AuthContext
6. **Cache must be cleared** after `.env` changes (`npx expo start --clear`)
7. **OpenRouter key must be server-side** - use Supabase secrets
8. **AI scores must be overridden** - TypeScript calculations are more accurate
9. **Anonymous auth requires device mapping** - ensure `device_users` table exists
10. **Free analysis is one-time** - stored in profiles table

## Critical Dependencies

**Must have:**
- expo-camera (requires camera permissions)
- react-native-webview (MediaPipe won't work without)
- @supabase/supabase-js (backend dependency)
- react-native-purchases (RevenueCat for payments)
- react-i18next (internationalization)
- expo-image-manipulator (image resizing)

**Peer dependencies:**
- React 19.1.0
- React Native 0.81.4 (via Expo 54)

## Deployment Notes

**See:** `DEPLOYMENT_GUIDE.md` for full production deployment steps.

**Key steps:**
1. Set OpenRouter API key in Supabase secrets: `supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxx`
2. Deploy Supabase Edge Function: `supabase functions deploy analyze-face-region`
3. Configure RevenueCat products (monthly/yearly)
4. Test anonymous auth flow + device persistence
5. Verify premium status from both RevenueCat and database

## Known Status

**Fully Implemented Features:**
1. ✅ Anonymous authentication with device persistence
2. ✅ Onboarding flow (welcome → name → gender)
3. ✅ MediaPipe face scanning (468 landmarks)
4. ✅ AI-powered analysis for all 6 regions
5. ✅ TypeScript metric calculations (6 files)
6. ✅ Progress tracking with charts
7. ✅ Exercise tracking and calendar
8. ✅ Premium system (RevenueCat + database)
9. ✅ Free analysis (spin wheel)
10. ✅ Internationalization (Turkish + English)
11. ✅ Region detail pages with history

**Partially Implemented:**
- RevenueCat payment flow UI exists but not tested in production
- Exercise guides exist but exercises are placeholder content

**Architecture Highlights:**
- Separation of concerns: TypeScript calculations vs AI explanations
- Security-first: API keys server-side only
- Offline-first: Anonymous auth with device persistence
- Premium-aware: Dual source premium checking (RevenueCat + database)
