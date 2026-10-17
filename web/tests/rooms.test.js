import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placePeople } from '../lib/rooms.js';

test('people sharing a room get distinct locations within it', () => {
  const people = placePeople([{name:'Alex',roomNumber:2},{name:'Maya',roomNumber:'2'}]);
  assert.notDeepEqual(people[0].position, people[1].position);
  for(const {position} of people) {
    assert.ok(position.x > 350/600 && position.x < 478/600);
    assert.ok(position.y > 50/540 && position.y < 143/540);
  }
});
test('room changes move the marker; unknown rooms remain in the list without a marker', () => {
  const [before] = placePeople([{name:'Alex',roomNumber:1}]);
  const [after] = placePeople([{name:'Alex',roomNumber:5}]);
  assert.notDeepEqual(before.position,after.position);
  assert.equal(placePeople([{name:'Alex',roomNumber:99}])[0].position,null);
  assert.deepEqual(placePeople([]),[]);
});
