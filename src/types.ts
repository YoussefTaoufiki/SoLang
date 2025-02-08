export interface Chapter {
  id: string;
  title: string;
  cfi: string;
  subitems?: Chapter[];
  progress?: number;
}

export interface Annotation {
  cfi: string;
  text: string;
  note: string;
  timestamp: number;
  color?: string;
  createdAt?: number;
} 