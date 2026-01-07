# RingCarouselItem Design Specification

**File:** `components/ring-carousel-item.js`
**Tag:** `<ring-carousel-item>`

A Custom Element representing a single item within a `RingCarousel`. It is designed to be self-contained using Shadow DOM, handling its own layout, sizing, and styling based on configuration.

## Class Definition

```javascript
class RingCarouselItem extends HTMLElement
```

## Features

- **Shadow DOM Encapsulation:** Uses `attachShadow({ mode: 'open' })` to isolate styles and structure.
- **Dynamic Configuration:** Does not rely on static attributes for initial setup; instead uses a `configure()` method for programmatic initialization (typically called by the parent `RingCarousel`).
- **Responsive Typography:** Automatically scales font size based on the item's dimension.
- **Visual Gaps:** Implements a `1px` border matching the container background to simulate gaps between items without disrupting layout calculations.

## API

### `configure({ size, color, label })`

Configures the appearance and content of the item. This method injects the necessary styles and HTML into the Shadow DOM.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `size` | `number` | Width and height of the item in pixels. |
| `color` | `string` | Background color (CSS value). |
| `label` | `string` | Text content to display centered in the item. |

**Style Logic:**

- **Host Styling (`:host`)**:
  - `display: flex`: Centers content.
  - `width` / `height`: Set to `size` px.
  - `background-color`: Set to `color`.
  - `border`: `1px solid #161b22` (Container background color) to create a visual separator.
  - `box-sizing: border-box`: Ensures border is included in the width/height (essential for accurate carousel math).
  - `user-select: none`: Prevents text selection during dragging.

- **Font Sizing Strategy:**

| Size (px) | Font Size |
| :--- | :--- |
| 60 | `0.7rem` |
| 120 | `1.2rem` |
| 240 | `2.0rem` |
| 480 | `3.0rem` |
| Other | `1.0rem` (Default) |

## DOM Structure (Shadow Root)

```html
<shadow-root>
  <style>
    :host { ... }
  </style>
  <span>(Label Text)</span>
</shadow-root>
```

## Usage Example

```javascript
const item = new RingCarouselItem();
item.configure({
    size: 120,
    color: '#ff0000',
    label: '(1, 1)'
});
document.body.appendChild(item);
```
