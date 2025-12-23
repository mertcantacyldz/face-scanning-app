# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FaceLoom** - A React Native mobile application (iOS/Android/Web) that uses MediaPipe Face Mesh AI to detect 468 facial landmarks for face analysis.

## Tech Stack

- **Expo SDK**: ~54.0.7 (React Native 0.81.4)
- **TypeScript**: Strict mode enabled
- **Expo Router**: v6 file-based routing with typed routes
- **NativeWind**: v4 (Tailwind CSS for React Native)
- **Supabase**: Authentication + PostgreSQL database
- **MediaPipe Face Mesh**: v0.4 (via WebView implementation)
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
├── (tabs)/                       # Authenticated group
│   ├── _layout.tsx              # Bottom tabs
│   ├── index.tsx                # Camera/MediaPipe screen
│   ├── analysis.tsx             # Results (placeholder)
│   ├── history.tsx              # Past scans (placeholder)
│   └── profile.tsx              # User settings
└── premium/                      # Premium features
```

**Key Patterns:**
- Groups with `(parentheses)` are hidden from URL
- Session-based navigation guards in layout files
- `unstable_settings.anchor` set to '(tabs)' in root layout
- Root `index.tsx` handles initial auth redirect logic

### Authentication Flow

1. App starts → `index.tsx` checks Supabase session
2. No session → Redirect to `(auth)/login`
3. Session exists → Redirect to `(tabs)`
4. Auth layouts prevent unauthorized access

**Configuration:** `lib/supabase.ts`
- Environment variables: `.env` file with `EXPO_PUBLIC_` prefix
- AsyncStorage for session persistence
- `persistSession: false` (security), auto-refresh via AppState
- **Important:** Never commit `.env` file (already in `.gitignore`)

**Auth Hook:** `hooks/use-auth.ts`
- Monitors Supabase auth state changes via `onAuthStateChange`
- Returns `{ session, loading }`
- Used in `app/index.tsx` and `app/(auth)/_layout.tsx` for navigation guards

**AppState Refresh:** `app/_layout.tsx`
- Listens to `AppState` changes (active/background)
- Calls `startAutoRefresh()` when app becomes active
- Calls `stopAutoRefresh()` when backgrounded
- Compensates for `persistSession: false` setting

### Database Schema (Supabase)

**profiles table:**
- `id`, `user_id`, `email`, `full_name`
- `is_premium` (boolean), `premium_expires_at`
- `created_at`, `updated_at`

**face_analysis table:**
- `id` (UUID primary key)
- `user_id` (UUID, references auth.users)
- `landmarks` (JSONB: array of 468 {x, y, z, index} objects)
- `analysis_data` (JSONB):
  ```json
  {
    "totalPoints": 468,
    "confidence": 0.95,
    "faceBox": { "x": 123, "y": 234, "width": 267, "height": 289 },
    "regionDetails": {
      "totalRegions": 15,
      "regionNames": ["faceOval", "forehead", ...],
      "pointCounts": { "faceOval": 36, "forehead": 31, ... }
    },
    "imageSize": { "width": 512, "height": 512 },
    "timestamp": 1705234567890
  }
  ```
- `created_at` (TIMESTAMPTZ)

### MediaPipe Integration (Critical)

**Hybrid WebView Approach** - NOT using native MediaPipe directly.

**Implementation:** `app/(tabs)/index.tsx` (1000+ lines)
- Embeds MediaPipe Web library via CDN in hidden WebView
- Communicates via `postMessage` API
- Processes images at 512x512 resolution (optimal for MediaPipe)

**Workflow:**
```
Camera/Gallery (expo-image-picker)
  ↓
Resize to 512x512 (expo-image-manipulator)
  ↓
Convert to base64
  ↓
Inject to WebView → window.processImage(base64)
  ↓
MediaPipe Face Mesh analysis
  ↓
468 landmarks returned via postMessage
  ↓
Save to Supabase (face_analysis table)
  ↓
