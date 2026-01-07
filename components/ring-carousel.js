class RingCarousel extends HTMLElement {
    constructor() {
        super();
        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.animationID = null;
    }

    connectedCallback() {
        // Prevent double initialization
        if (this.querySelector('.carousel-track')) return;

        this.itemSize = parseInt(this.getAttribute('item-size'), 10) || 60;
        this.row = parseInt(this.getAttribute('row'), 10) || 1;

        this.render();
        this.setupInteractions();
    }

    disconnectedCallback() {
        this.cleanupInteractions();
    }

    render() {
        // Create Track
        this.track = document.createElement('div');
        this.track.className = 'carousel-track';

        // Ensure the track is styled correctly for transformations
        this.track.style.display = 'flex';
        this.track.style.height = '100%';
        this.track.style.width = 'max-content';
        this.track.style.userSelect = 'none';
        this.track.style.willChange = 'transform';

        this.appendChild(this.track);

        // Calculate count based on container width
        // Use clientWidth. If 0 (hidden), might need a resize observer or default.
        // For now, assuming visible.
        const containerWidth = this.clientWidth || window.innerWidth;
        const count = Math.ceil(containerWidth / this.itemSize) + 1; // +1 for buffer

        // Determine Color
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
        // Bind methods
        this._onDown = this.onDown.bind(this);
        this._onMove = this.onMove.bind(this);
        this._onUp = this.onUp.bind(this);
        this._updatePosition = this.updatePosition.bind(this);

        this.addEventListener('pointerdown', this._onDown);
        this.addEventListener('pointermove', this._onMove);
        this.addEventListener('pointerup', this._onUp);
        this.addEventListener('pointerleave', this._onUp);
        this.addEventListener('dragstart', (e) => e.preventDefault());

        // Set cursor style
        this.style.cursor = 'grab';
        this.style.touchAction = 'pan-y'; // Allow vertical scroll
        this.style.overflow = 'hidden'; // Ensure it clips
        this.style.display = 'block';   // Ensure it has layout
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

        // Moving Left ->
        while (this.currentTranslate <= -itemSize) {
            track.appendChild(track.firstElementChild);
            this.currentTranslate += itemSize;
            this.prevTranslate += itemSize;
        }

        this.track.style.transform = `translateX(${this.currentTranslate}px)`;

        // Moving Right <-
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
