import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';
import { Button, Modal, Radio, RadioChangeEvent } from 'antd';
import { CloseCircleOutlined, EyeInvisibleOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { inferenceYoloV8FaceModel, inferenceResNetTest } from '../utils/predict';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectUser, setInferencingInProgress, setWebcamModalOpen } from '../app/appStateSlice';
import { useSetUserStatusMutation } from '../app/userMgmtFirestore';
import {
  useFetchPresentationStatsByIdQuery,
} from '../app/presentationStatsFirestore';
import { UserData } from '../types';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { renderBoxes } from '../utils/imageHelper';


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
  const modalInitiationPhaseRef = useRef<boolean>(true);

  const user = useAppSelector(selectUser);
  const userRef = useRef(user);
  const userStatus = useAppSelector(state => state.appState.user?.name);
  const userStatusRef = useRef(userStatus);
  const [inferencingSpeed, setInferencingSpeed] = useState<number>(50);
    
  const { data } = useFetchPresentationStatsByIdQuery(sessionId ?? skipToken);
  const currentSlideNumberRef = useRef(1);

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
      await captureAndInference(currentSlideNumberRef.current, userRef.current);
    }
    console.log('inferencingSpeed', inferencingSpeed)
    if (inferencingInProgressRef.current) setTimeout(runWebcamInferencing, inferencingSpeed);
  }


  const initCamera = async () => {
      try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment" },
      });

      setWebcamStream(stream);

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

  const captureAndInference = async(currentSlideNumberRef: number, userRef: UserData | undefined) => {
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
      // console.log('yolov8Face result', inferenceYoloFaceResult)

      var person = inferenceYoloFaceResult;
      if(person?.length) {
        if (modalInitiationPhaseRef.current) {
          setTimeout(() => {
            dispatch(setWebcamModalOpen(false));
            modalInitiationPhaseRef.current = false;
          }, 4000);
        }
        var [resNet, resNetTime] = await inferenceResNetTest(image, person.bounding);
        renderBoxes(screenshotElement.current as HTMLCanvasElement, person);
        if(resNet.confusion && resNet.engagement) {
          let maxConfusionIndex = resNet.confusion.data.indexOf(Math.max(...resNet.confusion.data))+1;
          let maxEngagementIndex = resNet.engagement.data.indexOf(Math.max(...resNet.engagement.data))+1;

          if (sessionId !== undefined && userRef && (userRef.engagement !== maxEngagementIndex || userRef.confusion !== maxConfusionIndex)) {
            let result = await setUserStatus({roomId:sessionId, user: userRef ,status:'present', currentSlide: currentSlideNumberRef, confusion: maxConfusionIndex, engagement: maxEngagementIndex, faceDetected: true})
          }
        }
      } else {
        if (sessionId !== undefined && userRef && (userRef.faceDetected !== false)) {
          let result = await setUserStatus({roomId:sessionId, user: userRef ,status:'present', currentSlide: currentSlideNumberRef, confusion: 0, engagement: 0, faceDetected: false})
        }
      }

    }
  }
  
  const clearRects = () => {
    const webcamContainerElement = document.getElementById("webcam-container") as HTMLElement;
    while (webcamContainerElement.childNodes.length > 2) {
      webcamContainerElement.removeChild(webcamContainerElement.childNodes[2]);
    }
  }

  return (
    <>
      <Modal
        title={
          <div style={{textAlign:'center'}}>
            Please make sure you are in view of your webcam:
          </div>}
        style={{ top: '0' }}
        width={695}
        open={webcamModalOpen}
        onOk={() => dispatch(setWebcamModalOpen(false))}
        onCancel={() => dispatch(setWebcamModalOpen(false))}
        footer={[
          <Radio.Group value={inferencingSpeed} style={{marginRight: '10px'}} onChange={({ target: { value } }: RadioChangeEvent)=>{setInferencingSpeed(value)} } disabled={inferencingInProgress}>
            <Radio.Button value={50}>High</Radio.Button>
            <Radio.Button value={500}>Medium</Radio.Button>
            <Radio.Button value={1000}>Low</Radio.Button>
          </Radio.Group>,
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