import { AssumeStateIs, AssumeStateIsNot, CheckStateIn, CheckStateIs, CheckStateNotIn } from '../decorators'
import { State, StateMachineImpl } from '../stateMachine'

export const initState = new State('INIT')
export const idleState = new State('IDLE')
export const workingState = new State('WORKING')
export const doneState = new State('DONE')

const transitions = {
	[initState.label]: [idleState, workingState],
	[idleState.label]: [workingState],
	[workingState.label]: [doneState],
	[doneState.label]: [],
}

export class DecoratorsTest extends StateMachineImpl<State> {
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
