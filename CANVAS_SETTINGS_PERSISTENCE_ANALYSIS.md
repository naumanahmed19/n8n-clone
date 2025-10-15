# Canvas Settings Persistence Analysis

## Current State: ❌ NOT PERSISTED

### Where Settings Are Stored

Currently, all canvas settings are stored **only in memory** using Zustand state management:

**File**: `frontend/src/stores/reactFlowUI.ts`

```typescript
export const useReactFlowUIStore = createWithEqualityFn<ReactFlowUIState>(
  (set, get) => ({
    // Initial state
    reactFlowInstance: null,
    showMinimap: true,
    showBackground: true,
    showControls: true,
    backgroundVariant: "dots",
    panOnDrag: true,
    zoomOnScroll: true,
    canvasBoundaryX: 2000,
    canvasBoundaryY: 500,
    showExecutionPanel: false,
    executionPanelSize: 4,
    // ... actions
  }),
  shallow
);
```

### Current Behavior

- ❌ Settings **reset to defaults** on page refresh
- ❌ Settings **not shared** across different browsers
- ❌ Settings **not saved** to database
- ❌ Settings **lost** when clearing browser data
- ✅ Settings **work** during a single session

## Database Status

### User Table

Looking at `backend/prisma/schema.prisma`, the User model currently has:

```prisma
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  password    String
  name        String?
  role        UserRole     @default(USER)
  active      Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  credentials Credential[]
  workflows   Workflow[]
  variables   Variable[]

  @@map("users")
}
```

**NO settings/preferences field exists!**

## Solution Options

### Option 1: LocalStorage Persistence (Quick & Simple) ⚡

**Pros:**

- ✅ Quick to implement (5 minutes)
- ✅ No database changes required
- ✅ No backend API needed
- ✅ Works immediately
- ✅ Persists across sessions

**Cons:**

- ❌ Not synced across devices
- ❌ Lost when clearing browser data
- ❌ Not backed up
- ❌ Per-browser storage only

**Implementation:**

```typescript
import { persist } from "zustand/middleware";

export const useReactFlowUIStore = createWithEqualityFn<ReactFlowUIState>()(
  persist(
    (set, get) => ({
      // ... existing state and actions
    }),
    {
      name: "reactflow-ui-settings",
      partialize: (state) => ({
        showMinimap: state.showMinimap,
        showBackground: state.showBackground,
        showControls: state.showControls,
        backgroundVariant: state.backgroundVariant,
        panOnDrag: state.panOnDrag,
        zoomOnScroll: state.zoomOnScroll,
        canvasBoundaryX: state.canvasBoundaryX,
        canvasBoundaryY: state.canvasBoundaryY,
      }),
    }
  ),
  shallow
);
```

### Option 2: Database Persistence (Robust & Scalable) 🗄️

**Pros:**

- ✅ Synced across all devices
- ✅ Backed up with user data
- ✅ Can be restored
- ✅ Professional solution
- ✅ Supports future features (themes, preferences)

**Cons:**

- ⏱️ Requires more work (~30 minutes)
- 🔧 Needs database migration
- 🌐 Requires API endpoints
- 💾 Adds server load

**Implementation Steps:**

#### 1. Update Prisma Schema

```prisma
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  password    String
  name        String?
  role        UserRole     @default(USER)
  active      Boolean      @default(true)
  preferences Json?        @default("{}") // NEW FIELD
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  credentials Credential[]
  workflows   Workflow[]
  variables   Variable[]

  @@map("users")
}
```

#### 2. Run Migration

```bash
cd backend
npx prisma migrate dev --name add_user_preferences
```

#### 3. Create Backend API

**File**: `backend/src/controllers/user.controller.ts`

```typescript
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferences },
      select: { preferences: true },
    });

    res.json({ success: true, preferences: user.preferences });
  } catch (error) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
};

export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    res.json({ preferences: user?.preferences || {} });
  } catch (error) {
    res.status(500).json({ error: "Failed to get preferences" });
  }
};
```

#### 4. Add Routes

**File**: `backend/src/routes/user.routes.ts`

```typescript
router.get("/preferences", auth, getPreferences);
router.put("/preferences", auth, updatePreferences);
```

#### 5. Create Frontend Service

**File**: `frontend/src/services/user.ts`

