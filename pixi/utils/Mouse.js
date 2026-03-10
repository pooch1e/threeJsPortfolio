export class Mouse {
  constructor(canvas) {
    this.canvas = canvas;

    this.x = canvas.width / 2;
    this.y = canvas.height / 2;

    // Normalized 0-1, top-left origin — default to center
    this.normalized = { x: 0.5, y: 0.5 };

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.x = e.clientX - rect.left;
      this.y = e.clientY - rect.top;
      this.normalized.x = this.x / rect.width;
      this.normalized.y = this.y / rect.height;
    };

    this.canvas.addEventListener('mousemove', this._onMouseMove);
  }

  destroy() {
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
  }
}
