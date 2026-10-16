import test from 'node:test';
import assert from 'node:assert/strict';
import { groupMenuItems, selectedMenuIds } from './menuItems.js';

test('retains every saved selection from raw, populated and legacy records', () => {
  assert.deepEqual(selectedMenuIds({ menuItem: ['a', { _id: 'b' }, 'a'] }), ['a', 'b']);
  assert.deepEqual(selectedMenuIds({ menuItem: [], menuItemIds: ['a', 'b'] }), ['a', 'b']);
  assert.deepEqual(selectedMenuIds({ menuItemId: 'a' }), ['a']);
  assert.deepEqual(selectedMenuIds({ menuItem: [] }), []);
});

test('groups by parent IDs and respects display order, even with repeated section names', () => {
  const groups = groupMenuItems(
    [{ _id: 'rings', name: 'Rings', order: 2 }, { _id: 'earrings', name: 'Earrings', order: 1 }],
    [{ _id: 'r', title: 'Featured', categoryId: { _id: 'rings' } }, { _id: 'e', title: 'Featured', categoryId: 'earrings' }],
    [{ _id: 'r2', title: 'Solitaire', menuSectionId: 'r', order: 2 }, { _id: 'r1', title: 'Three Stone', menuSectionId: { _id: 'r' }, order: 1 }, { _id: 'e1', title: 'Studs', menuSectionId: 'e' }, { _id: 'orphan', menuSectionId: 'missing' }],
  );
  assert.equal(groups[0]._id, 'earrings');
  assert.deepEqual(groups[1].sections[0].items.map((item) => item._id), ['r1', 'r2']);
  assert.deepEqual(groups[0].sections[0].items.map((item) => item._id), ['e1']);
  assert.deepEqual(groupMenuItems([], [], []), []);
});
