import * as Jimp from 'jimp';
import cv from "@techstark/opencv-js";
import { Tensor } from 'onnxruntime-web';
import yoloV8Classes from "../data/yoloV8Classes";

export async function getImageTensorFromPath(path: string, dims: number[] =  [1, 3, 224, 224]): Promise<Tensor> {
  // 1. load the image  
  var image = await loadImageFromPath(path, dims[2], dims[3]);
  // 2. convert to tensor
  var imageTensor = imageDataToTensor(image, dims);
  // 3. return the tensor
  return imageTensor;
}

export async function getImageTensorFromBuffer(image: any, dims: number[] =  [1, 3, 224, 224]): Promise<Tensor> {
  var imageData = await Jimp.default.read(image).then((imageBuffer: Jimp) => {
    return imageBuffer.resize(dims[2], dims[3]);
  });
  var imageTensor = imageDataToTensor(imageData, dims);
  // 3. return the tensor
  return imageTensor;
}

export async function loadAndCropBodyImage(path: string, bbox: [y: number, x: number, w: number, h: number], dims: number[]): Promise<Tensor> {
  
  console.log('resize img', path)
  var imageData = await Jimp.default.read(path).then((imageBuffer: Jimp) => {
    imageBuffer.crop(bbox[0], bbox[1], bbox[2], bbox[3])
    let tag = document.createElement("img");
    return imageBuffer.resize(dims[2], dims[3]);
  });
  console.log('image data cropped', imageData)

  imageData.getBase64Async('image/jpeg').then(newImage => {
    let tag = document.createElement("img");
    tag.src = newImage;
    const element: HTMLElement | null = document.getElementById("cropped-image");
    if (element !== null) {
      element.append(tag)
    }
    
  })

  var imageTensor = imageDataToTensor(imageData, dims);
  // 3. return the tensor
  return imageTensor;
}

export async function loadAndCropBodyImageCV(source: HTMLImageElement, bbox: [y: number, x: number, w: number, h: number], dims: number[]): Promise<Tensor> {
  
  const mat = cv.imread(source); // read from img tag
  const matC3 = new cv.Mat(mat.rows, mat.cols, cv.CV_8UC3); // new image matrix
  cv.cvtColor(mat, matC3, cv.COLOR_RGBA2BGR); // RGBA to BGR

  // padding image to [n x n] dim
  const maxSize = Math.max(matC3.rows, matC3.cols); // get max size from width and height
  const xPad = maxSize - matC3.cols, // set xPadding
    xRatio = maxSize / matC3.cols; // set xRatio
  const yPad = maxSize - matC3.rows, // set yPadding
    yRatio = maxSize / matC3.rows; // set yRatio
  const matPad = new cv.Mat(); // new mat for padded image
  cv.copyMakeBorder(matC3, matPad, 0, yPad, 0, xPad, cv.BORDER_CONSTANT); // padding black

  const input = cv.blobFromImage(
    matPad,
    1 / 255.0, // normalize
    new cv.Size(dims[2], dims[3]), // resize to model input size
    new cv.Scalar(0, 0, 0),
    true, // swapRB
    false // crop
  ); // preprocessing image matrix
    
  mat.delete();
  matC3.delete();
  matPad.delete();
  console.log('xratio', xRatio, 'yratio', yRatio)
  let tensor = new Tensor("float32", input.data32F, [1, 3, dims[2], dims[3]]);
  return tensor;
}

export async function resizeImage(image: string, dims: number[]): Promise<Tensor> {
  var imageData = await Jimp.default.read(image).then((imageBuffer: Jimp) => {
    let maxSize = Math.max(...dims);
    imageBuffer.resize(maxSize, maxSize);
    imageBuffer.crop(1,1,640,480);
    return imageBuffer
  });
  var imageTensor = imageDataToTensor(imageData, dims);
  console.log('resize image', imageData)
  // 3. return the tensor
  return imageTensor;
}

async function loadImageFromPath(path: string, width: number = 224, height: number= 224): Promise<Jimp> {
  // Use Jimp to load the image and resize it.
  var imageData = await Jimp.default.read(path).then((imageBuffer: Jimp) => {
    return imageBuffer.resize(width, height);
  });

  return imageData;
}

