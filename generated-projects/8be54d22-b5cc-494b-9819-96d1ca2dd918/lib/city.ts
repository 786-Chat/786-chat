import * as THREE from 'three';

export function createCity(scene: THREE.Scene) {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Roads
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const roadGeo = new THREE.BoxGeometry(10, 0.1, 200);
  const road1 = new THREE.Mesh(roadGeo, roadMat);
  road1.position.set(0, 0.05, 0);
  scene.add(road1);
  const road2 = new THREE.Mesh(roadGeo, roadMat);
  road2.rotation.y = Math.PI / 2;
  road2.position.set(0, 0.05, 0);
  scene.add(road2);

  // Buildings (reusable low-poly boxes)
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const buildingGeo = new THREE.BoxGeometry(8, 10, 8);
  const positions = [
    [20, 5, 20], [-20, 5, 20], [20, 5, -20], [-20, 5, -20],
    [30, 5, 0], [-30, 5, 0], [0, 5, 30], [0, 5, -30],
    [15, 5, 15], [-15, 5, 15], [15, 5, -15], [-15, 5, -15],
  ];
  positions.forEach(pos => {
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(pos[0], pos[1], pos[2]);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  });

  // Trees (simple cones)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 2);
  const leafGeo = new THREE.ConeGeometry(2, 3, 8);
  const treePositions = [[10, 0, 10], [-10, 0, 10], [10, 0, -10], [-10, 0, -10], [25, 0, 25], [-25, 0, 25]];
  treePositions.forEach(pos => {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(pos[0], 1, pos[2]);
    scene.add(trunk);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(pos[0], 3.5, pos[2]);
    scene.add(leaf);
  });

  // Street lights
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa });
  const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 5);
  const lightGeo = new THREE.SphereGeometry(0.5);
  const lightPositions = [[5, 0, 0], [-5, 0, 0], [0, 0, 5], [0, 0, -5]];
  lightPositions.forEach(pos => {
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(pos[0], 2.5, pos[2]);
    scene.add(pole);
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(pos[0], 5, pos[2]);
    scene.add(light);
  });
}