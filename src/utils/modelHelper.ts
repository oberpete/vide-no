import {InferenceSession, Tensor} from 'onnxruntime-web';
import _ from 'lodash';
import { postprocessYoloV8Face } from './imageHelper';
var emotionSession: InferenceSession | undefined = undefined; 
var yolov8Session: InferenceSession | undefined = undefined; 
var yolov8NMSSession: InferenceSession | undefined = undefined; 
var yolov8FaceSession: InferenceSession | undefined = undefined;
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
      .create(basePath+'/yolov8n-face.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all', executionMode: 'sequential' });
  } 


  // Run inference and get results.
  var [results, inferenceTime] =  await runInferenceYolov8Face(yolov8FaceSession, preprocessedData);
  console.log('yolov8 face results', results)

  postprocessYoloV8Face(results, xRatio, yRatio, 0, 0)

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

  const output = await session.run({ images: preprocessedData }); // run session and get output layer
  console.log('output0', output)
  const config = new Tensor(
    "float32",
    new Float32Array([
      100, // topk per class
      0.5, // iou threshold
      0.2, // score threshold
    ])
  ); // nms config tensor
  // https://github.com/hpc203/yolov8-face-landmarks-opencv-dnn/tree/main
  // if (yolov8NMSSession) {
  //   const { selected } = await yolov8NMSSession.run({ detection: output0, config: config }); // perform nms and filter boxes
  //   console.log('face result nms', selected)
  // }
  
  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime())/1000;

  return [output, inferenceTime];
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

