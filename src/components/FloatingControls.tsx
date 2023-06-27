import React from 'react';
import { FloatButton } from 'antd';
import { CameraOutlined, SyncOutlined, CaretRightOutlined } from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setWebcamModalOpen } from '../app/appStateSlice';

const FloatingControls: React.FC = () => {
  const webcamModalOpen = useAppSelector((state) => state.appState.webcamModalOpen);
  const inferencingInProgress = useAppSelector((state) => state.appState.inferencingInProgress);
  const dispatch = useAppDispatch()

  function toggleWebcamOpen() {
    dispatch(setWebcamModalOpen(!webcamModalOpen));
  }

  return (
    <>
      <FloatButton 
        shape='square' 
        type="primary" 
        style={{ bottom: 30 }} 
        onClick={()=>toggleWebcamOpen()}
        icon={ <><CameraOutlined rev={undefined} /> {inferencingInProgress ? <SyncOutlined spin style={{ fontSize: 15 }} rev={undefined}/> : <CaretRightOutlined rev={undefined} /> }</>}
      />
    </>
  );
};

export default FloatingControls;