# RingCarousel Design Specification

**File:** `components/ring-carousel.js`
**Tag:** `<ring-carousel>`

A Custom Element that provides an infinite, draggable carousel container. It uses DOM recycling to simulate an infinite track and encapsulates its logic and styling using Shadow DOM.

## Class Definition

```javascript
class RingCarousel extends HTMLElement
```

## Features

- **Infinite Scrolling:** Simulates an infinite loop by moving standard DOM elements (`RingCarouselItem`) from one end of the track to the other as the user drags.
- **Pointer Events:** Uses `setPointerCapture` and unified pointer events (`pointerdown`, `pointermove`, `pointerup`) for consistent touch and mouse dragging interaction.
- **Shadow DOM Encapsulation:** Isolates the track layout and container styles from the main document.
- **Self-Initializing:** Automatically populates itself with `RingCarouselItem` elements based on the container width and configured item size.

## Attributes

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `item-size` | `number` | `60` | Defines the width/height of the carousel items (in px). Also sets the carousel height. |
| `row` | `number` | `1` | A simplified identifier used for generation of item labels (e.g., `(1, 1)`). |

## Internal Logic

### Infinite Recycle Mechanism (`checkBoundary`)
The "ring" effect is achieved by checking the `currentTranslate` position against the `itemSize`:
1.  **Dragging Left:** If `currentTranslate <= -itemSize` (one full item scrolled off-screen), the **first** element in the track is appended to the **end**. The transform is then adjusted by `+itemSize` to visually reset the position.
2.  **Dragging Right:** If `currentTranslate > 0` (gap appearing on left), the **last** element is moved to the **front**. The transform is adjusted by `-itemSize`.

This logic ensures the DOM size remains constant (view width / item size + buffer) while allowing infinite movement.

### Shadow DOM Structure

```html
<shadow-root>
  <style>
    :host {
        display: block;
        width: 100%;
        height: [item-size];
        overflow: hidden;
        /* ...styles for background, cursor, border... */
    }
    .carousel-track {
        display: flex;
        width: max-content;
        will-change: transform;
    }
  </style>
  <div class="carousel-track">
    <!-- RingCarouselItem elements are injected here -->
  </div>
</shadow-root>
```

### Color Coding
The carousel automatically assigns colors to items based on the `item-size` attribute:
- `60px`: Green (`#238636`) + Low Opacity Track
- `120px`: Blue (`#1f6feb`) + Medium Opacity Track
- `240px`: Purple (`#a371f7`) + High Opacity Track
- `480px`: Orange (`#f78166`) + Higher Opacity Track

## Usage Example

```html
<ring-carousel item-size="120" row="2"></ring-carousel>
```
*Note: The element must be registered after the script loads.*
