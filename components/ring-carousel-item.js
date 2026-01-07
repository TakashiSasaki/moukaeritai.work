class RingCarouselItem extends HTMLElement {
    constructor() {
        super();
        // Ensure proper display if not set by CSS
        this.style.display = 'flex';
    }

    configure({ size, color, label }) {
        this.className = 'carousel-item';
        this.style.width = size + 'px';
        this.style.height = size + 'px';
        this.style.backgroundColor = color;

        // Font size logic based on size (migrated from loop)
        if (size === 60) this.style.fontSize = '0.7rem';
        else if (size === 120) this.style.fontSize = '1.2rem';
        else if (size === 240) this.style.fontSize = '2rem';
        else if (size === 480) this.style.fontSize = '3rem';

        this.textContent = label;
    }
}
customElements.define('ring-carousel-item', RingCarouselItem);
