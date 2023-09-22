import React, { useEffect, useState } from 'react';
import { ConfigProvider, Collapse, Row, Typography, Col, Card } from 'antd';
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  useFetchUserByIdQuery, useFetchUserListByRoomIdQuery,
} from '../app/userMgmtFirestore';
import {
  UserOutlined,
  CloseSquareOutlined,
  CheckSquareOutlined

} from '@ant-design/icons';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { selectUserStatus, setOnBoardingInProgress } from '../app/appStateSlice';
import styles from '../styles/Home.module.css';

const { Text } = Typography;



export default function UserInfo () {
  const user = useAppSelector((state) => state.appState.user);
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const presenterMode = useAppSelector((state) => state.appState.presenterMode);
  const [userIdParam, setUserIdParam] = useState("") // initialize with skipToken to skip at first
  const [presenterName, setPresenterName] = useState("");
  const { data } = useFetchUserListByRoomIdQuery(sessionId ?? skipToken);
  const [activeKey, setActiveKey] = useState(1);
  const [openCollapsible, setOpenCollapsible] = useState(true);
  const dispatch = useAppDispatch()

  function handleClick(key: React.SetStateAction<number>) {
    console.log('handle click', key)
    setActiveKey(key);
  }

  // get user from url param if it exists
  useEffect(function onFirstMount() {
    const queryString = window.location.search;
    if(queryString) {
      const urlParams = new URLSearchParams(queryString);
      const userIdValue = urlParams.get('userId');
      if(userIdValue) {
        console.log('userId detected', userIdValue)
        setUserIdParam(userIdValue);
        dispatch(setOnBoardingInProgress(false));
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

  useEffect(() => {
    if (user?.faceDetected === false || openCollapsible) {
      setActiveKey(1)
      setTimeout(() => {
        setOpenCollapsible(false)
      }, 
      5000);
    } else {
      setActiveKey(-1)
    }
  }, [openCollapsible, user?.faceDetected]);

  
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
      activeKey={activeKey}
      onChange={()=>handleClick}
      items={[{ onClick:()=>setOpenCollapsible(!openCollapsible), key: '1', label: <><UserOutlined style={{marginRight: 5}} /><>{user? user.name : 'Anonymous User'}</></>, children: 
    (presenterMode === false) &&
    <>
    
    <Row>
          <Col span={24} style={{textAlign: 'center'}}>
          {user?.faceDetected ? 
            <CheckSquareOutlined style={{color:'green'}}/> 
            :
            <CloseSquareOutlined style={{color:'red'}}/>
          }
          &nbsp;
          {user?.faceDetected ? 
            <span style={{color:'green' , fontWeight: 800}}>User Detected</span>
          :
            <span style={{color:'red', fontWeight: 800}}>No User Detected</span>
          }
          </Col>
          
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
                <>&#128105;&#8205;&#127979;</>
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

