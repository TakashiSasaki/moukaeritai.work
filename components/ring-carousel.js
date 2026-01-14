class RingCarousel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.animationID = null;
    }

    connectedCallback() {
        if (this.shadowRoot.querySelector('.carousel-track')) return;

        this.itemSize = parseInt(this.getAttribute('item-size'), 10) || 60;
        this.row = parseInt(this.getAttribute('row'), 10) || 1;

        this.render();
        this.setupInteractions();
    }

    disconnectedCallback() {
        this.cleanupInteractions();
    }

    render() {
        // Define Styles
        const bgOpacity = this.itemSize === 60 ? 0.05 :
            this.itemSize === 120 ? 0.1 :
                this.itemSize === 240 ? 0.15 : 0.2;

        const style = `
            :host {
                display: block;
                width: 100%;
                height: ${this.itemSize}px;
                background-color: rgba(56, 139, 253, ${bgOpacity}); /* Replicating .h-60 etc */
                border: 1px dashed #30363d;
                border-radius: 6px;
                position: relative;
                overflow: hidden;
                touch-action: pan-y;
                cursor: grab;
                box-sizing: border-box;
                background-color: #161b22; /* Base color override from CSS */
            }
            :host(:active) {
                cursor: grabbing;
            }
            .carousel-track {
                display: flex;
                height: 100%;
                width: max-content;
                user-select: none;
                will-change: transform;
            }
        `;

        // Create Shadow Structure
        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="carousel-track"></div>
        `;

        this.track = this.shadowRoot.querySelector('.carousel-track');

        // Logic for Item Count
        const containerWidth = this.clientWidth || window.innerWidth;
        const count = Math.ceil(containerWidth / this.itemSize) + 1;

        // Determine Color logic (kept for consistency)
        let color = '#238636';
        if (this.itemSize === 120) color = '#1f6feb';
        else if (this.itemSize === 240) color = '#a371f7';
        else if (this.itemSize === 480) color = '#f78166';

        // Populate Items
        const RingCarouselItem = customElements.get('ring-carousel-item');

        for (let i = 0; i < count; i++) {
            const item = new RingCarouselItem();
            item.configure({
                size: this.itemSize,
                color: color,
                label: `(${this.row}, ${i + 1})`
            });
            this.track.appendChild(item);
        }
    }

    setupInteractions() {
        this._onDown = this.onDown.bind(this);
        this._onMove = this.onMove.bind(this);
        this._onUp = this.onUp.bind(this);
        this._updatePosition = this.updatePosition.bind(this);

        // Attach listeners to host
        this.addEventListener('pointerdown', this._onDown);
        this.addEventListener('pointermove', this._onMove);
        this.addEventListener('pointerup', this._onUp);
        this.addEventListener('pointerleave', this._onUp);
        this.addEventListener('dragstart', (e) => e.preventDefault());
    }

    cleanupInteractions() {
        this.removeEventListener('pointerdown', this._onDown);
        this.removeEventListener('pointermove', this._onMove);
        this.removeEventListener('pointerup', this._onUp);
        this.removeEventListener('pointerleave', this._onUp);
        cancelAnimationFrame(this.animationID);
    }

    updatePosition() {
        this.track.style.transform = `translateX(${this.currentTranslate}px)`;
        this.checkBoundary();
    }

    checkBoundary() {
        const itemSize = this.itemSize;
        const track = this.track;

        while (this.currentTranslate <= -itemSize) {
            track.appendChild(track.firstElementChild);
            this.currentTranslate += itemSize;
            this.prevTranslate += itemSize;
        }

        this.track.style.transform = `translateX(${this.currentTranslate}px)`;

        while (this.currentTranslate > 0) {
            track.insertBefore(track.lastElementChild, track.firstElementChild);
            this.currentTranslate -= itemSize;
            this.prevTranslate -= itemSize;
        }

        this.track.style.transform = `translateX(${this.currentTranslate}px)`;
    }

    onDown(e) {
        this.isDragging = true;
        this.startX = e.pageX;
        this.style.cursor = 'grabbing';
        this.setPointerCapture(e.pointerId);
        cancelAnimationFrame(this.animationID);
    }

    onMove(e) {
        if (!this.isDragging) return;
        cancelAnimationFrame(this.animationID);

        const currentX = e.pageX;
        const diff = currentX - this.startX;
        this.currentTranslate = this.prevTranslate + diff;

        this.animationID = requestAnimationFrame(this._updatePosition);
    }

    onUp(e) {
        this.isDragging = false;
        this.prevTranslate = this.currentTranslate;
        this.style.cursor = 'grab';
        this.releasePointerCapture(e.pointerId);
        cancelAnimationFrame(this.animationID);
    }
}

customElements.define('ring-carousel', RingCarousel);
