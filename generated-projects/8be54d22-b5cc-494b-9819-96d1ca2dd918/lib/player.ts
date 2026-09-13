import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export interface Player {
  mesh: THREE.Group;
  position: THREE.Vector3;
  health: number;
  money: number;
  update: (delta: number, controls: PointerLockControls) => void;
}

// Key state map for movement
export const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

// Initialize keyboard listeners (call once)
export function initKeyboardControls() {
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        break;
    }
  });

  window.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
    }
  });
}

export function createPlayer(scene: THREE.Scene): Player {
  const group = new THREE.Group();
  // Body
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2255aa });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.5), bodyMat);
  body.position.y = 1.25;
  group.add(body);
  // Head
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
  head.position.y = 2.25;
  group.add(head);
  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const legGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.2, 0.5, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.2, 0.5, 0);
  group.add(rightLeg);

  group.position.set(0, 0, 0);
  scene.add(group);

  const player: Player = {
    mesh: group,
    position: group.position,
    health: 100,
    money: 0,
    update(delta, controls) {
      // Movement
      const speed = 5;
      const direction = new THREE.Vector3();
      if (controls.isLocked) {
        // Forward/backward
        if (keys.forward) direction.z = -1;
        if (keys.backward) direction.z = 1;
        // Left/right
        if (keys.left) direction.x = -1;
        if (keys.right) direction.x = 1;
        direction.normalize();
        // Apply camera direction
        const cameraDir = new THREE.Vector3();
        controls.getDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();
        const right = new THREE.Vector3().crossVectors(cameraDir, new THREE.Vector3(0, 1, 0));
        const move = new THREE.Vector3()
          .addScaledVector(cameraDir, -direction.z)
          .addScaledVector(right, direction.x);
        move.normalize().multiplyScalar(speed * delta);
        group.position.add(move);
      }
    },
  };
  return player;
}
