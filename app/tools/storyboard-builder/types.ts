export interface Character {
  id: string;
  description: string;
}

export interface ShotCamera {
  lens: string;
  move: string;
  dof: string;
  aperture?: string;
  framing_notes?: string;
}

export interface ShotLighting {
  preset: string;
  notes?: string;
}

export interface Shot {
  shot_number: number;
  shot_type: string;
  camera_angle: string;
  characters?: string[];
  location?: string;
  action?: string;
  purpose?: string;
  focus?: string;
  notes?: string;
  text_overlays?: string;
  emotional_tone?: string;
  camera: ShotCamera;
  lighting: ShotLighting;
}

export interface Project {
  title: string;
  aspect_ratio: string;
  visual_style: string;
  consistency_id: string;
}

export interface Output {
  layout: string;
  labels: string;
  style: string;
}

export interface StoryboardState {
  task: string;
  project: Project;
  main_characters: Character[];
  shots: Shot[];
  output: Output;
}