```typescript
export const userService = {
  async getPreferences() {
    const response = await apiClient.get("/users/preferences");
    return response.data.preferences;
  },

  async updatePreferences(preferences: any) {
    const response = await apiClient.put("/users/preferences", { preferences });
    return response.data.preferences;
  },
};
```

#### 6. Update Store with DB Sync

```typescript
export const useReactFlowUIStore = createWithEqualityFn<ReactFlowUIState>(
  (set, get) => ({
    // ... existing state

    // New actions for DB sync
    loadPreferences: async () => {
      try {
        const prefs = await userService.getPreferences();
        if (prefs.canvas) {
          set(prefs.canvas);
        }
      } catch (error) {
        console.error("Failed to load preferences", error);
      }
    },

    savePreferences: debounce(async () => {
      try {
        const state = get();
        await userService.updatePreferences({
          canvas: {
            showMinimap: state.showMinimap,
            showBackground: state.showBackground,
            showControls: state.showControls,
            backgroundVariant: state.backgroundVariant,
            panOnDrag: state.panOnDrag,
            zoomOnScroll: state.zoomOnScroll,
            canvasBoundaryX: state.canvasBoundaryX,
            canvasBoundaryY: state.canvasBoundaryY,
          },
        });
      } catch (error) {
        console.error("Failed to save preferences", error);
      }
    }, 1000),

    // Modify setters to auto-save
    setCanvasBoundaryX: (value) => {
      set({ canvasBoundaryX: value });
      get().savePreferences();
    },
    // ... update all other setters similarly
  }),
  shallow
);
```

#### 7. Initialize on App Load

```typescript
// In your app initialization (e.g., Layout component)
useEffect(() => {
  if (isAuthenticated) {
    useReactFlowUIStore.getState().loadPreferences();
  }
}, [isAuthenticated]);
```

### Option 3: Hybrid Approach (Best of Both) 🎯

Combine localStorage (instant) + database (sync):

```typescript
export const useReactFlowUIStore = createWithEqualityFn<ReactFlowUIState>()(
  persist(
    (set, get) => ({
      // ... state and actions including DB sync

      // Load from DB and merge with localStorage
      loadPreferences: async () => {
        try {
          const dbPrefs = await userService.getPreferences();
          if (dbPrefs.canvas) {
            set(dbPrefs.canvas);
          }
        } catch (error) {
          // Fallback to localStorage (already loaded by persist middleware)
          console.error("Failed to load DB preferences", error);
        }
      },
    }),
    {
      name: "reactflow-ui-settings", // localStorage key
      partialize: (state) => ({
        showMinimap: state.showMinimap,
        showBackground: state.showBackground,
        showControls: state.showControls,
        backgroundVariant: state.backgroundVariant,
        panOnDrag: state.panOnDrag,
        zoomOnScroll: state.zoomOnScroll,
        canvasBoundaryX: state.canvasBoundaryX,
        canvasBoundaryY: state.canvasBoundaryY,
      }),
    }
  ),
  shallow
);
```

**Benefits:**

- ✅ Instant load from localStorage
- ✅ Synced across devices via DB
- ✅ Works offline
- ✅ Backed up
- ✅ Best user experience

## Recommendation

### For MVP/Quick Fix: Option 1 (LocalStorage) ⚡

- Fast to implement
- Good enough for single-device users
- Can upgrade to DB later

### For Production/Multi-device: Option 3 (Hybrid) 🎯

- Best user experience
- Most robust solution
- Future-proof

## Implementation Priority

1. **Quick Win** (5 min): Add localStorage persistence
2. **Short Term** (30 min): Add database schema + API
3. **Future**: Add more user preferences (theme, language, etc.)

## Files to Modify

### Option 1 (LocalStorage Only):

- ✏️ `frontend/src/stores/reactFlowUI.ts`

### Option 2 (Database Only):

- ✏️ `backend/prisma/schema.prisma`
- ✏️ `backend/src/controllers/user.controller.ts`
- ✏️ `backend/src/routes/user.routes.ts`
- ✏️ `frontend/src/services/user.ts`
- ✏️ `frontend/src/stores/reactFlowUI.ts`

### Option 3 (Hybrid):

- ✏️ All of the above

## Next Steps

Choose an option and I can implement it for you! Which would you prefer?

1. **Quick** - LocalStorage only (5 min)
2. **Complete** - Database persistence (30 min)
3. **Best** - Hybrid approach (35 min)
