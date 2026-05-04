export class ComboSystem {
  count  = 0;
  max    = 0;
  private timer  = 0;
  private readonly TIMEOUT = 1800; // ms

  update(delta: number) {
    if (this.count < 3) return;
    this.timer -= delta;
    if (this.timer <= 0) {
      this.count = 0;
    }
  }

  addKill() {
    this.count++;
    this.timer = this.TIMEOUT;
    if (this.count > this.max) this.max = this.count;
  }

  reset() {
    this.count = 0;
    this.timer = 0;
    this.max   = 0;
  }
}
