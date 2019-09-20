import { assert } from 'chai'
import { fsm } from '../src/index'
import StateMachineImpl = fsm.StateMachineImpl
import Transitions = fsm.Transitions
import State = fsm.State
/**
* The differents States
*/
const states = {
    STOPPED: new State('STOPPED'),
    PLAYING: new State('PLAYING'),
}
const validTransitions: Transitions<State> = {}
validTransitions[states.STOPPED.label] = [states.PLAYING, states.STOPPED]
validTransitions[states.PLAYING.label] = [states.STOPPED, states.PLAYING]

describe('currentS',  () => {
    const stateMachine = new StateMachineImpl(Object.values(states), validTransitions, states.PLAYING)
    afterEach(() => {
        stateMachine.setState(states.PLAYING)
    })
    
    // /**
    //  * Verify if the currentState is stopped
    //  */
    it('CurrentState is stopped', () => {
        stateMachine.setState(states.STOPPED)
        assert.isTrue(stateMachine.isSameState(states.STOPPED))
    })

    // /**
    //  * Verify if the currentState is Playing
    //  */
    it('CurrentState is Playing', () => {
        stateMachine.setState(states.PLAYING)
        assert.isTrue(stateMachine.isSameState(states.PLAYING))
    })

    // /**
    //  * Verify if the currentState is Playing
    //  */
    it('CurrentState is not Playing', () => {
        stateMachine.setState(states.STOPPED)
        assert.isFalse(stateMachine.isSameState(states.PLAYING))
    })

    // /**
    //  * Verify if the currentState is Playing
    //  */
    it('CurrentState is not Stopped', () => {
        stateMachine.setState(states.PLAYING)
        assert.isFalse(stateMachine.isSameState(states.STOPPED))
    })
})
