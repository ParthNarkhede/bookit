import test from 'node:test'
import assert from 'node:assert/strict'
import { getDashboardRoute } from './dashboardRoutes.js'

test('admin users are redirected to the admin dashboard', () => {
  assert.equal(getDashboardRoute('admin'), '/admindashboard')
})

test('employee users are redirected to the user dashboard', () => {
  assert.equal(getDashboardRoute('employee'), '/userdashboard')
})
