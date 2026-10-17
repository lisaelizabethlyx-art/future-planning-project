import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMail, releaseReadiness, releaseSteps } from '../assets/workflows.js';
test('deadline classification takes precedence over review in either language', () => {
  assert.equal(classifyMail('Review DEADLINE tomorrow'), 'P0');
  assert.equal(classifyMail('审核截止提醒'), 'P0');
  assert.equal(classifyMail('Review feedback'), 'P1');
  assert.equal(classifyMail('审核结果'), 'P1');
  assert.equal(classifyMail('Weekly notes'), 'P2');
});
test('checking downstream tasks cannot bypass incomplete release dependencies', () => {
  const result = releaseReadiness(new Set(['scope', 'review', 'handoff']));
  assert.equal(result.done, 1);
  assert.equal(result.states.review, 'blocked');
  assert.equal(result.ready, false);
});
test('unchecking a prerequisite invalidates downstream readiness', () => {
  const completed = new Set(releaseSteps.map(step => step.id));
  assert.equal(releaseReadiness(completed).ready, true);
  completed.delete('assets');
  assert.equal(releaseReadiness(completed).done, 1);
  assert.equal(releaseReadiness(completed).percent, 20);
});