function imageDataToTensor(image: Jimp, dims: number[]): Tensor {
  // 1. Get buffer data from image and create R, G, and B arrays.
  var imageBufferData = image.bitmap.data;
  const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += 4) {
    redArray.push(imageBufferData[i]);
    greenArray.push(imageBufferData[i + 1]);
    blueArray.push(imageBufferData[i + 2]);
    // skip data[i + 3] to filter out the alpha channel
  }

  // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const transposedData = redArray.concat(greenArray).concat(blueArray);

  // 4. convert to float32
  let i, l = transposedData.length; // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  for (i = 0; i < l; i++) {
    float32Data[i] = transposedData[i] / 255.0; // convert to float
  }
  // 5. create the tensor object from onnxruntime-web.
  const inputTensor = new Tensor("float32", float32Data, dims);
  console.log('input tensor ', inputTensor, dims)
  return inputTensor;
}

export function preprocessYolov8 (source: HTMLImageElement, modelWidth: number = 640, modelHeight: number = 640) {
  const mat = cv.imread(source); // read from img tag
  const matC3 = new cv.Mat(mat.rows, mat.cols, cv.CV_8UC3); // new image matrix
  cv.cvtColor(mat, matC3, cv.COLOR_RGBA2BGR); // RGBA to BGR

  // padding image to [n x n] dim
  const maxSize = Math.max(matC3.rows, matC3.cols); // get max size from width and height
  const xPad = maxSize - matC3.cols, // set xPadding
    xRatio = maxSize / matC3.cols; // set xRatio
  const yPad = maxSize - matC3.rows, // set yPadding
    yRatio = maxSize / matC3.rows; // set yRatio
  const matPad = new cv.Mat(); // new mat for padded image
  cv.copyMakeBorder(matC3, matPad, 0, yPad, 0, xPad, cv.BORDER_CONSTANT); // padding black

  const input = cv.blobFromImage(
    matPad,
    1 / 255.0, // normalize
    new cv.Size(modelWidth, modelHeight), // resize to model input size
    new cv.Scalar(0, 0, 0),
    true, // swapRB
    false // crop
  ); // preprocessing image matrix
  console.log('input', input.data32F, input.data)
  // release mat opencv
  mat.delete();
  matC3.delete();
  matPad.delete();
  console.log('xratio', xRatio, 'yratio', yRatio)
  let tensor = new Tensor("float32", input.data32F, [1, 3, modelWidth, modelHeight]);
  return [tensor, xRatio, yRatio];
};

export const renderBoxes = (canvas: HTMLCanvasElement, boxes: any) => {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas


    // font configs
    const font = `${Math.max(
      Math.round(Math.max(ctx.canvas.width, ctx.canvas.height) / 40),
      14
    )}px Arial`;
    ctx.font = font;
    ctx.textBaseline = "top";

    boxes.forEach((box: { label: number; probability: number; bounding: [any, any, any, any]; }) => {
      const klass = box.label;
      const color = 'rgba(0, 255, 119, 0.8)'
      const score = (box.probability * 100).toFixed(1);
      const [x1, y1, width, height] = box.bounding;

      // draw box.
      ctx.fillStyle = 'rgba(0, 255, 119, 0.1)'
      // ctx.fillRect(x1, y1, width, height);
      ctx.fillRect(x1, y1, width-x1, height-y1);
      // draw border box
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 200, 2.5);
      // ctx.strokeRect(x1, y1, width, height);
      ctx.strokeRect(x1, y1, width-x1, height-y1);

      // draw the label background.
      ctx.fillStyle = color;
      const textWidth = ctx.measureText(klass + " - " + score + "%").width;
      const textHeight = parseInt(font, 10); // base 10
      const yText = y1 - (textHeight + ctx.lineWidth);
      ctx.fillRect(
        x1 - 1,
        yText < 0 ? 0 : yText,
        textWidth + ctx.lineWidth,
        textHeight + ctx.lineWidth
      );

      // Draw labels
      ctx.fillStyle = "#ffffff";
      ctx.fillText(klass + " - " + score + "%", x1 - 1, yText < 0 ? 1 : yText + 1);
    });
  }
  
};

