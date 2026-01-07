# Experimental Layout 1 - Multi-Row "Ring" Carousel

## Overview
This experimental layout implements a vertically stacked set of carousels with heterogeneous heights and varying content sizes. The primary goal is to test a "ring" (circular) recycling logic where items wrap around infinitely while maintaining persistent identification labels.

## Visual Design
- **Stacking:** Four carousel areas are stacked vertically with **zero margin/gap**.
- **Heights:** 
  - Row 1: 60px
  - Row 2: 120px
  - Row 3: 240px
  - Row 4: 480px (Lower-most "foundation" area)
- **Colors:** Each row has a distinct background opacity and item color for visual hierarchy.
  - 60px: Green items (`#238636`)
  - 120px: Blue items (`#1f6feb`)
  - 240px: Purple items (`#a371f7`)
  - 480px: Orange items (`#f78166`)

## Technical Implementation

### 1. Unified Interaction (Pointer Events)
To prevent event collision between Mouse and Touch (especially on systems that emulate touch), the implementation uses **Pointer Events** (`pointerdown`, `pointermove`, `pointerup`).
- `setPointerCapture` is used to ensure the drag session continues even if the pointer leaves the carousel bounds.
- `dragstart` is prevented to avoid browser default image/text dragging.

### 2. Infinite Loop ("Ring") Logic
Instead of an endless list of new items, the carousel uses a **fixed set of DOM elements**:
- The number of items is calculated based on `Math.ceil(containerWidth / itemSize) + 1`.
- When an item scrolls completely off one edge, it is physically moved to the opposite end of the `carousel-track` div.
- The `translateX` transform is adjusted simultaneously to keep the visual position stable during the DOM shift.
- **Labels:** Items use a coordinate-based label `(Row, Index)`. These indices are established on page load and remain constant as the item rotates through the ring.

### 3. Performance & Stability
- **Animation Frames:** Dragging is handled via `requestAnimationFrame` (RAF).
- **Concurrency Control:** `cancelAnimationFrame` is called at the start of each input event to ensure only one position update/boundary check happens per frame, preventing "violent" flickering or skipping during high-frequency mouse movements.
- **Modulo Smoothing:** The `while` loop in the boundary check allows the carousel to handle large shifts (faster than item size per frame) gracefully by recycling multiple nodes if necessary.

## File Structure
- `experimental-layout-1.html`: Self-contained HTML/CSS/JS implementation.
