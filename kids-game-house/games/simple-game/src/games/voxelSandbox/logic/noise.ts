export class PerlinNoise {
  private permutation: number[];

  constructor(seed: number = 0) {
    this.permutation = new Array(512);
    this.init(seed);
  }

  private init(seed: number): void {
    const p = new Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    for (let i = 255; i > 0; i--) {
      const r = this.random(seed + i) % (i + 1);
      const temp = p[i];
      p[i] = p[r];
      p[r] = temp;
    }

    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255];
    }
  }

  private random(seed: number): number {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number = 0, z: number = 0): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u,
          this.grad(this.permutation[AA], x, y, z),
          this.grad(this.permutation[BA], x - 1, y, z)),
        this.lerp(u,
          this.grad(this.permutation[AB], x, y - 1, z),
          this.grad(this.permutation[BB], x - 1, y - 1, z))),
      this.lerp(v,
        this.lerp(u,
          this.grad(this.permutation[AA + 1], x, y, z - 1),
          this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
        this.lerp(u,
          this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
          this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))));
  }

  octaveNoise(x: number, y: number, octaves: number, persistence: number = 0.5, scale: number = 1): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency * scale, y * frequency * scale) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

export function getTerrainHeight(x: number, z: number, seed: number, scale: number, height: number): number {
  const noise = new PerlinNoise(seed);
  const n1 = noise.octaveNoise(x, z, 6, 0.5, 1 / scale);
  const n2 = noise.octaveNoise(x, z, 4, 0.5, 1 / (scale * 2));
  const n3 = noise.octaveNoise(x, z, 2, 0.5, 1 / (scale * 4));
  return (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * height;
}

export function getBiomeType(x: number, z: number, seed: number, height: number): 'grass' | 'sand' | 'snow' {
  const noise = new PerlinNoise(seed + 1000);
  const humidity = noise.octaveNoise(x, z, 4, 0.5, 1 / 100);
  
  if (height > 25) return 'snow';
  if (humidity < -0.2 && height < 5) return 'sand';
  return 'grass';
}