Navigate to analysis screen
```

**Face Regions Detected:**
- Face oval, forehead, jawline
- Left/right eyes and eyebrows
- Nose (bridge, tip, wings)
- Upper/lower lips and outline
- All 468 landmarks with 3D coordinates (x, y, z)

**MediaPipe Configuration (in WebView):**
```javascript
faceMesh.setOptions({
  maxNumFaces: 1,                    // Single face detection
  refineLandmarks: false,            // Faster processing, less iris/lip detail
  minDetectionConfidence: 0.5,       // 50% confidence threshold
  minTrackingConfidence: 0.0,        // Not used (static images)
  selfieMode: false,                 // No horizontal flip
  staticImageMode: true,             // Optimized for photos, not video
  modelComplexity: 1                 // Medium model (0=lite, 1=full, 2=attention)
});
```

**WebView Communication Protocol:**
- **RN → WebView:** `webViewRef.current?.injectJavaScript(\`window.processImage('${base64}')\`)`
- **WebView → RN:** `window.ReactNativeWebView.postMessage(JSON.stringify({type, data}))`
- **Message Types:** `READY`, `LANDMARKS`, `NO_FACE`, `ERROR`

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

### Component Architecture

```
components/
├── ui/                          # Shadcn-style primitives
│   ├── button.tsx              # CVA variants
│   ├── card.tsx
│   ├── input.tsx
│   ├── text.tsx
│   └── ...
└── [themed/utility components]
```

**Styling Approach:**
- NativeWind classes for layout/colors (`className="bg-primary p-4"`)
- CVA for component variants (button sizes, colors)
- TextClassContext for propagating text styles to nested `<Text>` components
- `cn()` utility (tailwind-merge + clsx) for conditional classes
- No inline styles (prefer className)

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

### metro.config.js
- NativeWind metro plugin
- Global CSS: `./global.css`

### tsconfig.json
- Strict mode enabled
- Path alias: `@/*` → project root
- Expo base config

## State Management

**No global state library** (Redux/Zustand/etc.)
- Local component state with `useState`/`useEffect`
- Supabase for server state
- AsyncStorage for local persistence

## Known Incomplete Features

1. **Analysis Screen** - Placeholder UI only (`app/(tabs)/analysis.tsx` - 9 lines)
   - Face landmarks are saved to database but never displayed
   - No face metrics calculation (symmetry, proportions, angles)

2. **History Screen** - Placeholder UI only (`app/(tabs)/history.tsx` - 18 lines)
   - No database queries to fetch past analyses
   - No UI to display previous scans

3. **Premium Payment** - UI exists but no integration
   - All premium screens are placeholders (`app/premium/*.tsx`)
   - No Stripe/RevenueCat payment flow
   - Analysis limits not enforced (hardcoded "2/5 remaining")
   - Route mismatch: `subscription.tsx` file but `subscribe` route in layout

4. **Profile Stats** - Hardcoded values (not from database)

5. **Unused Code**
   - `hooks/use-user.ts` defined but never imported
   - `@tensorflow-models/face-landmarks-detection` installed but not used
   - `react-native-mediapipe` installed but not used (WebView approach chosen instead)

## Security Notes

1. **Environment Variables**: Credentials stored in `.env` file
   - Uses `EXPO_PUBLIC_` prefix (required by Expo for client-side vars)
   - `.env` is gitignored, `.env.example` provides template
   - Access via `process.env.EXPO_PUBLIC_SUPABASE_URL`
   - Missing variables will throw error at startup

2. **Session Handling**: `persistSession: false` for security, manual refresh via AppState listener in `app/_layout.tsx`

## Important Implementation Details

### Image Processing (Critical Requirements)
- **ALWAYS resize to 512x512** before MediaPipe analysis (non-negotiable for accuracy)
- Use `expo-image-manipulator` with the new API:
  ```typescript
  const context = ImageManipulator.manipulate(imageUri);
  context.resize({ width: 512, height: 512 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.9,
    base64: true  // Required for WebView communication
  });
  ```
- **Why 512x512?** MediaPipe Face Mesh training data optimized for this resolution
- Square aspect ratio prevents face distortion
- Old `manipulateAsync()` API is deprecated

### MediaPipe Face Regions (15 Total)
Pre-defined index arrays hardcoded in WebView for extracting specific face parts from 468 landmarks:
- `faceOval` (36 points), `forehead` (31 points), `jawline` (37 points)
- `leftEye` (35 points), `rightEye` (37 points)
- `leftEyebrow` (20 points), `rightEyebrow` (20 points)
- `nose` (35 points), `noseBridge` (21 points), `noseTip` (18 points), `noseWings` (27 points)
- `lips` (32 points), `upperLip` (42 points), `lowerLip` (38 points), `mouthOutline` (52 points)

These indices reference MediaPipe's fixed 468-point face mesh topology.

### Premium Feature Gating
- Check `is_premium` flag from profiles table
- Show upgrade prompts for free users
- Current limit: 2/5 analyses remaining (hardcoded)

## Development Tips

### WebView Debugging
- MediaPipe runs in WebView (hidden: 1x1 pixels, opacity: 0), not directly in React Native
- Communication: `injectJavaScript()` (RN → WebView) and `onMessage` (WebView → RN)
- Message types: `READY`, `LANDMARKS`, `NO_FACE`, `ERROR`
- Canvas visualization shows face mesh overlay in WebView
- WebView must have `javaScriptEnabled={true}` and `domStorageEnabled={true}`

### Type Safety
- TypeScript strict mode enforced
- Define interfaces for Profile, FaceLandmarks
- Expo Router generates typed routes (experimental)

### Performance
- MediaPipe in WebView offloads heavy ML processing
- 512x512 image size balances quality vs. speed
- Use `react-native-reanimated` for smooth UI animations
- WebView is hidden (1x1 pixels, opacity: 0) to reduce rendering overhead

### Common Gotchas
1. **Reanimated plugin MUST be last** in `babel.config.js` plugins array
2. **512x512 resize is mandatory** - other sizes reduce MediaPipe accuracy significantly
3. **WebView requires `javaScriptEnabled={true}`** - MediaPipe won't load without it
4. **`EXPO_PUBLIC_` prefix is required** for client-side environment variables in Expo
5. **Session persistence is manual** - handled via AppState listener, not automatic
6. **Typed routes are experimental** - may break with Expo Router updates
7. **Cache must be cleared** after `.env` changes (`npx expo start --clear`)

## Critical Dependencies

**Must have:**
- expo-camera (requires camera permissions)
- react-native-webview (MediaPipe won't work without)
- @supabase/supabase-js (backend dependency)

**Peer dependencies:**
- React 19.1.0
- React Native 0.81.4 (via Expo 54)

## Future Development Priorities

1. Implement actual analysis screen with facial metrics
2. Connect history screen to `face_analysis` table
3. Add payment integration for premium features
4. Consider native MediaPipe for better performance (currently uses WebView)
5. Add offline support with local caching
6. Fix premium route mismatch (`subscription.tsx` vs `subscribe` route)
