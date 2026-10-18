import * as THREE from 'three';

export interface Vehicle {
  mesh: THREE.Group;
  update: (delta: number) => void;
}

export function createVehicles(scene: THREE.Scene): Vehicle[] {
  const vehicles: Vehicle[] = [];
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
  const positions = [
    [5, 0, 5], [-5, 0, 5], [5, 0, -5], [-5, 0, -5], [0, 0, 10],
  ];

  positions.forEach((pos, index) => {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: colors[index % colors.length] });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), bodyMat);
    body.position.y = 0.5;
    group.add(body);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2), cabinMat);
    cabin.position.set(0, 1.2, -0.5);
    group.add(cabin);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
    const wheelPositions = [[-0.8, 0.4, 1.2], [0.8, 0.4, 1.2], [-0.8, 0.4, -1.2], [0.8, 0.4, -1.2]];
    wheelPositions.forEach(wp => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp[0], wp[1], wp[2]);
      group.add(wheel);
    });
    group.position.set(pos[0], 0, pos[2]);
    scene.add(group);

    vehicles.push({
      mesh: group,
      update(delta) {
        // Simple idle movement for traffic
        group.position.x += Math.sin(Date.now() * 0.001) * delta * 0.1;
      },
    });
  });
  return vehicles;
}