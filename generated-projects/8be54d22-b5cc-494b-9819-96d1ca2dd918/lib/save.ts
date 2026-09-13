export interface GameState {
  health: number;
  money: number;
  wanted: number;
  mission: number;
  missionProgress: number;
  time: number;
}

export function saveGame(state: GameState) {
  localStorage.setItem('crimeGameSave', JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const data = localStorage.getItem('crimeGameSave');
  if (data) {
    try {
      return JSON.parse(data) as GameState;
    } catch {
      return null;
    }
  }
  return null;
}