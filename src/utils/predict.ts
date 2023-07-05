import { Tensor } from 'onnxruntime-web';
import { loadAndCropBodyImageCV, preprocessYolov8 } from './imageHelper';
import { runYoloV8Model, runEmotionModel, runYoloV8FaceModel } from './modelHelper';

export async function inferenceYoloV8Model(image: HTMLImageElement): Promise<[any,number]> {
  // 1. Convert image to tensor
  const [imageTensor, xRatio, yRatio] = preprocessYolov8(image);
  // 2. Run model
  console.log('image tens', imageTensor, xRatio, yRatio)
  const [predictions, inferenceTime] = await runYoloV8Model(imageTensor, xRatio as number, yRatio as number);
  // console.log('yolo model', predictions, inferenceTime)
  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
}

export async function inferenceYoloV8FaceModel(image: HTMLImageElement): Promise<[any,number]> {
  // 1. Convert image to tensor
  //const [imageTensor, xRatio, yRatio] = preprocessYolov8(image);
  const preparedInput = prepare_input(image);
  const input = new Tensor(Float32Array.from(preparedInput),[1, 3, 640, 640]);
  // 2. Run model
  //console.log('image tens', imageTensor, xRatio, yRatio)
  const [predictions, inferenceTime] = await runYoloV8FaceModel(input, 1, 1);
  // console.log('yolo model', predictions, inferenceTime)
  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
}

export async function inferenceEmotionModel(image: HTMLImageElement, bbox: [x: number, y: number, w: number, h: number]): Promise<[any,number]> {
  // 1. Convert image to tensor
  const imageTensor = await loadAndCropBodyImageCV(image, bbox, [1, 3, 224, 224])

  // 2. Run model
  const [predictions, inferenceTime] = await runEmotionModel(imageTensor);
  console.log('yolo model', predictions, inferenceTime)
  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
}

function prepare_input(img: HTMLImageElement) {  
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  context?.drawImage(img, 0, 0, 640, 640);

  const data = context?.getImageData(0,0,640,640).data;
  const red = [], green = [], blue = [];
  if (data) {
    for (let index=0;index<data.length;index+=4) {
      red.push(data[index]/255);
      green.push(data[index+1]/255);
      blue.push(data[index+2]/255);
  }
  }
  
  return [...red, ...green, ...blue];
}
