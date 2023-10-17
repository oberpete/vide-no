import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Tooltip, Progress } from 'antd';
import { useFetchUserListByRoomIdQuery } from '../app/userMgmtFirestore';
import { useAppSelector } from '../app/hooks';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { UserOutlined, EyeOutlined } from '@ant-design/icons';
import { useSavePresentationSummaryMutation } from '../app/presentationStatsFirestore';
const { Text } = Typography;


export default function ParticipantsGrid (props: {currentSlideNumber: number, recordPresentationStats: boolean | undefined, presentationFinished: boolean|undefined}) {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const recordingInitiator = useAppSelector((state) => state.appState.recordInitiator);

  const { data } = useFetchUserListByRoomIdQuery(sessionId ?? skipToken);
  const [engagementData, setEngagementData] = useState({confusion: 0, engagement: 0, detectedUsers: 0, listeners: 0, timestamp: 0, slideNumber: 1});
  const engagementDataRef = useRef<any>(engagementData)

  const [engagementDataLog, setEngagementDataLog] = useState<{confusion: number, engagement: number, detectedUsers: number, listeners: number, timestamp: number, slideNumber: number}[]>([]);
  const recordingInProgressRef = useRef<boolean>(false)
  const [savePresentationSummary] = useSavePresentationSummaryMutation();


  const confusionHighColorScheme = { '100%': '#b2333c', '65%': '#ed6147', '40%': '#96e571','0%': '#39a85e' };
  const confusionLowColorScheme = { '100%': '#ed6147', '60%': '#96e571', '40%': '#96e571','0%': '#39a85e' };

  const engagementLowColorScheme = { '0%': '#b2333c','15%': '#ed6147', '55%': '#96e571', '100%': '#96e571' };
  const engagementHighColorScheme = { '0%': '#b2333c', '15%': '#ed6147', '55%': '#96e571','100%': '#39a85e' };

  const slideNumberRef = useRef<number>(props.currentSlideNumber)

  useEffect(() => {
    let engagement = 0;
    let confusion = 0;
    let detectedUsers = 0;
    let listeners = 0;

    let currentSlideNumber = slideNumberRef.current;
    data?.forEach((user) => {
      type ObjectKey = keyof typeof user.feedbackLogGeneral;
      //check if override exists for this slide
      let engagementOverride = user.feedbackLogGeneral && user.feedbackLogGeneral.hasOwnProperty(props.currentSlideNumber) 
      ? user.feedbackLogGeneral[props.currentSlideNumber as ObjectKey] 
      : undefined;
      engagement += engagementOverride ?? (user.engagement ? user.engagement : 0);

      //check if override exists for this slide
      let confusionOverride = user.feedbackLogConfusion && user.feedbackLogConfusion.hasOwnProperty(props.currentSlideNumber) 
      ? user.feedbackLogConfusion[props.currentSlideNumber as ObjectKey] 
      : undefined;

      confusion += confusionOverride ?? (user.confusion ? user.confusion : 0);
      detectedUsers += user.faceDetected ? 1 : 0;
      listeners += user.presenter ? 0 : 1;
    })
    console.log('currentSlideNumber', props.currentSlideNumber)
    
    setEngagementData({
      'engagement': engagement / (listeners*4) * 100 , 
      'confusion': confusion / (listeners*4) * 100, 
      'detectedUsers': detectedUsers,
      'listeners': listeners,
      'timestamp': new Date().getTime(),
      'slideNumber': currentSlideNumber});
      console.log('engagement data', engagement, engagementData)

      if (props.currentSlideNumber !== slideNumberRef.current) {
        var temp = engagementDataLog;        
        temp.push(engagementDataRef.current);

        setEngagementDataLog(temp)
        slideNumberRef.current = props.currentSlideNumber
      }
  }, [data, props.currentSlideNumber])

  useEffect(() => {
    if(props.recordPresentationStats && recordingInitiator) {
      setEngagementDataLog([]);
      recordingInProgressRef.current = true;
    } 
    if (props.presentationFinished && recordingInProgressRef.current === true && recordingInitiator){
      console.log('savingsummary', engagementDataLog)
      savePresentationSummary({roomId: sessionId, summary: engagementDataLog.filter(x=>{return x.slideNumber !== 0})})
    }
  }, [props.recordPresentationStats, recordingInProgressRef])


useEffect(() => {
  engagementDataRef.current = engagementData
}, [engagementData])
  return (
    <div style={{padding: 10 }}>
      <Row>
        <Text type="secondary"  style={{color: 'white', fontSize:20, fontWeight:800, marginBottom: 10}}>Participants</Text>
      </Row>
      <Row gutter={[24, 10]}>
    <Col span={24}>
    <Card bodyStyle={{padding:'5px', textAlign:'center'}} size="small" title="Participants" bordered={false}>
        <Row justify="center">
          <Col span={8} style={{fontSize:'20px', fontWeight: 600}}>
            <Tooltip title="Number of Participants">
              <span>
                <UserOutlined style={{marginRight: '2px'}}/>
                {engagementData.listeners}
              </span>
            </Tooltip>
          </Col>
          <Col span={8} style={{fontSize:'20px', fontWeight: 600}}>
            <Tooltip title="Detected in Webcam Video"> 
              <span>
                (<EyeOutlined style={{marginRight: '2px'}}/>
                {engagementData.listeners})
              </span>
            </Tooltip>
          </Col>
        </Row>
      </Card>
    </Col>
    <Col span={24}>
    <Card bodyStyle={{padding:'5px', textAlign:'center'}} bordered={false}>
    <span style={{ fontSize: 30 }}>&#129299;</span>
      <Text type="secondary"  style={{color:'black', fontSize:15, fontWeight:600, marginLeft: 10}}>Engagement</Text>
      <Progress strokeColor={engagementData.engagement > 80 ? engagementHighColorScheme : engagementLowColorScheme} size={[150, 20]} percent={engagementData.engagement} showInfo={false}/>
    </Card>
    </Col>
    <Col span={24}>
    <Card bodyStyle={{padding:'5px', textAlign:'center'}} bordered={false}>
      <span style={{ fontSize: 30 }}>&#129300;</span>
      <Text type="secondary"  style={{color:'black', fontSize:15, fontWeight:600, marginLeft: 10}}>Confusion</Text>
      
      <Progress strokeColor={engagementData.confusion > 80 ? confusionHighColorScheme : confusionLowColorScheme} size={[150, 20]} percent={engagementData.confusion} showInfo={false}/>
    </Card>
    </Col>
 
  </Row>
    </div>
  );
}
