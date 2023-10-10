/* globals expect, test */

import { TestStateMachine, doneState, idleState, workingState } from './common'


describe('Decorators', () => {
	const d = new TestStateMachine()

	test('init state', () => {
		expect(d.throwIfNotInit()).toBe(true)
		expect(() => d.throwIfNotIdleOrWorking()).toThrow()
		expect(() => d.throwOnInitOrIdle()).toThrow()
		expect(d.trueIfDone()).toBe(undefined)
		expect(d.trueIfNotWorking()).toBe(true)
	})

	test('idle state', () => {
		d.setState(idleState)

		expect(() => d.throwIfNotInit()).toThrow()
		expect(d.throwIfNotIdleOrWorking()).toBe(true)
		expect(() => d.throwOnInitOrIdle()).toThrow()
		expect(d.trueIfDone()).toBe(undefined)
		expect(d.trueIfNotWorking()).toBe(true)
		expect(d.trueIfNotWorkingAndDone()).toBe(true)
	})

	test('working state', () => {
		d.setState(workingState)

		expect(() => d.throwIfNotInit()).toThrow()
		expect(d.throwIfNotIdleOrWorking()).toBe(true)
		expect(d.throwOnInitOrIdle()).toBe(true)
		expect(d.trueIfDone()).toBe(undefined)
		expect(d.trueIfNotWorking()).toBe(undefined)
		expect(d.trueIfWorkingOrDone()).toBe(true)
	})

	test('done state', () => {
		d.setState(doneState)

		expect(() => d.throwIfNotInit()).toThrow()
		expect(() => d.throwIfNotIdleOrWorking()).toThrow()
		expect(d.throwOnInitOrIdle()).toBe(true)
		expect(d.trueIfDone()).toBe(true)
		expect(d.trueIfNotWorking()).toBe(true)
		expect(d.trueIfWorkingOrDone()).toBe(true)
	})
})
