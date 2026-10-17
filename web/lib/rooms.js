export const MAP = { width: 600, height: 540 };

// Marker placement areas in pixels on the supplied image, clear of room numbers.
const ROOMS = {
  1: { x: 183, y: 88, width: 140, height: 145 },
  2: { x: 365, y: 65, width: 92, height: 32 },
  3: { x: 366, y: 157, width: 64, height: 24 },
  4: { x: 366, y: 248, width: 64, height: 22 },
  5: { x: 284, y: 403, width: 136, height: 30 },
};

export function placePeople(people) {
  const counts = new Map();
  for (const person of people) {
    const room = Number(person.roomNumber);
    counts.set(room, (counts.get(room) ?? 0) + 1);
  }
  const slots = new Map();
  return people.map(person => {
    const roomNumber = Number(person.roomNumber);
    const room = Object.hasOwn(ROOMS, roomNumber) ? ROOMS[roomNumber] : null;
    if (!room) return { ...person, position: null };
    const index = slots.get(roomNumber) ?? 0;
    slots.set(roomNumber, index + 1);
    const count = counts.get(roomNumber);
    const columns = Math.min(count, Math.max(1, Math.round(Math.sqrt(count * room.width / Math.max(room.height, 40)))));
    const rows = Math.ceil(count / columns);
    return {
      ...person, roomNumber,
      position: {
        x: (room.x + ((index % columns) + .5) * room.width / columns) / MAP.width,
        y: (room.y + (Math.floor(index / columns) + .5) * room.height / rows) / MAP.height,
      },
    };
  });
}
