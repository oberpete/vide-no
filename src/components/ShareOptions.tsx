import React from 'react';
import { Button, Row, notification } from 'antd';
import { UsergroupAddOutlined, PlayCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useSetRecordingInProgressMutation } from '../app/presentationStatsFirestore';
import { setRecordInitiator } from '../app/appStateSlice';


const ShareOptions: React.FC<{sessionId: string|undefined, recordingInProgress: boolean}> = ( props ) => {
  const recordEnabled = useAppSelector((state) => state.appState.recordEnabled);
  const [setRecordingInProgress] = useSetRecordingInProgressMutation();
  const dispatch = useAppDispatch()


  const [api, contextHolder] = notification.useNotification();

  function copyInvitation() {
    console.log('sessionId', props.sessionId)
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    urlParams.delete("presenterMode");
    urlParams.delete("userId");
    navigator.clipboard.writeText(window.location.origin+'?'+urlParams);
    openNotification();
  }

  function initiateRecording() {
    setRecordingInProgress({roomId:props.sessionId, recordingInProgress:!props.recordingInProgress});
    dispatch(setRecordInitiator(true));
  }

  const openNotification = () => {
    api.open({
      message: 'Invite Users',
      description:
        'The invitation link has been saved to your clipboard.',
      duration: 3,
    });
  };

  return (
    <>
      {contextHolder}
      <Row justify={"end"} style={{borderBottom: '1px solid #ccc', marginBottom: '10px'}}>
        <Button 
            type="link"
            onClick={()=>initiateRecording()}
            icon={props.recordingInProgress ? <LoadingOutlined /> : <PlayCircleOutlined />}
            disabled={!recordEnabled}
          >
          Record{props.recordingInProgress && 'ing'}&nbsp;Presentation Stats
        </Button>
        <Button 
          type="link"
          onClick={()=>copyInvitation()}
          icon={<UsergroupAddOutlined />}
        >
          Copy Invitation Link
        </Button>
      </Row>  
    </>
  );
};

export default ShareOptions;