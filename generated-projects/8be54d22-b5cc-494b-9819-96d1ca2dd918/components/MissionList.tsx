import { Mission } from '@/lib/missions';

export function MissionList({ missions, current, progress }: { missions: Mission[]; current: number; progress: number }) {
  return (
    <div className="absolute top-4 right-4 z-20 bg-black/50 text-white p-4 rounded-lg w-64">
      <h2 className="font-bold mb-2">Missions</h2>
      <ul className="space-y-1">
        {missions.map((mission, index) => (
          <li
            key={mission.id}
            className={`p-2 rounded ${index === current ? 'bg-blue-500' : index < current ? 'bg-green-500' : 'bg-gray-700'}`}
          >
            <span className="font-semibold">{mission.name}</span>
            {index === current && (
              <div className="text-sm">Progress: {progress}/{mission.objectives.length}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}