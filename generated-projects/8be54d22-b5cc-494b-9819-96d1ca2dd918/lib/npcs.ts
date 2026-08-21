import * as THREE from 'three';

export interface NPC {
  mesh: THREE.Group;
  update: (delta: number) => void;
}

export function createNPCs(scene: THREE.Scene): NPC[] {
  const npcs: NPC[] = [];
  const colors = [0xffaa00, 0x00aaff, 0xff00aa, 0xaa00ff];
  const positions = [
    [3, 0, 3], [-3, 0, 3], [3, 0, -3], [-3, 0, -3],
    [8, 0, 8], [-8, 0, 8], [8, 0, -8], [-8, 0, -8],
  ];

  positions.forEach((pos, index) => {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: colors[index % colors.length] });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), bodyMat);
    body.position.y = 1.0;
    group.add(body);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), headMat);
    head.position.y = 1.8;
    group.add(head);
    group.position.set(pos[0], 0, pos[2]);
    scene.add(group);

    npcs.push({
      mesh: group,
      update(delta) {
        // Simple wandering
        group.position.x += Math.sin(Date.now() * 0.001 + index) * delta * 0.2;
        group.position.z += Math.cos(Date.now() * 0.001 + index) * delta * 0.2;
      },
    });
  });
  return npcs;
}