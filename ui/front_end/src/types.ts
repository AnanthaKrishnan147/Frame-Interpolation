export interface Frame {
  id: string;
  url: string;
  isKeyframe: boolean;
}

export type AIStatus = 'Idle' | 'Processing' | 'Completed';

export interface Marker {
  id: string;
  frameIndex: number;
  label: string;
  color: string;
}

export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  type: 'keyframes' | 'generated' | 'preview';
}

export interface SelectionRange {
  start: number;
  end: number;
}
