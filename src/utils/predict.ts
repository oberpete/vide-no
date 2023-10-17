import { Tensor } from 'onnxruntime-web';
import { loadAndCropBodyImageCV, preprocessYolov8 } from './imageHelper';
import { runYoloV8Model, runEmotionModel, runYoloV8FaceModel, runResNetModel, runClassifierModel } from './modelHelper';
var arrayBuf: any[] = []
export async function inferenceYoloV8Model(image: HTMLImageElement): Promise<[any,number]> {
  // 1. Convert image to tensor
  const [imageTensor, xRatio, yRatio] = preprocessYolov8(image);
  // 2. Run model
  // console.log('image tens', imageTensor, xRatio, yRatio)
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

export async function inferenceResNetTest(image: HTMLImageElement, bbox: [x: number, y: number, w: number, h: number]): Promise<[any,number]> {
  // 1. Convert image to tensor
  //const [imageTensor, xRatio, yRatio] = preprocessYolov8(image);
  // const preparedInput = prepare_input_resnet(image);
  const input = await loadAndCropBodyImageCV(image, bbox, [1, 3, 224, 224])
  // 2. Run model
  //console.log('image tens', imageTensor, xRatio, yRatio)
  const [predictions, inferenceTime] = await runResNetModel(input, 1, 1);

  // resnet returns 256 encodings for the frame
  var features = predictions.output.data as Array<number>;


  //const arrayBuf = [];
  arrayBuf.push(features);

  // console.log('arrayBuf length', arrayBuf.length, arrayBuf);
  if (arrayBuf.length === 32) {
    const joinedBuf = bufjoin(arrayBuf);
    var res = new Tensor(Float32Array.from(joinedBuf), [1, 32, 256]);
    arrayBuf.shift();
    // console.log('joinedBuf res', joinedBuf, res)
    const [classifierPredictions, classifierInferenceTime] = await inferenceClassifier(res)
    // console.log('res classifier', classifierPredictions)
    return [classifierPredictions, classifierInferenceTime];
  }

  // 3. Return predictions and the amount of time it took to inference.
  return [predictions, inferenceTime];
}

// https://stackoverflow.com/questions/4554252/typed-arrays-in-gecko-2-float32array-concatenation-and-expansion
function sum(a: any[]){
  return a.reduce(function(a,b){return a+b;},0);
}

// call this with an array of Float32Array objects
function bufjoin(bufs: any[]){
  var lens=bufs.map(function(a){return a.length;});
  var aout=new Float32Array(sum(lens));
  for (var i=0;i<bufs.length;++i){
    var start=sum(lens.slice(0,i));
    aout.set(bufs[i],start); // copy bufs[i] to aout at start position
  }
  return aout;
}

export async function inferenceClassifier(features: any): Promise<[any,number]> {
  // 1. Convert image to tensor
  //const [imageTensor, xRatio, yRatio] = preprocessYolov8(image);
  // const preparedInput = prepare_input_resnet(image);
  // const input = await loadAndCropBodyImageCV(image, bbox, [1, 3, 224, 224])
  // 2. Run model
  //console.log('image tens', imageTensor, xRatio, yRatio)
  const [predictions, inferenceTime] = await runClassifierModel(features);
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
      red.push(data[index]/255); // toDo: danach  -0.45/0.255 -> preprocessing
      green.push(data[index+1]/255);
      blue.push(data[index+2]/255);
  }
  }
  
  return [...red, ...green, ...blue];
}

function prepare_input_resnet(img: HTMLImageElement) {  
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  context?.drawImage(img, 0, 0, 640, 640);

  const data = context?.getImageData(0,0,640,640).data;
  const red = [], green = [], blue = [];
  if (data) {
    for (let index=0;index<data.length;index+=4) {
      red.push(data[index]/255); // toDo: danach  -0.45/0.255 -> preprocessing
      green.push(data[index+1]/255);
      blue.push(data[index+2]/255);
  }
  }
  
  return [...red, ...green, ...blue];
}
