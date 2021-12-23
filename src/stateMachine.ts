import { IState, ListenerRegistration, Logger, StateMachine, Transitions } from './typings'

export class StateMachineImpl<T extends State> implements StateMachine<T> {
	readonly states: T[]
	readonly validTransitions: Transitions<T>
	protected _state: T
	private readonly _transitionListeners: TransitionListeners<T>
	protected log?: Logger

	constructor(states: T[], validTransitions: Transitions<T>, initialState: T) {
		this.states = states
		this.validTransitions = validTransitions
		this._state = initialState
		this._transitionListeners = {}
	}

	get state(): T {
		return this._state
	}

	onEnterState(state: T, callBack: (from: T, to: T) => void): ListenerRegistration {
		return this.addTransitionListener(callBack, undefined, state)
	}

	onLeaveState(state: T, callBack: (from: T, to: T) => void): ListenerRegistration {
		return this.addTransitionListener(callBack, state, undefined)
	}

	onTransition(
		fromState: T,
		toState: T,
		callBack: (from: T, to: T) => void
	): ListenerRegistration {
		return this.addTransitionListener(callBack, fromState, toState)
	}

	onAnyTransition(callBack: (from: T, to: T) => void): ListenerRegistration {
		return this.addTransitionListener(callBack, undefined, undefined)
	}

	protected addTransitionListener(
		callBack: (from: T, to: T) => void,
		fromState?: T,
		toState?: T
	) {
		const transition = this.transitionLabel(fromState, toState)
		if (!this._transitionListeners[transition]) {
			this._transitionListeners[transition] = []
		}
		const listenersForTransition = this._transitionListeners[transition]
		const transitionListener = new TransitionListener(callBack, fromState, toState)
		listenersForTransition.push(transitionListener)
		return {
			cancel(): void {
				transitionListener.active = false
			},
		}
	}

	checkInState(state: T, message?: string): void {
		if (!this.inState(state)) {
			throw new Error(
				message ||
					`Expected to be in ${state.toString()} but was in ${this.state.toString()}`
			)
		}
	}

	checkInOneOfStates(states: T[], message?: string): void {
		if (!this.inOneOfStates(states)) {
			throw new Error(
				message ||
					`Expected to be in one of ${states.toString()} but was in ${this.state.toString()}`
			)
		}
	}

	inOneOfStates(states: T[]): boolean {
		return states.indexOf(this._state) !== -1
	}

	inState(state: T): boolean {
		return this._state === state
	}

	private invokeAllTransitionListeners(fromState: T, toState: T) {
		const allLeaveTransitions = this.transitionLabel(fromState, undefined)
		this.invokeTransitionListeners(
			fromState,
			toState,
			this._transitionListeners[allLeaveTransitions]
		)
		const transition = this.transitionLabel(fromState, toState)
		this.invokeTransitionListeners(fromState, toState, this._transitionListeners[transition])
		const allEnterTransitions = this.transitionLabel(undefined, toState)
		this.invokeTransitionListeners(
			fromState,
			toState,
			this._transitionListeners[allEnterTransitions]
		)
		const allTransitions = this.transitionLabel(undefined, undefined)
		this.invokeTransitionListeners(
			fromState,
			toState,
			this._transitionListeners[allTransitions]
		)
	}

	private invokeTransitionListeners(
		fromState: T,
		toState: T,
		listeners?: TransitionListener<T>[]
	) {
		if (listeners) {
			for (let index = 0; index < listeners.length; index++) {
				const listener = listeners[index]
				if (listener.active) {
					try {
						listener.callBack(fromState, toState)
					} catch (e) {
						this.log?.error('Uncaught error in listener', e)
					}
				} else {
					// Remove inactive listener
					listeners.splice(index, 1)
					index--
				}
			}
		}
	}

	private transitionLabel(fromState?: T, toState?: T) {
		return (
			((fromState && fromState.label) || '*') + ' --> ' + ((toState && toState.label) || '*')
		)
	}

	waitUntilLeft(state: T): Promise<T> {
		return new Promise<T>((resolve) => {
			if (this._state !== state) {
				resolve(this._state)
			} else {
				const registration = this.onLeaveState(state, (from, to) => {
					registration.cancel()
					resolve(to)
				})
			}
		})
	}

	waitUntilEntered(state: T): Promise<T> {
		return this.waitUntilEnteredOneOf([state])
	}

	waitUntilEnteredOneOf(states: T[]): Promise<T> {
		return new Promise<T>((resolve) => {
			if (states.indexOf(this._state) !== -1) {
				resolve(this._state)
			} else {
				const registrations: ListenerRegistration[] = []
				let finished = false
				for (const state of states) {
					const registration = this.onEnterState(state, (from, to) => {
						registration.cancel()
						registrations.forEach((reg) => {
							if (registration !== reg) {
								reg.cancel()
							}
						})
						finished = true
						resolve(to)
					})
					if (finished) {
						break
					}
					registrations.push(registration)
				}
			}
		})
	}

	setState(newState: T) {
		this.checkTransition(newState)
		this.log?.debug(`State : ${this._state.toString()} --> ${newState.toString()}`)
		const oldState = this._state
		this._state = newState

		this.invokeAllTransitionListeners(oldState, newState)
	}

	canGoToState(newState: T): boolean {
		return this.validTransitions[this._state.label].indexOf(newState) !== -1
	}

	private checkTransition(newState: T) {
		if (!this.canGoToState(newState)) {
			throw new Error(
				`Invalid transition from ${this._state.toString()} to ${newState.toString()}`
			)
		}
	}
}

export class State implements IState {
	constructor(readonly label: string, readonly parent?: State) {}

	toString = (): string => {
		if (this.parent) {
			return this.parent.toString() + '/' + this.label
		} else {
			return this.label
		}
	}

	// noinspection JSUnusedGlobalSymbols
	userFriendlyDescription() {
		return this.label
	}
}

class TransitionListener<T> {
	active = true

	constructor(
		readonly callBack: (from: T, to: T) => void,
		readonly fromState?: T,
		readonly toState?: T
	) {}
}

interface TransitionListeners<T> {
	[transition: string]: TransitionListener<T>[]
}
