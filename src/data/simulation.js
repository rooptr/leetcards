const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function createSimulationState(frameCount) {
  return {
    step: 0,
    frameCount: Math.max(1, Number(frameCount) || 1),
    playing: false,
  };
}

export function simulationReducer(state, action) {
  const last = state.frameCount - 1;

  if (action.type === 'set') {
    return { ...state, step: clamp(Number(action.step) || 0, 0, last), playing: false };
  }
  if (action.type === 'previous') {
    return { ...state, step: Math.max(0, state.step - 1), playing: false };
  }
  if (action.type === 'next') {
    return { ...state, step: Math.min(last, state.step + 1), playing: false };
  }
  if (action.type === 'toggle') {
    return state.step >= last
      ? { ...state, step: 0, playing: true }
      : { ...state, playing: !state.playing };
  }
  if (action.type === 'tick') {
    if (!state.playing) return state;
    const step = Math.min(last, state.step + 1);
    return { ...state, step, playing: step < last };
  }
  if (action.type === 'reset') return createSimulationState(state.frameCount);
  return state;
}
