import test from 'node:test'
import assert from 'node:assert/strict'
import { possibleAlternative } from './alternative-audit.ts'

test('existing alternatives and Jev-like implementation summaries enter the full audit', () => {
  assert.equal(possibleAlternative({ title: 'kev', summary: 'tiny Jev-like family of decision models built on Qwen3.5' }), true)
  assert.equal(possibleAlternative({ title: 'Laya', summary: 'a local inference runtime', category: 'alternatives' }), true)
  assert.equal(possibleAlternative({ title: 'unknown', summary: 'no matching label' }, 'alternatives'), true)
})

test('ordinary open-source integrations are not mistaken for alternatives by the broad text lead', () => {
  assert.equal(possibleAlternative({ title: 'agent skill', summary: 'Open-source TypeSafe Jev SDK client for an agent' }), false)
  assert.equal(possibleAlternative({ title: 'guide', summary: 'A tutorial and resource list for Jev' }), false)
})
