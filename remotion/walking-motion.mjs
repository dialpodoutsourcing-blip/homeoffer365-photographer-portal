export const WALKING_START_SCALE = 1.025;
export const WALKING_END_SCALE = 1.24;
export const WALKING_BOB_AMPLITUDE = 0.22;
export const WALKING_SWAY_AMPLITUDE = 0.12;
export const WALKING_STEP_FREQUENCY = 1.8;

export const getWalkingOffset = (frame, fps) => {
  const seconds = frame / fps;
  const stepPhase = seconds * Math.PI * 2 * WALKING_STEP_FREQUENCY;

  return {
    x: Math.sin(stepPhase / 2) * WALKING_SWAY_AMPLITUDE,
    y: Math.sin(stepPhase) * WALKING_BOB_AMPLITUDE,
  };
};
