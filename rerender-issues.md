# React Infinite Render Issues - Analysis & Fixes

## ✅ All Infinite Render Issues FIXED

This document provides a summary of the issues that caused infinite render loops and the best-practice solutions that were implemented to fix them.

---

### **Issue #1: Context Provider & Function Dependencies**
- **Problem**: A large, single context provider with over 30 dependencies caused cascading re-renders. Functions within the context depended on other functions, creating unstable references that changed on every state update.
- **Solution**: 
  - **Split the context** into `CitationDataContext`, `CitationActionsContext`, and `CitationComputedContext` to separate state, actions, and derived data.
  - **Used the dispatch pattern** for all actions, ensuring they have no dependencies and are created only once.
  - **Moved complex logic** (like unique ID generation) into the reducer to break function dependency chains.

### **Issue #2: Citation.js Instance Recreation**
- **Problem**: A new `Cite` instance from `citation-js` was created on every data change, breaking referential equality and causing unnecessary re-renders throughout the component tree.
- **Solution**:
  - **Implemented a `citationDataChanged` helper** to perform a shallow comparison of entry data, preventing instance recreation if the underlying data hadn't meaningfully changed.
  - **Introduced a `citeVersion` number** in the state, which is only incremented when the `Cite` instance is actually replaced. Components now depend on this primitive value, which is more stable than the object reference.

### **Issue #3: Stale Closures in Memoized Functions**
- **Problem**: `useMemo` and `useCallback` hooks with empty dependency arrays (`[]`) were used to create stable functions, but these functions accessed `state` directly, leading to stale closures where they would operate on outdated state data.
- **Solution**:
  - **Implemented the `useRef` pattern**. A `stateRef` was created to hold the latest state, and it is updated via a `useEffect` hook.
  - All memoized functions now access `stateRef.current` to guarantee they are always working with the most up-to-date state, eliminating stale closures entirely.

### **Issue #4: Duplicate Dispatch Calls**
- **Problem**: Even with stable callbacks, in some scenarios, the `updateEntry` action was being called multiple times in quick succession, re-initiating the update cycle.
- **Solution**:
  - **Implemented a debouncing mechanism** directly within the `updateEntry` action in the context.
  - This prevents the `dispatch` from being called if the same update action is triggered for the same entry within a 100ms window, effectively stopping the duplicate call loop.

---

## Final Outcome

By applying these fixes, all identified infinite render loops have been resolved. The application is now more performant, stable, and maintainable due to:
- **Stable function and object references** across re-renders.
- **Minimal and efficient context updates**.
- **Clear separation of concerns** in state management.
- **Elimination of stale closures and race conditions**.
