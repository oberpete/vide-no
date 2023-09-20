import React, { useEffect, useState } from 'react';
import { Steps, ConfigProvider, Collapse, Divider, Menu, Button, Row, Typography, Col, Card } from 'antd';
import { useAppSelector, useAppDispatch } from '../app/hooks'
import {
  useFetchUserByIdQuery, useFetchUserListByRoomIdQuery,
} from '../app/userMgmtFirestore';
import {
  UserOutlined,
  CloseSquareOutlined,
  CheckSquareOutlined

} from '@ant-design/icons';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { selectUserStatus } from '../app/appStateSlice';
import styles from '../styles/Home.module.css';

const { Text } = Typography;



export default function UserInfo () {
  const user = useAppSelector((state) => state.appState.user);
  const userStatus = useAppSelector(selectUserStatus);
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const [userIdParam, setUserIdParam] = useState("") // initialize with skipToken to skip at first
  const [presenterName, setPresenterName] = useState("");
  const result = useFetchUserByIdQuery((sessionId !== undefined && userIdParam !== "") ? {roomId:sessionId, userId:userIdParam} : skipToken)
  const { data } = useFetchUserListByRoomIdQuery(sessionId ?? skipToken);

  // get user from url param if it exists
  useEffect(function onFirstMount() {
    const queryString = window.location.search;
    if(queryString) {
      const urlParams = new URLSearchParams(queryString);
      const userIdValue = urlParams.get('userId');
      if(userIdValue) {
        console.log('userId detected', userIdValue)
        setUserIdParam(userIdValue);
      }
    }
  }, []);

  useEffect(() => {
    let presenters = data?.filter((item)=>{
      return item.presenter === true
    })
    console.log('presenters', data, presenters)
    if (presenters?.length) {
      setPresenterName(presenters[0].name);
    }
    
  }, [data]);

  
  return (
    <>
    <Row>
      
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            colorTextHeading: '#fff',
            colorBgContainer: '#e6f4ff',
            colorText: '#141e30'
          },
        },
      }}
    >     
    <Collapse
      style={{margin: 10, width: '100%'}}
      size="small"
      items={[{ key: '1', label: <><UserOutlined style={{marginRight: 5}} /><>{user? user.name : 'Anonymous User'}</></>, children: 
    <>
    <Row>
        <Col span={18} style={{textAlign: 'right', paddingRight: 10}}>Detected</Col>
        <Col span={6} style={{fontWeight: 800}}>{user?.faceDetected ? <CheckSquareOutlined /> : <CloseSquareOutlined />}</Col>
      </Row>
      <Row>
        <Col span={18} style={{textAlign: 'right', paddingRight: 10}}>Confusion</Col>
        <Col span={6} style={{fontWeight: 800}}>{user?.confusion}</Col>
      </Row>
      <Row>
        <Col span={18} style={{textAlign: 'right', paddingRight: 10}}>Engagement</Col>
        <Col span={6} style={{fontWeight: 800}}>{user?.engagement}</Col>
      </Row>
    </> }]}
    />
    </ConfigProvider>   
    
      
    </Row>
    
    <Row>
      <Card className={styles.participantCard} bodyStyle={{ padding: 2 }} style={{margin:10}}>  
        <Row justify={'center'} align={'middle'}>
          <Col>
            <span role="img"  style={{ fontSize: 40, marginRight:15,  }}>
                <>&#128104;&#8205;&#127979;</>
            </span>
          </Col>
          <Col>
          <Text style={{color: 'white', fontSize:15, fontWeight:300, marginTop:20}}>
            {presenterName}
          </Text>
          </Col>
        </Row>
      </Card>
      
    </Row>
      
    
    </>
  );
}
