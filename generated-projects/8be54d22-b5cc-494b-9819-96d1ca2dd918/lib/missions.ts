export interface Mission {
  id: number;
  name: string;
  description: string;
  objectives: string[];
}

export const missions: Mission[] = [
  {
    id: 0,
    name: 'Welcome to the City',
    description: 'Explore the city and get familiar with the controls.',
    objectives: ['Reach the park', 'Talk to the contact'],
  },
  {
    id: 1,
    name: 'First Job',
    description: 'Steal a car and deliver it to the garage.',
    objectives: ['Steal a car', 'Drive to the garage'],
  },
  {
    id: 2,
    name: 'Chase',
    description: 'Lose the police in a high-speed chase.',
    objectives: ['Escape the police', 'Reach the safehouse'],
  },
  {
    id: 3,
    name: 'Robbery',
    description: 'Rob the convenience store.',
    objectives: ['Enter the store', 'Get the cash', 'Escape'],
  },
  {
    id: 4,
    name: 'Final Showdown',
    description: 'Defeat the rival gang leader.',
    objectives: ['Find the hideout', 'Defeat the boss'],
  },
];