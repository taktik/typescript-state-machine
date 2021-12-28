export interface Transitions<T> {
	[stateLabel: string]: T[]
}

export interface IState {
	label: string
	parent?: IState
	toString: () => string
	userFriendlyDescription(): string
}

export interface ListenerRegistration {
	// Cancels listener registration
	cancel(): void
}

export interface StateMachine<T extends IState> {
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
