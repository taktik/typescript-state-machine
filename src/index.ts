import { getLogger } from 'log4javascript'

export namespace fsm {

	export interface StateMachine<T extends State> {
		/* Get the current state of the fsm */
		readonly state: T

		/*
					Listen for state changes. The callback will be called once when the fsm enters the given state.
					@param callBack The callBack that will be called
				*/
		onEnterState(state: T, callBack: (from: T, to: T) => void): ListenerRegistration

		/*
				Listen for state changes. The callback will be called once when the fsm leaves the given state.
				@param callBack The callBack that will be called
				*/
		onLeaveState(state: T, callBack: (from: T, to: T) => void): ListenerRegistration

		/*
				Listen for state changes. The callback will be called once when the fsm leaves the given fromState and enters the given toState.
				@param callBack The callBack that will be called
				*/
		onTransition(fromState: T, toState: T, callBack: (from: T, to: T) => void): ListenerRegistration

		onAnyTransition(callBack: (from: T, to: T) => void): ListenerRegistration

		/*
					Wait for state changes.
				*/
		waitUntilLeft(state: T): Promise<T>

		waitUntilEntered(state: T): Promise<T>

		waitUntilEnteredOneOf(states: [T]): Promise<T>

	}

	export class StateMachineImpl<T extends State> implements StateMachine<T> {
		readonly states: T[]
		readonly validTransitions: Transitions<T>
		protected _state: T
		private readonly _transitionListeners: TransitionListeners<T>
		protected log = getLogger(this.constructor.name)

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

		onTransition(fromState: T, toState: T, callBack: (from: T, to: T) => void): ListenerRegistration {
			return this.addTransitionListener(callBack, fromState, toState)
		}

		onAnyTransition(callBack: (from: T, to: T) => void): ListenerRegistration {
			return this.addTransitionListener(callBack, undefined, undefined)
		}

		protected addTransitionListener(callBack: (from: T, to: T) => void, fromState?: T, toState?: T) {
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
				}
			}
		}

		checkInState(state: T, message?: string): void {
			if (!this.inState(state)) {
				throw new Error(message || 'Expected to be in ' + state + ' but was in ' + this.state)
			}
		}

		checkInOneOfStates(states: T[], message?: string): void {
			if (!this.inOneOfStates(states)) {
				throw new Error(message || 'Expected to be in one of ' + states + ' but was in ' + this.state)
			}
		}

		protected inOneOfStates(states: T[]): boolean {
			return (states.indexOf(this._state) !== -1)
		}

		protected inState(state: T): boolean {
			return this._state === state
		}

		private invokeAllTransitionListeners(fromState: T, toState: T) {
			const allLeaveTransitions = this.transitionLabel(fromState, undefined)
			this.invokeTransitionListeners(fromState, toState, this._transitionListeners[allLeaveTransitions])
			const transition = this.transitionLabel(fromState, toState)
			this.invokeTransitionListeners(fromState, toState, this._transitionListeners[transition])
			const allEnterTransitions = this.transitionLabel(undefined, toState)
			this.invokeTransitionListeners(fromState, toState, this._transitionListeners[allEnterTransitions])
			const allTransitions = this.transitionLabel(undefined, undefined)
			this.invokeTransitionListeners(fromState, toState, this._transitionListeners[allTransitions])
		}

		private invokeTransitionListeners(fromState: T, toState: T, listeners?: TransitionListener<T>[]) {
			if (listeners) {
				for (let index = 0; index < listeners.length; index++) {
					const listener = listeners[index]
					if (listener.active) {
						try {
							listener.callBack(fromState, toState)
						} catch (e) {
							this.log.warn('Uncaught error in listener :' + e)
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
			return ((fromState && fromState.label) || '*') + ' --> ' + ((toState && toState.label) || '*')
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
					for (let state of states) {
						let registration = this.onEnterState(state, (from, to) => {
							registration.cancel()
							registrations.forEach(reg => {
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
			this.log.debug(`State : ${this._state} --> ${newState}`)
			const oldState = this._state
			this._state = newState

			this.invokeAllTransitionListeners(oldState, newState)
		}

		private checkTransition(newState: T) {
			if (!this.canGoToState(newState)) {
				throw new Error('Invalid transition from ' + this._state + ' to ' + newState)
			}
		}

		protected canGoToState(newState: T): boolean {
			return this.validTransitions[this._state.label].indexOf(newState) !== -1
		}
	}

	export interface Transitions<T> {
		[stateLabel: string]: T[]
	}

	export class State {
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
		active: boolean = true

		constructor(
			readonly callBack: (from: T, to: T) => void,
			readonly fromState?: T,
			readonly toState?: T
		) {
		}
	}

	interface TransitionListeners<T> {
		[transition: string]: TransitionListener<T>[]
	}

	export interface ListenerRegistration {
		// Cancels listener registration
		cancel(): void
	}

	// Decorators
	const log = getLogger('fsm.decorators')

	/*
			Method annotator. Throw an error if the state when the method is called
			is different from the given state
		*/
	export function CheckStateIs(state: State, message?: string) {
		return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
			const originalMethod = descriptor.value
			descriptor.value = function() {
				const context = this as StateMachine<any>
				if (context.state === state) {
					originalMethod.apply(context, arguments)
				} else {
					throw new Error(message || 'Illegal execution of ' + propertyKey + ' : State should be ' + state + ' but state = ' + context.state)
				}
			}
			return descriptor
		}
	}

	/*
			Method annotator. Throw an error if the state when the method is called
			is not one of the given states
		*/
	export function CheckStateIn(states: State[], message?: string) {
		return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
			let originalMethod: any
			if (descriptor.value) {
				originalMethod = descriptor.value
				descriptor.value = function() {
					const context = this as StateMachine<any>
					if (states.indexOf(context.state) !== -1) {
						return originalMethod.apply(context, arguments)
					} else {
						throw new Error(message || 'Illegal execution of ' + propertyKey + ' : State should be one of  ' + states + ' but state = ' + context.state)
					}
				}
			} else if (descriptor.get) {
				const originalGetter = descriptor.get
				descriptor.get = function() {
					const context = this as StateMachine<any>
					if (states.indexOf(context.state) !== -1) {
						return originalGetter.apply(context, arguments)
					} else {
						throw new Error(message || 'Illegal execution of ' + propertyKey + ' : State should be one of  ' + states + ' but state = ' + context.state)
					}
				}
			}
			return descriptor
		}
	}

	/*
			Method annotator. Skip the method execution if the state when the method is called
			is different from the given state
		*/
	export function AssumeStateIs(state: State) {
		return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
			const originalMethod = descriptor.value
			descriptor.value = function() {
				const context = this as StateMachine<any>
				if (context.state === state) {
					originalMethod.apply(context, arguments)
				} else {
					log.warn('Skipping execution of ' + propertyKey + ' : State should be ' + state + ' but state = ' + context.state)
				}
			}
			return descriptor
		}
	}

	/*
			Method annotator. Skip the method execution if the state when the method is called
			is the same as the given state
		*/
	export function AssumeStateIsNot(state: State) {
		return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
			const originalMethod = descriptor.value
			descriptor.value = function() {
				const context = this as StateMachine<any>
				if (context.state !== state) {
					originalMethod.apply(context, arguments)
				} else {
					log.warn('Skipping execution of ' + propertyKey + ' : State should be different from ' + state)
				}
			}
			return descriptor
		}
	}
}
