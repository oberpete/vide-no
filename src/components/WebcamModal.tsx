import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';
import { Button, Modal } from 'antd';
import { CloseCircleOutlined, EyeInvisibleOutlined, PlayCircleOutlined, CameraFilled } from '@ant-design/icons';
import { inferenceYoloV8Model, inferenceEmotionModel, inferenceYoloV8FaceModel } from '../utils/predict';
import ndarray from 'ndarray';
import ops from "ndarray-ops";
import { Tensor } from 'onnxruntime-web';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectUser, setInferencingInProgress, setWebcamModalOpen } from '../app/appStateSlice';
import { useSetUserStatusMutation } from '../app/userMgmtFirestore';
import {
  useFetchPresentationStatsByIdQuery,
} from '../app/presentationStatsFirestore';
import { UserData } from '../types';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { renderBoxes, renderBoxesFace } from '../utils/imageHelper';


const WebcamModal: React.FC = () => {

  const webcamElement = useRef<HTMLVideoElement>(null);
  const screenshotElement = useRef<HTMLCanvasElement>(null);
  const inferencingInProgress = useAppSelector((state) => state.appState.inferencingInProgress);
  const inferencingInProgressRef = useRef<boolean>(inferencingInProgress)
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const webcamModalOpen = useAppSelector((state) => state.appState.webcamModalOpen);
  var videoOrigWidth: number;
  var videoOrigHeight: number;

  const [webcamStream, setWebcamStream] = useState<MediaStream | undefined>(undefined);
  const user = useAppSelector(selectUser);
  const userRef = useRef(user);
  const userStatus = useAppSelector(state => state.appState.user?.status);
  const userStatusRef = useRef(userStatus);
  const [detectSession,setDetectSession] = useState(null);
  
  const { data } = useFetchPresentationStatsByIdQuery(sessionId ?? skipToken);
  const currentSlideNumberRef = useRef(1);
  const idx_to_class=['Anger', 'Contempt', 'Disgust', 'Fear', 'Happiness', 'Neutral', 'Sadness', 'Surprise', 'Valence', 'Arousal'];


  const [ setUserStatus ] = useSetUserStatusMutation(); 

  const dispatch = useAppDispatch()

  useEffect(() => {
    currentSlideNumberRef.current = data?.currentSlideNumber || 1;
    if (data?.presentationFinished === true) {
      dispatch(setInferencingInProgress(false));
    }
  }, [data?.currentSlideNumber, data?.presentationFinished, dispatch]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    inferencingInProgressRef.current = inferencingInProgress;
  }, [inferencingInProgress]);

  useEffect(() => {
    userStatusRef.current = userStatus; // Update the ref whenever userStatus changes
  }, [userStatus]);
  

  useEffect(() => {
    if (inferencingInProgress) {
      dispatch(setWebcamModalOpen(true));
      initCamera();
      runWebcamInferencing(); 
    } else {
      // disable webcam
      webcamStream?.getTracks().forEach(function(track) {
        track.stop();
      });
      setWebcamStream(undefined);
    }
    
  },[inferencingInProgress])

  const runWebcamInferencing = async () => {
    if (inferencingInProgressRef.current) {
      //await new Promise(resolve => setTimeout(resolve, 1000));
      clearRects();
      await captureAndInference(userStatusRef.current, currentSlideNumberRef.current, userRef.current);
    }
    console.log('new loop', inferencingInProgressRef.current)
    if (inferencingInProgressRef.current) setTimeout(runWebcamInferencing, 500);
  }


  const initCamera = async () => {
      try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment" },
      });

      setWebcamStream(stream);

      console.log('webcamStream', webcamStream, webcamElement.current)
      if (webcamElement.current) {
        var webcam = webcamElement.current
        webcam.srcObject = stream;
        
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
    } catch{
      console.log('permission error catched')
    }
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

  const capture = (): HTMLCanvasElement | undefined => {
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
      //return context;
      return canvas;
    }
  return undefined;
  }

  const captureAndInference = async(userStatusRef: any, currentSlideNumberRef: number, userRef: UserData | undefined) => {
    const canvas = capture();
    if (canvas !== undefined) {
      
      // const preprocessedYoloData = preprocess(ctx);
      var image = new Image();
      image.height = canvas.height;
      image.width = canvas.width;
      image.src = canvas.toDataURL();
      await new Promise(r => {
        image.onload = r
      })
    
      var [inferenceYoloFaceResult, inferenceYoloFaceTime] = await inferenceYoloV8FaceModel(image);
      console.log('yolov8Face result', inferenceYoloFaceResult)
      //renderBoxesFace(screenshotElement.current as HTMLCanvasElement, inferenceYoloFaceResult);

      //var [inferenceYoloResult, inferenceYoloTime] = await inferenceTinyYoloModel(preprocessedYoloData);
      // var [inferenceYoloResult, inferenceYoloTime] = await inferenceYoloV8Model(image);
      // console.log('yolov8 result', inferenceYoloResult)

      
      // //clearCanvas();

      // var person = inferenceYoloResult.filter(function (item: any) {
      //   return (item.label === 0) // filter for label id 0 === person
      // })

      var person = inferenceYoloFaceResult;

      if(person?.length) {
        var [inferenceEmotionResult,inferenceBodyTime] = await inferenceEmotionModel(image, person.bounding);
        let res: { class: string; prob: number; }[] = [];
        let highestValue: number = 0;
        let highestIndex: number = 0;
        inferenceEmotionResult.output.data.forEach((item: number, index: number) => {
          console.log({'class': idx_to_class[index], 'prob': item })
          if (item > highestValue){
            highestValue = item; 
            highestIndex = index;
          } 
      })
      
      // add emotion result to person
      person[0].label = `Person | ${idx_to_class[highestIndex]}`;
      console.log('emotion res', res, 'highestClass', idx_to_class[highestIndex]);

      renderBoxes(screenshotElement.current as HTMLCanvasElement, person);
      }

      // if (person?.length) {
      //   console.log('result present',userRef?.statusLog.hasOwnProperty(currentSlideNumberRef)===false,  userRef && (userStatusRef !== 'present' || (currentSlideNumberRef && userRef?.statusLog && userRef?.statusLog.hasOwnProperty(currentSlideNumberRef)===false)))
      //   console.log('setting to present; previous status: ', userStatusRef, currentSlideNumberRef, userRef?.statusLog && (userRef?.statusLog as any)[currentSlideNumberRef])
      //   if (sessionId !== undefined && userRef && (userStatusRef !== 'present' || (currentSlideNumberRef && userRef?.statusLog && userRef?.statusLog.hasOwnProperty(currentSlideNumberRef)===false))) {     
      //     let result = await setUserStatus({roomId:sessionId, user: userRef ,status:'present', currentSlide: currentSlideNumberRef})
      //     console.log('firebase called present', result);
      //   }
      // } else {
      //   console.log('result notPresent ', userRef && (userStatusRef !== 'notPresent' || (currentSlideNumberRef && userRef?.statusLog && (userRef.statusLog as any)[currentSlideNumberRef])))
      //   console.log('setting to notPresent; previous status: ', userStatusRef, currentSlideNumberRef, userRef?.statusLog && (userRef?.statusLog as any)[currentSlideNumberRef] )
      //   if (sessionId !== undefined && userRef && (userStatusRef !== 'notPresent' || (currentSlideNumberRef && userRef?.statusLog && (userRef.statusLog as any)[currentSlideNumberRef]))) {
      //     const result = await setUserStatus({roomId:sessionId, user: userRef ,status:'notPresent', currentSlide: currentSlideNumberRef})
      //   }
      // }
    }
  }
  
  const clearCanvas = () => {
    const canvas = document.getElementById("screenshot") as HTMLCanvasElement;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
  const clearRects = () => {
    const webcamContainerElement = document.getElementById("webcam-container") as HTMLElement;
    while (webcamContainerElement.childNodes.length > 2) {
      webcamContainerElement.removeChild(webcamContainerElement.childNodes[2]);
    }
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


  return (
    <>
      <Modal
        title={
          <div style={{textAlign:'center'}}>
          <div style={{marginRight: 10, color: 'grey', fontSize: 30, textAlign: 'center'}}>
            &#128247; &#128522;&#128076;
          </div>
            Please make sure to be in view of your webcam
          </div>}
        style={{ top: '10' }}
        width={695}
        open={webcamModalOpen}
        onOk={() => dispatch(setWebcamModalOpen(false))}
        onCancel={() => dispatch(setWebcamModalOpen(false))}
        footer={[
          <Button 
            key="Stop Detection" 
            type="primary" 
            danger={inferencingInProgress} 
            icon={inferencingInProgress ? <CloseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => dispatch(setInferencingInProgress(!inferencingInProgress))}
          >
            {inferencingInProgress ? 'Stop' : 'Start'} Detection
          </Button>,
          <Button 
            key="back" 
            onClick={() => dispatch(setWebcamModalOpen(false))}
            icon={<EyeInvisibleOutlined />}
            >
          Hide Window
          </Button>,
        ]}
      >
        <div id="webcam-container" className={styles.webcamContainer}>
          <video playsInline muted ref={webcamElement} width={640} height={640}></video>
          <canvas id="screenshot" className={styles.screenshot} ref={screenshotElement} width={640} height={640} />
          </div>
        <div>
        
        </div>
      </Modal>
    </>
  );
};

export default WebcamModal;