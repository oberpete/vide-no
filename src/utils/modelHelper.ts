import {InferenceSession, Tensor} from 'onnxruntime-web';
import _ from 'lodash';
var emotionSession: InferenceSession | undefined = undefined; 
var yolov8FaceSession: InferenceSession | undefined = undefined;
var reseNetSession: InferenceSession | undefined = undefined;
var classifierSession: InferenceSession | undefined = undefined;
const basePath = `${process.env.PUBLIC_URL}/model`;




export async function warmupModel(preprocessedData: any, model: InferenceSession, dims: number[]) {
  var testDims = [1,2,3];
  const testSize = testDims.reduce((a, b) => a * b);

  const size = dims.reduce((a, b) => a * b);
  const warmupTensor = new Tensor('float32', new Float32Array(size), dims);
  
  for (let i = 0; i < size; i++) {
    warmupTensor.data[i] = Math.random() * 2.0 - 1.0;  // random value [-1.0, 1.0)
  }
  try {
    const feeds: Record<string, Tensor> = {};
    feeds[model.inputNames[0]] = warmupTensor;
    var res = await model.run(feeds);
    console.log('warmup result', warmupTensor, res)
    console.log('warmup preprocessed data', preprocessedData)
  } catch (e) {
    console.error(e);
  }
}



export async function runYoloV8FaceModel(preprocessedData: any, xRatio: number, yRatio: number): Promise<[any, number]> {
  if (yolov8FaceSession === undefined) {
    yolov8FaceSession = await InferenceSession
      .create(basePath+'/yolov8n-face-2.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all', executionMode: 'sequential' });
  } 

  // Run inference and get results.
  var [results, inferenceTime] =  await runInferenceYolov8Face(yolov8FaceSession, preprocessedData);
  // console.log('yolov8 face results', results)


  return [results, inferenceTime];

}

export async function runResNetModel(preprocessedData: any, xRatio: number, yRatio: number): Promise<[any, number]> {
  if (reseNetSession === undefined) {
    reseNetSession = await InferenceSession
      .create(basePath+'/Pretrained_ResNet18_E38.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all', executionMode: 'sequential' });
  } 

  // Run inference and get results.
  // console.log('resnet input', reseNetSession, preprocessedData)
  var [results, inferenceTime] =  await runInferenceResNet(reseNetSession, preprocessedData);
  // console.log('yolov8 face results', results)

  return [results, inferenceTime];

}

export async function runClassifierModel(preprocessedData: any): Promise<[any, number]> {
  if (classifierSession === undefined) {
    classifierSession = await InferenceSession
      .create(basePath+'/Pretrained_Classifier_E38.onnx', 
      { executionProviders: ['wasm'], graphOptimizationLevel: 'all', executionMode: 'sequential' });
  } 
  // await warmupModel(preprocessedData, classifierSession,[1,32,256]);
  // Run inference and get results.
  var [results, inferenceTime] =  await runInferenceResNet(classifierSession, preprocessedData);

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

async function runInferenceYolov8Face(session: InferenceSession, preprocessedData: any): Promise<[any, number]> {
  // Get start time to calculate inference time.
  const start = new Date();
  // create feeds with the input name from model export and the preprocessed data.

  const output_orig = await session.run({ images: preprocessedData }); // run session and get output layer
  const output = output_orig['output0'].data

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
  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime())/1000;

  return [result, inferenceTime];
}

async function runInferenceResNet(session: InferenceSession, preprocessedData: any): Promise<[any, number]> {
  // Get start time to calculate inference time.
  const start = new Date();
  // create feeds with the input name from model export and the preprocessed data.

  const output_orig = await session.run({ input: preprocessedData }); // run session and get output layer
  // console.log('output0', output_orig)


  
  console.log ('resnet result', output_orig);
  // Get the end time to calculate inference time.
  const end = new Date();
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime())/1000;

  return [output_orig, inferenceTime];
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
