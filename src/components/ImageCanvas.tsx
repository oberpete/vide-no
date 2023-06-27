import { useEffect, useRef, useState } from 'react';
import { IMAGE_URLS } from '../data/sample-image-urls';
import { inferenceSqueezenet, inferenceTinyYoloModel, inferenceContextModel, inferenceBodyModel, inferenceBodyModelNoPersonFound, inferenceEmoticModel } from '../utils/predict';

import styles from '../styles/Home.module.css';
import { Tensor } from 'onnxruntime-web';
import ndarray from 'ndarray';
import ops, { any } from "ndarray-ops";
import { Button } from 'antd';

interface Props {
  height: number;
  width: number;
}

const ImageCanvas = (props: Props) => {

  const webcamElement = useRef<HTMLVideoElement>(null);
  const screenshotElement = useRef<HTMLCanvasElement>(null);
  const [webcamActive, setWebcamActive] = useState(true);
  const [inferenceTime, setInferenceTime] = useState("");
  const [result, setResult] = useState([] as any);

  var videoOrigWidth: number;
  var videoOrigHeight: number;
  var webcamStream: MediaStream;

  
  // Load the image from the IMAGE_URLS array
  const getImage = () => {
    var sampleImageUrls: Array<{ text: string; value: string }> = IMAGE_URLS;
    var random = Math.floor(Math.random() * (9 - 0 + 1) + 0);
    return sampleImageUrls[random];
  }

  const preprocess = (ctx : CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    const { data, width, height } = imageData;
    // data processing
    const dataTensor = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);

    ops.assign(
      dataProcessedTensor.pick(0, 0, null, null),
      dataTensor.pick(null, null, 0)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 1, null, null),
      dataTensor.pick(null, null, 1)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 2, null, null),
      dataTensor.pick(null, null, 2)
    );

    const tensor = new Tensor("float32", new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);
    (tensor.data as Float32Array).set(dataProcessedTensor.data);
    return tensor;
  }

  const adjustVideoSize = (width: number, height: number) => {
    const aspectRatio = width / height;
    if (webcamElement.current) {
      let webcam = webcamElement.current;
      if (width >= height) {
        webcam.width = aspectRatio * webcam.height;
      } else if (width < height) {
        webcam.height = webcam.width / aspectRatio;
      }
    }
  }

  const initCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment" },
      });
      webcamStream = stream;
      console.log('webcamElement', webcamElement)
      if (webcamElement.current) {
        var webcam = webcamElement.current
        webcam.srcObject = stream;
        console.log('stream', stream)
        
        return new Promise<void>((resolve) => {
          webcam.onloadedmetadata = () => {
            videoOrigWidth = webcam.videoWidth;
            videoOrigHeight = webcam.videoHeight;
            adjustVideoSize(videoOrigWidth, videoOrigHeight);
            webcam.play();
            resolve();
          };
        });
      }
      
    } else {
      throw new Error("No webcam found!");
    }
  }

  const capture = (): CanvasRenderingContext2D | undefined => {
    const size = Math.min(videoOrigWidth, videoOrigHeight);
    const centerHeight = videoOrigHeight / 2;
    const beginHeight = centerHeight - size / 2;
    const centerWidth = videoOrigWidth / 2;
    const beginWidth = centerWidth - size / 2;

    // placeholder to draw a image
    const canvas = document.getElementById("screenshot") as HTMLCanvasElement;
    if (webcamElement.current) {
      canvas.width = Math.min(
        webcamElement.current.width,
        webcamElement.current.height
      );
      canvas.height = Math.min(
        webcamElement.current.width,
        webcamElement.current.height
      );
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.drawImage(
        webcamElement.current,
        beginWidth,
        beginHeight,
        size,
        size,
        0,
        0,
        canvas.width,
        canvas.height
      );
      return context;
    }
  return undefined;
  }

  const captureAndInference = async() => {
    setWebcamActive(false);
    await wait(1000);
    const ctx = capture();
    console.log('ctx',ctx);
    if (ctx !== undefined) {
      // const preprocessedYoloData = preprocess(ctx);
      // var [inferenceYoloResult, inferenceYoloTime] = await inferenceTinyYoloModel(preprocessedYoloData);

      // {/* draw yolo bounding boxes */}
      // inferenceYoloResult.forEach((box : any) => {
      //   const { top, left, bottom, right, classProb, className } = box;

      //   drawRect(
      //     left,
      //     top,
      //     right - left,
      //     bottom - top,
      //     `${className} Confidence: ${Math.round(
      //       classProb * 100
      //     )}% Time: ${inferenceYoloTime.toFixed(1)}ms`
      //   );
      // });
      // console.log('yolo result', inferenceYoloResult);

      // // inference context model
      // var [inferenceContextResult,inferenceContextTime] = await inferenceContextModel(ctx.canvas.toDataURL());

      // // get person bbox
      // const person = inferenceYoloResult.find((o: { className: string; }) => o.className === 'Person')
      // console.log('person', person);

      // if (person) {
      //   var [inferenceBodyResult,inferenceBodyTime] = await inferenceBodyModel(ctx.canvas.toDataURL(), person.left, person.top, (person.right-person.left), (person.bottom - person.top));
      // } else {
      //   var [inferenceBodyResult,inferenceBodyTime] = await inferenceBodyModelNoPersonFound(ctx.canvas.toDataURL());
      // }
      
      // // inference emotic model
      // var [inferenceEmoticResult,inferenceEmoticTime] = await inferenceEmoticModel(inferenceContextResult, inferenceBodyResult);
      // setResult(inferenceEmoticResult);
    }
  }

  const wait = (milliseconds: number) => { return new Promise(resolve => setTimeout(resolve, milliseconds)) }

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    text = "",
    color = "red"
    ) => {
    const webcamContainerElement = document.getElementById("webcam-container") as HTMLElement;
    // Depending on the display size, webcamContainerElement might be smaller than 416x416.
    const [ox, oy] = [(webcamContainerElement.offsetWidth - 416) / 2, (webcamContainerElement.offsetHeight - 416) / 2];
    const rect = document.createElement("div");
    rect.style.cssText = `top: ${y+oy}px; left: ${x+ox}px; width: ${w}px; height: ${h}px; border: 1px solid red; position: absolute;`;
    const label = document.createElement("div");
    label.innerText = text;
    rect.appendChild(label);

    webcamContainerElement.appendChild(
      rect
    );
  }

  const clearCanvas = () => {
    setResult(null);
    const element = document.getElementById(
      "screenshot"
    ) as HTMLCanvasElement;
    if (element) {
      const ctx = element.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    }
  }

  const clearRects = () => {
    const webcamContainerElement = document.getElementById("webcam-container") as HTMLElement;
    while (webcamContainerElement.childNodes.length > 2) {
      webcamContainerElement.removeChild(webcamContainerElement.childNodes[2]);
    }
  }
  
  const reset = () => {
    /* clearCanvas();
    clearRects();
    setWebcamActive(true); */
    window.location.reload();
  }

  useEffect(() => {
    initCamera();
  }, []);

  return (
    <>
      <div id="webcam-container" className={styles.webcamContainer}>
        <video playsInline muted ref={webcamElement} id="webcam" width={props.width} height={props.height}></video>
        <canvas id="screenshot" className={styles.screenshot} ref={screenshotElement} width={props.width} height={props.height} />
      </div>
      
      {webcamActive ?
      <>
        <button className={styles.button} onClick={captureAndInference}>Capture photo</button>
        <Button type="primary">Button</Button>
        </>
        :
        <button className={styles.button} onClick={reset}>Reset</button>
      }


      <div id="cropped-image">
        <h3>Cropped Image</h3>

      </div>
      <ul>
      {result && result.map((emotion : any) => (
        <li key={emotion.category}>{emotion.category}: {emotion.value}</li>
      ))}
      </ul>
    </>
  )

};

export default ImageCanvas;
