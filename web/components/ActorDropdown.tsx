import { ActorOption } from '@/lib/data-loader';

interface ActorDropdownProps {
  actors: ActorOption[];
  selectedActorId: string;
  onActorChange: (actorId: string) => void;
}

export default function ActorDropdown({ actors, selectedActorId, onActorChange }: ActorDropdownProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <select
        value={selectedActorId}
        onChange={(e) => onActorChange(e.target.value)}
        className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        {actors.map((actor) => (
          <option key={actor.id} value={actor.id}>
            {actor.name}
          </option>
        ))}
      </select>
    </div>
  );
}
