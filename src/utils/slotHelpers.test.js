import test from 'node:test'
import assert from 'node:assert/strict'
import { DAY_END_HOUR, DAY_START_HOUR, SLOT_INTERVAL_MINUTES } from '../constants/booking.js'
import { generateTimeSlots } from './dateHelpers.js'
import { getSlotState, isWeekendDate } from './slotHelpers.js'

test('the timeline contains only 15-minute slots from 08:00 through 20:00', () => {
  const slots = generateTimeSlots(DAY_START_HOUR, DAY_END_HOUR, SLOT_INTERVAL_MINUTES)

  assert.equal(slots.length, 48)
  assert.deepEqual(slots[0], {
    startTime: '08:00',
    endTime: '08:15',
    durationMinutes: 15,
  })
  assert.deepEqual(slots.at(-1), {
    startTime: '19:45',
    endTime: '20:00',
    durationMinutes: 15,
  })
})

test('Saturday and Sunday slots are closed', () => {
  for (const dateKey of ['2026-10-03', '2026-10-04']) {
    assert.equal(isWeekendDate(dateKey), true)
    assert.equal(
      getSlotState({
        dateKey,
        startTime: '10:00',
        endTime: '10:15',
        roomId: 'room-1',
        bookings: [],
        currentUserId: 'user-1',
        selectedStartTimes: [],
      }),
      'closed',
    )
  }
})