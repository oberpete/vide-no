import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Statistic, Progress, Space } from 'antd';
import styles from '../styles/Home.module.css';
import { useFetchUserListByRoomIdQuery } from '../app/userMgmtFirestore';
import { useAppSelector } from '../app/hooks';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { UserOutlined } from '@ant-design/icons';
const { Text } = Typography;


export default function ParticipantsGrid () {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const { data } = useFetchUserListByRoomIdQuery(sessionId ?? skipToken);
  const [engagementData, setEngagementData] = useState({confusion: 0, engagement: 0, detectedUsers: 0});

  const confusionColorScheme = { '100%': '#b2333c', '75%': '#ed6147', '25%': '#96e571','0%': '#39a85e' };
  const engagementColorScheme = { '0%': '#b2333c', '25%': '#ed6147', '75%': '#96e571','100%': '#39a85e' };
  
  function getStateEmoji(status: boolean) {
    switch (status) {
      case true:
        return '0x1F917';
      case false:
        return '0x1F645';
      default: 
        return '0x1F573'
    }
  }

  useEffect(() => {
    let engagement = 0;
    let confusion = 0;
    let detectedUsers = 0;
    let numberOfParticipants = data ? data.length : 0;

    data?.forEach((user) => {
      engagement += user.engagement ? user.engagement : 0;
      confusion += user.confusion ? user.confusion : 0;
      detectedUsers += user.faceDetected ? 1 : 0;
    })

    setEngagementData({
      'engagement': engagement / (numberOfParticipants*4) * 100 , 
      'confusion': confusion / (numberOfParticipants*4) * 100, 
      'detectedUsers': detectedUsers});
      console.log('engagement data', engagementData)
  }, [data])

  return (
    <div style={{padding: 10 }}>
      <Row>
        <Text type="secondary"  style={{color: 'white', fontSize:20, fontWeight:800, marginBottom: 10}}>Participants</Text>
      </Row>
      <Row gutter={[24, 10]}>
    <Col span={24}>
    <Card bodyStyle={{padding:'5px', textAlign:'center'}} size="small" title="Participants" bordered={false}>
        <Statistic
          value={data?.length ? data?.length-1 : 0}
          precision={0}
          valueStyle={{ color: '#3f8600' }}
          prefix={<UserOutlined />}
        />
      </Card>
    </Col>
    <Col span={24}>
    <Card bodyStyle={{padding:'5px', textAlign:'center'}} bordered={false}>
    <span style={{ fontSize: 30 }}>&#129299;</span>
      <Text type="secondary"  style={{color:'black', fontSize:15, fontWeight:600, marginLeft: 10}}>Engagement</Text>
      <Progress strokeColor={engagementColorScheme} size={[150, 20]} percent={engagementData.engagement} showInfo={false}/>
    </Card>
    </Col>
    <Col span={24}>
    <Card bodyStyle={{padding:'5px', textAlign:'center'}} bordered={false}>
      <span style={{ fontSize: 30 }}>&#129300;</span>
      <Text type="secondary"  style={{color:'black', fontSize:15, fontWeight:600, marginLeft: 10}}>Confusion</Text>
      
      <Progress strokeColor={confusionColorScheme} size={[150, 20]} percent={engagementData.confusion} showInfo={false}/>
    </Card>
    </Col>
 
  </Row>
      {/* <Row gutter={[10,10]}>
        {data?.map(({ name, id, faceDetected, presenter, engagement, confusion }) => (
        <Col xl={12} md={24} key={id}>
        <Card className={styles.participantCard} bodyStyle={{ padding: 2 }}>  
          <div>
          <Row justify="center">
            <span role="img"  style={{ fontSize: 40 }}>
              { presenter ?
              	<>&#128105;&#8205;&#127979;</>
              :
              String.fromCodePoint(Number(getStateEmoji(faceDetected)))
              }
            </span>
          </Row>
          <Row justify="center">
            <Text style={{color:'white', fontSize: 12}}strong ellipsis>{name}</Text> 
          </Row>
          </div>
        </Card>
        </Col>
        ))}
      </Row> */}
    </div>
  );
}
