import { IState, StateMachine } from './typings'
import { State, StateMachineImpl } from './stateMachine'

/*
	Method annotator. Throw an error if the state when the method is called
	is different from the given state
*/
export function CheckStateIs(state: State, message?: string) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): any {
		const originalMethod = descriptor.value as (...args: unknown[]) => unknown

		descriptor.value = function (this: StateMachine<IState>, ...args: unknown[]) {
			if (this.state === state) {
				return originalMethod?.apply(this, args)
			} else {
				throw new Error(
					message ||
						`Illegal execution of ${propertyKey} : State should be ${state.toString()}, but is = ${this.state.toString()}`
				)
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): any {
		if (descriptor.value) {
			const originalMethod = descriptor.value as (...args: unknown[]) => unknown

			descriptor.value = function (this: StateMachine<IState>, ...args: unknown[]) {
				if (states.indexOf(this.state) !== -1) {
					return originalMethod.apply(this, args)
				} else {
					throw new Error(
						message ||
							`Illegal execution of ${propertyKey} : State should be one of ${states.toString()}, but is = ${this.state.toString()}`
					)
				}
			}
		} else if (descriptor.get) {
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const originalGetter = descriptor.get as () => unknown

			descriptor.get = function (this: StateMachine<IState>) {
				if (states.indexOf(this.state) !== -1) {
					return originalGetter.call(this)
				} else {
					throw new Error(
						message ||
							`Illegal execution of ${propertyKey} : State should be one of ${states.toString()}, but is = ${this.state.toString()}`
					)
				}
			}
		}
		return descriptor
	}
}

/*
	Method annotator. Throw an error if the state when the method is called
	is one of the given states
*/
export function CheckStateNotIn(states: State[], message?: string) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): any {
		if (descriptor.value) {
			const originalMethod = descriptor.value as (...args: unknown[]) => unknown

			descriptor.value = function (this: StateMachine<IState>, ...args: unknown[]) {
				if (states.indexOf(this.state) === -1) {
					return originalMethod.apply(this, args)
				} else {
					throw new Error(
						message ||
							`Illegal execution of ${propertyKey} : State should not be one of  ${states.toString()}`
					)
				}
			}
		} else if (descriptor.get) {
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const originalGetter = descriptor.get as () => unknown

			descriptor.get = function (this: StateMachine<IState>) {
				if (states.indexOf(this.state) === -1) {
					return originalGetter.call(this)
				} else {
					throw new Error(
						message ||
							`Illegal execution of ${propertyKey} : State should not be one of these states: ${states.toString()}`
					)
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): any {
		const originalMethod = descriptor.value as (...args: unknown[]) => unknown

		descriptor.value = function (this: StateMachineImpl<IState>, ...args: unknown[]) {
			if (this.state === state) {
				return originalMethod?.apply(this, args)
			} else {
				this.log?.warn(
					`Skipping execution of ${propertyKey} : State should be ${state.toString()} but state = ${this.state.toString()}`
				)
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): any {
		const originalMethod = descriptor.value as (...args: unknown[]) => unknown

		descriptor.value = function (this: StateMachineImpl<IState>, ...args: unknown[]) {
			if (this.state !== state) {
				return originalMethod?.apply(this, args)
			} else {
				this.log?.warn(
					`Skipping execution of ${propertyKey} : State should be different from ${state.toString()}`
				)
			}
		}
		return descriptor
	}
}


/*
	Method annotator. Skip the method execution if the state when the method is called
	is different from the given states
*/
export function AssumeStateIsIn(states: State[]) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): any {
		const originalMethod = descriptor.value as (...args: unknown[]) => unknown

		descriptor.value = function (this: StateMachineImpl<IState>, ...args: unknown[]) {
			if (states.includes(this.state)) {
				return originalMethod?.apply(this, args)
			} else {
				this.log?.warn(
					`Skipping execution of ${propertyKey} : State should be ${states.map(state => state.toString()).join('-')} but state = ${this.state.toString()}`
				)
			}
		}

		return descriptor
	}
}

/*
	Method annotator. Skip the method execution if the state when the method is called
	is the same as the given state
*/
export function AssumeStateIsNotIn(states: State[]) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): any {
		const originalMethod = descriptor.value as (...args: unknown[]) => unknown

		descriptor.value = function (this: StateMachineImpl<IState>, ...args: unknown[]) {
			if (!states.includes(this.state)) {
				return originalMethod?.apply(this, args)
			} else {
				this.log?.warn(
					`Skipping execution of ${propertyKey} : State should be different from ${states.map(state => state.toString()).join('-')}`
				)
			}
		}
		return descriptor
	}
}

