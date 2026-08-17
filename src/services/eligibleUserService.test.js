import test from 'node:test'
import assert from 'node:assert/strict'
import { isEmailEligibleEntry } from './eligibleUserService.js'

test('approved emails with no registration can register', () => {
    assert.equal(
        isEmailEligibleEntry('User@Example.com', { email: 'user@example.com', registeredAt: null }),
        true,
    )
})

test('already registered emails are rejected', () => {
    assert.equal(
        isEmailEligibleEntry('user@example.com', { email: 'user@example.com', registeredAt: Date.now() }),
        false,
    )
})

test('malformed or non-approved emails are rejected', () => {
    assert.equal(isEmailEligibleEntry('not-an-email', null), false)
    assert.equal(isEmailEligibleEntry('user@example.com', { email: 'other@example.com' }), false)
})
