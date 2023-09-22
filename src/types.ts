export interface UserData {
  id?: string;
  name: string;
  online: boolean;
  presenter: boolean;
  faceDetected: boolean;
  engagement: DetectedClass;
  confusion: DetectedClass;
  /*statusLog: {};*/
}

enum DetectedClass {
  Low = 1,
  MediumLow,
  MediumHigh,
  High,
}

export interface PresentationData {
  id?: string;
  currentSlideNumber: number;
}