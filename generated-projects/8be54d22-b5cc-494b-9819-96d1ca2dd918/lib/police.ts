import * as THREE from 'three';

export interface Police {
  wantedLevel: number;
  update: (delta: number, playerPos: THREE.Vector3) => void;
}

export function createPolice(scene: THREE.Scene): Police {
  // Police car
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), bodyMat);
  body.position.y = 0.5;
  group.add(body);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), lightMat);
  light.position.set(0, 1.2, 0);
  group.add(light);
  group.position.set(10, 0, 10);
  scene.add(group);

  let wantedLevel = 0;
  let lastCrimeTime = 0;

  return {
    wantedLevel,
    update(delta, playerPos) {
      // Simple wanted system: if player is near police car, increase wanted
      const distance = group.position.distanceTo(playerPos);
      if (distance < 5) {
        wantedLevel = Math.min(5, wantedLevel + delta);
      } else {
        wantedLevel = Math.max(0, wantedLevel - delta * 0.5);
      }
      // Move police car towards player if wanted > 0
      if (wantedLevel > 0) {
        const dir = new THREE.Vector3().subVectors(playerPos, group.position).normalize();
        group.position.add(dir.multiplyScalar(delta * 2));
      }
    },
  };
}