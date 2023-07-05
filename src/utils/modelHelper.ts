import {InferenceSession, Tensor} from 'onnxruntime-web';
import _ from 'lodash';
import cv from "@techstark/opencv-js";
import { postprocessYoloV8Face, preprocessYolov8 } from './imageHelper';
var emotionSession: InferenceSession | undefined = undefined; 
var yolov8Session: InferenceSession | undefined = undefined; 
var yolov8NMSSession: InferenceSession | undefined = undefined; 
var yolov8FaceSession: InferenceSession | undefined = undefined;
var onnxFaceSession: InferenceSession | undefined = undefined;
const basePath = `${process.env.PUBLIC_URL}/model`;




export async function warmupModel(model: InferenceSession, dims: number[]) {
  const size = dims.reduce((a, b) => a * b);
  const warmupTensor = new Tensor('float32', new Float32Array(size), dims);

  for (let i = 0; i < size; i++) {
    warmupTensor.data[i] = Math.random() * 2.0 - 1.0;  // random value [-1.0, 1.0)
  }
  try {
    const feeds: Record<string, Tensor> = {};
    feeds[model.inputNames[0]] = warmupTensor;
    await model.run(feeds);
  } catch (e) {
    console.error(e);
  }
}

export async function runYoloV8Model(preprocessedData: any, xRatio: number, yRatio: number): Promise<[any, number]> {
  if (yolov8Session === undefined || yolov8NMSSession === undefined) {
    yolov8Session = await InferenceSession
      .create(basePath+'/yolov8n.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all', executionMode: 'sequential' });

    yolov8NMSSession = await InferenceSession
      .create(basePath+'/nms-yolov8.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all', executionMode: 'sequential' });
    console.log('Yolov8 Inference session created',  yolov8Session, yolov8NMSSession)
  } 


  // Run inference and get results.
  var [results, inferenceTime] =  await runInferenceYolov8(yolov8Session, yolov8NMSSession, preprocessedData);
  console.log('yolov8 results', results)
  const boxes = [];

  // looping through output
  for (let idx = 0; idx < results.dims[1]; idx++) {
    const data = results.data.slice(idx * results.dims[2], (idx + 1) * results.dims[2]); // get rows
    const box = data.slice(0, 4);
    const scores: any = data.slice(4); // classes probability scores
    const score : number = Math.max(...scores); // maximum probability scores
    const label = scores.indexOf(score); // class id of maximum probability scores

    const [x, y, w, h] = [
      (box[0] - 0.5 * box[2]) * xRatio, // upscale left
      (box[1] - 0.5 * box[3]) * yRatio, // upscale top
      box[2] * xRatio, // upscale width
      box[3] * yRatio, // upscale height
    ]; // keep boxes in maxSize range

    boxes.push({
      label: label,
      probability: score,
      bounding: [x, y, w, h], // upscale box
    }); // update boxes to draw later
  }
  return [boxes, inferenceTime];
}

export async function runYoloV8FaceModel(preprocessedData: any, xRatio: number, yRatio: number): Promise<[any, number]> {
  if (yolov8FaceSession === undefined) {
    yolov8FaceSession = await InferenceSession
      .create(basePath+'/yolov8n-face-2.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all', executionMode: 'sequential' });
  } 

  // Run inference and get results.
  var [results, inferenceTime] =  await runInferenceYolov8Face(yolov8FaceSession, preprocessedData);
  console.log('yolov8 face results', results)

  // postprocessYoloV8Face(results, xRatio, yRatio, 0, 0)

  return [results, inferenceTime];

}

export async function runEmotionModel(preprocessedData: any): Promise<[any, number]> {
  if (emotionSession === undefined) {
    emotionSession = await InferenceSession
      .create(basePath+'/enet_b0_8_va_mtl.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'disabled' });      
  } 
  // Run inference and get results.
  var [results, inferenceTime] =  await runInferenceEmotion(emotionSession, preprocessedData);
  return [results, inferenceTime];
}



async function runInferenceYolov8(session: InferenceSession, sessionNMS: InferenceSession, preprocessedData: any): Promise<[any, number]> {
  // Get start time to calculate inference time.
  const start = new Date();
  // create feeds with the input name from model export and the preprocessed data.
  
  const config = new Tensor(
    "float32",
    new Float32Array([
      100, // topk per class
      0.45, // iou threshold
      0.25, // score threshold
    ])
  ); // nms config tensor
  console.log('config', config, 'prepr', preprocessedData)
  // Run the session inference.

  const { output0 } = await session.run({ images: preprocessedData }); // run session and get output layer
  console.log('output0', output0)
  const { selected } = await sessionNMS.run({ detection: output0, config: config }); // perform nms and filter boxes
  
  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime())/1000;

  return [selected, inferenceTime];
}