export const renderBoxesFace = (canvas: HTMLCanvasElement, boxes: any) => {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 3;
    ctx.font = "18px serif";
    boxes.forEach((box: { label: string; probability: number; bounding: [any, any, any, any]; }) => {
      const [x1, y1, x2, y2] = box.bounding;  
      ctx.strokeRect(x1,y1,x2-x1,y2-y1);
      ctx.fillStyle = "#00ff00";
      const width = ctx.measureText(box.label).width;
      ctx.fillRect(x1,y1,width+10,25);
      ctx.fillStyle = "#000000";
      ctx.fillText(box.label, x1, y1+18);
    });
  }
  
};


// heavily derived from https://github.com/hpc203/yolov8-face-landmarks-opencv-dnn/blob/main/main.py
export const postprocessYoloV8Face = (preds: any, scale_h: number, scale_w: number, padh: number, padw: number) => {
  var [bboxes, scores, landmarks] = [[], [], []]
  for (var pred in preds) {
    console.log('pred', pred)
  }
  // -----------------
//   for i, pred in enumerate(preds):
//       stride = int(self.input_height/pred.shape[2])
//       pred = pred.transpose((0, 2, 3, 1))
      
//       box = pred[..., :self.reg_max * 4]
//       cls = 1 / (1 + np.exp(-pred[..., self.reg_max * 4:-15])).reshape((-1,1))
//       kpts = pred[..., -15:].reshape((-1,15)) ### x1,y1,score1, ..., x5,y5,score5

//       # tmp = box.reshape(self.feats_hw[i][0], self.feats_hw[i][1], 4, self.reg_max)
//       tmp = box.reshape(-1, 4, self.reg_max)
//       bbox_pred = self.softmax(tmp, axis=-1)
//       bbox_pred = np.dot(bbox_pred, self.project).reshape((-1,4))

//       bbox = self.distance2bbox(self.anchors[stride], bbox_pred, max_shape=(self.input_height, self.input_width)) * stride
//       kpts[:, 0::3] = (kpts[:, 0::3] * 2.0 + (self.anchors[stride][:, 0].reshape((-1,1)) - 0.5)) * stride
//       kpts[:, 1::3] = (kpts[:, 1::3] * 2.0 + (self.anchors[stride][:, 1].reshape((-1,1)) - 0.5)) * stride
//       kpts[:, 2::3] = 1 / (1+np.exp(-kpts[:, 2::3]))

//       bbox -= np.array([[padw, padh, padw, padh]])  ###合理使用广播法则
//       bbox *= np.array([[scale_w, scale_h, scale_w, scale_h]])
//       kpts -= np.tile(np.array([padw, padh, 0]), 5).reshape((1,15))
//       kpts *= np.tile(np.array([scale_w, scale_h, 1]), 5).reshape((1,15))

//       bboxes.append(bbox)
//       scores.append(cls)
//       landmarks.append(kpts)

//   bboxes = np.concatenate(bboxes, axis=0)
//   scores = np.concatenate(scores, axis=0)
//   landmarks = np.concatenate(landmarks, axis=0)

//   bboxes_wh = bboxes.copy()
//   bboxes_wh[:, 2:4] = bboxes[:, 2:4] - bboxes[:, 0:2]  ####xywh
//   classIds = np.argmax(scores, axis=1)
//   confidences = np.max(scores, axis=1)  ####max_class_confidence
  
//   mask = confidences>self.conf_threshold
//   bboxes_wh = bboxes_wh[mask]  ###合理使用广播法则
//   confidences = confidences[mask]
//   classIds = classIds[mask]
//   landmarks = landmarks[mask]
  
//   indices = cv2.dnn.NMSBoxes(bboxes_wh.tolist(), confidences.tolist(), self.conf_threshold,
//                              self.iou_threshold).flatten()
//   if len(indices) > 0:
//       mlvl_bboxes = bboxes_wh[indices]
//       confidences = confidences[indices]
//       classIds = classIds[indices]
//       landmarks = landmarks[indices]
//       return mlvl_bboxes, confidences, classIds, landmarks
//   else:
//       print('nothing detect')
//       return np.array([]), np.array([]), np.array([]), np.array([])
}


