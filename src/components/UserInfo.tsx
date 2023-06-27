import React, { useEffect, useState } from 'react';
import { Steps, ConfigProvider, Divider, Menu, Button, Row, Typography, Col, Card } from 'antd';
import { useAppSelector, useAppDispatch } from '../app/hooks'
import {
  useFetchUserByIdQuery, useFetchUserListByRoomIdQuery,
} from '../app/userMgmtFirestore';
import {
  UserOutlined,
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
    <Row justify="center">
      <Button block size='large' ghost style={{margin: 10}}>
        <UserOutlined rev={undefined} />
        <Text ellipsis style={{color:'white'}}>
          { user? user.name : '' }
        </Text>
      </Button>
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
