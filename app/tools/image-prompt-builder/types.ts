export interface Subject {
  type: string;
  age: string;
  gender: string;
  ethnicity: string;
  clothing: string;
  expression: string;
  pose: string;
}

export interface Environment {
  location: string;
  background_elements: string[];
  mood: string;
}

export interface Camera {
  camera_type: string;
  lens: string;
  aperture: string;
  shutter_speed: string;
  iso: number;
  framing: string;
  focus: string;
  color_grading: string;
}

export interface Lighting {
  style: string;
  key_light: string;
  fill_light: string;
  highlights: string;
  shadows: string;
}

export interface Output {
  format: string;
  resolution: string;
  style: string;
  style_notes?: string;
  consistency_id: string;
}

export interface ImagePromptState {
  task: string;
  subject: Subject;
  environment: Environment;
  camera: Camera;
  lighting: Lighting;
  output: Output;
}

