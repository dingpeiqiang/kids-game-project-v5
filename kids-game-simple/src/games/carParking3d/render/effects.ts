import * as THREE from 'three';

/** 屏幕边缘红色闪一下（碰撞反馈） */
export function flashCollision(container: HTMLElement): void {
  let el = container.querySelector('.cp3d-vignette') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.className = 'cp3d-vignette';
    el.style.cssText =
      'position:absolute;inset:0;pointer-events:none;z-index:18;opacity:0;transition:opacity .12s;background:radial-gradient(ellipse at center,transparent 40%,rgba(220,40,40,.45) 100%);';
    container.appendChild(el);
  }
  el.style.opacity = '1';
  requestAnimationFrame(() => {
    setTimeout(() => {
      el!.style.opacity = '0';
    }, 80);
  });
}

/** 停稳入位时车位高亮脉冲 */
export function pulseParkingSpot(group: THREE.Group): void {
  const area = group.getObjectByName('parkingArea') as THREE.Mesh | undefined;
  if (!area?.material || !(area.material as THREE.MeshBasicMaterial).color) return;
  const mat = area.material as THREE.MeshBasicMaterial;
  const base = mat.opacity;
  let t = 0;
  const tick = () => {
    t += 0.08;
    mat.opacity = base + Math.sin(t) * 0.15;
    if (t < Math.PI * 2) requestAnimationFrame(tick);
    else mat.opacity = base;
  };
  tick();
}