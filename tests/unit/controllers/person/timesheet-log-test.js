import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Controller | person/timesheet-log', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let controller = this.owner.lookup('controller:person/timesheet-log');
    assert.ok(controller);
  });
});
