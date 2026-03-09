import { CursorSnap } from './CursorSnap';

export class AdaptivePrecisionWorld {
  constructor(experience) {
    this.experience = experience;
    this.cursorSnap = new CursorSnap(this);
  }

  init() {
    return this.cursorSnap.init?.();
  }

  update(ticker) {
    this.cursorSnap.update?.(ticker);
  }

  resize(width, height) {
    this.cursorSnap.resize?.(width, height);
  }

  destroy() {
    this.cursorSnap.destroy?.();
  }
}