async function runInferenceYolov8Face(session: InferenceSession, preprocessedData: any): Promise<[any, number]> {
  // Get start time to calculate inference time.
  const start = new Date();
  // create feeds with the input name from model export and the preprocessed data.

  const output_orig = await session.run({ images: preprocessedData }); // run session and get output layer
  const output = output_orig['output0'].data
  console.log('output0', output)
  const config = new Tensor(
    "float32",
    new Float32Array([
      100, // topk per class
      0.5, // iou threshold
      0.2, // score threshold
    ])
  ); // nms config tensor


  // postprocess
  let img_width = 640;
  let img_height = 640; 
  let boxes: any[] = [];
  for (let index=0;index<8400;index++) {
      const [class_id,prob] = [...Array(80).keys()]
          .map(col => [col, output[8400*(col+4)+index]])
          .reduce((accum, item) => item[1]>accum[1] ? item : accum,[0,0]);
      if (prob as number < 0.5) {
          continue;
      }
      const label = 'face';
      const xc : any = output[index];
      const yc : any = output[8400+index];
      const w : any = output[2*8400+index];
      const h : any = output[3*8400+index];
      const x1 = (xc-w/2)/640*img_width;
      const y1 = (yc-h/2)/640*img_height;
      const x2 = (xc+w/2)/640*img_width;
      const y2 = (yc+h/2)/640*img_height;
      boxes.push({'bounding': [x1,y1,x2,y2],'label': label, 'probability': prob});
  }

  boxes = boxes.sort((box1,box2) => box2.probability-box1.probability)
  const result = [];
  while (boxes.length>0) {
      result.push(boxes[0]);
      boxes = boxes.filter(box => iou(boxes[0],box)<0.7);
  }
  
  console.log ('preprocessed result', result);
  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime())/1000;

  return [result, inferenceTime];
}

async function runInferenceEmotion(session: InferenceSession, preprocessedData: any): Promise<[any, number]> {
  // Get start time to calculate inference time.
  const start = new Date();
  // create feeds with the input name from model export and the preprocessed data.
  const feeds: Record<string, Tensor> = {};
  feeds[session.inputNames[0]] = preprocessedData;
  console.log('feeds', feeds)
  
  // Run the session inference.
  const outputData = await session.run(feeds);
  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime())/1000;
  // Get output results with the output name from the model export.
  // const output = outputData[session.outputNames[0]];
  console.log('emotion output', outputData)


  
  return [outputData, inferenceTime];
}

//The softmax transforms values to be between 0 and 1
function softmax(resultArray: number[]): any {
  // Get the largest value in the array.
  const largestNumber = Math.max(...resultArray);
  // Apply exponential function to each result item subtracted by the largest number, use reduce to get the previous result number and the current number to sum all the exponentials results.
  const sumOfExp = resultArray.map((resultItem) => Math.exp(resultItem - largestNumber)).reduce((prevNumber, currentNumber) => prevNumber + currentNumber);
  //Normalizes the resultArray by dividing by the sum of all exponentials; this normalization ensures that the sum of the components of the output vector is 1.
  return resultArray.map((resultValue, index) => {
    return Math.exp(resultValue - largestNumber) / sumOfExp;
  });
}







function iou(box1: any,box2: any) {
  return intersection(box1,box2)/union(box1,box2);
}

function union(box1: {probability: number, label: string, bounding:[any, any, any, any]},box2: {probability: number, label: string, bounding:[any, any, any, any]}) {
  const [box1_x1,box1_y1,box1_x2,box1_y2] = box1.bounding;
  const [box2_x1,box2_y1,box2_x2,box2_y2] = box2.bounding;
  const box1_area = (box1_x2-box1_x1)*(box1_y2-box1_y1)
  const box2_area = (box2_x2-box2_x1)*(box2_y2-box2_y1)
  return box1_area + box2_area - intersection(box1,box2)
}

function intersection(box1: {probability: number, label: string, bounding:[any, any, any, any]},box2: {probability: number, label: string, bounding:[any, any, any, any]}) {
  const [box1_x1,box1_y1,box1_x2,box1_y2] = box1.bounding;
  const [box2_x1,box2_y1,box2_x2,box2_y2] = box2.bounding;
  const x1 = Math.max(box1_x1,box2_x1);
  const y1 = Math.max(box1_y1,box2_y1);
  const x2 = Math.min(box1_x2,box2_x2);
  const y2 = Math.min(box1_y2,box2_y2);
  return (x2-x1)*(y2-y1)
}

const yolo_classes = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
  'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase',
  'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
  'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant',
  'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
  'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];