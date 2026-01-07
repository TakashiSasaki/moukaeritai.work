class RingCarouselItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // Initial rendering if needed, though configure usually handles it
    }

    configure({ size, color, label }) {
        // Determine font size based on size
        let fontSize = '1rem';
        if (size === 60) fontSize = '0.7rem';
        else if (size === 120) fontSize = '1.2rem';
        else if (size === 240) fontSize = '2rem';
        else if (size === 480) fontSize = '3rem';

        const style = `
            :host {
                display: flex;
                align-items: center;
                justify-content: center;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 1px solid #0d1117;
                color: white;
                font-weight: bold;
                flex-shrink: 0;
                box-sizing: border-box;
                font-size: ${fontSize};
                user-select: none;
            }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <span>${label}</span>
        `;
    }
}
customElements.define('ring-carousel-item', RingCarouselItem);
