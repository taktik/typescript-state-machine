/* globals expect, test */

import { AssumeStateIs, AssumeStateIsNot, CheckStateIn, CheckStateIs, CheckStateNotIn } from './decorators'
import { State, StateMachineImpl } from './stateMachine'


const initState = new State('INIT')
const idleState = new State('IDLE')
const workingState = new State('WORKING')
const doneState = new State('DONE')

const transitions = {
	[initState.label]: [idleState, workingState],
	[idleState.label]: [workingState],
	[workingState.label]: [doneState],
	[doneState.label]: [],
}

class DecoratorsTest extends StateMachineImpl<State> {
	log = {
		debug: console.debug,
		info: console.info,
		warn: console.warn,
		error: console.error,
		fatal: console.error,
	}
	constructor() {
		super(
			[initState, idleState, workingState, doneState],
			transitions,
			initState
		)
	}

	@CheckStateIs(initState, 'Should be init')
	throwIfNotInit() {
		return true
	}

	@CheckStateIn([idleState, workingState], 'Should be idle or working')
	throwIfNotIdleOrWorking() {
		return true
	}

	@CheckStateNotIn([initState, idleState], 'Should not be idle')
	throwOnInitOrIdle() {
		return true
	}

	@AssumeStateIs(doneState)
	trueIfDone() {
		return true
	}

	@AssumeStateIsNot(workingState)
	trueIfNotWorking() {
		return true
	}
}

describe('Decorators', () => {
	const d = new DecoratorsTest()

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
	})

	test('working state', () => {
		d.setState(workingState)

		expect(() => d.throwIfNotInit()).toThrow()
		expect(d.throwIfNotIdleOrWorking()).toBe(true)
		expect(d.throwOnInitOrIdle()).toBe(true)
		expect(d.trueIfDone()).toBe(undefined)
		expect(d.trueIfNotWorking()).toBe(undefined)
	})

	test('done state', () => {
		d.setState(doneState)

		expect(() => d.throwIfNotInit()).toThrow()
		expect(() => d.throwIfNotIdleOrWorking()).toThrow()
		expect(d.throwOnInitOrIdle()).toBe(true)
		expect(d.trueIfDone()).toBe(true)
		expect(d.trueIfNotWorking()).toBe(true)
	})
})
