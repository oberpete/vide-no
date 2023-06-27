export interface UserData {
  id?: string;
  name: string;
  online: boolean;
  presenter: boolean;
  status: string;
  statusLog: {};
}

export interface PresentationData {
  id?: string;
  currentSlideNumber: number;
}