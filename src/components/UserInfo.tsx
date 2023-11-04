import React, { useEffect, useState } from 'react';
import { ConfigProvider, Collapse, Row, Typography, Col, Card } from 'antd';
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  useFetchUserByIdQuery} from '../app/userMgmtFirestore';
import {
  UserOutlined,
  CloseSquareOutlined,
  CheckSquareOutlined

} from '@ant-design/icons';
import { setOnBoardingInProgress, setUser } from '../app/appStateSlice';
import styles from '../styles/Home.module.css';
import { useFetchPresentationStatsByIdQuery } from '../app/presentationStatsFirestore';

const { Text } = Typography;



export default function UserInfo (props: {sessionId: string, userId: string}) {
  const user = useAppSelector((state) => state.appState.user);
  const presenterMode = useAppSelector((state) => state.appState.presenterMode);
  const userTemp = useFetchUserByIdQuery({roomId: props.sessionId, userId: props.userId})
  const [activeKey, setActiveKey] = useState(1);
  const [openCollapsible, setOpenCollapsible] = useState(true);
  const { data } = useFetchPresentationStatsByIdQuery(props.sessionId);

  const dispatch = useAppDispatch()


  function handleClick(key: React.SetStateAction<number>) {
    console.log('handle click', key)
    setActiveKey(key);
  }

  useEffect(function onFirstMount() {
    if(userTemp?.data?.id)  {
        dispatch(setUser(userTemp.data));
        dispatch(setOnBoardingInProgress(false));
      }
    }, [userTemp.data]);

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
      items={[{ onClick:()=>setOpenCollapsible(true), key: '1', label: <><UserOutlined style={{marginRight: 5}} /><>{user? user.name : 'Anonymous User'}</></>, children: 
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
            {data?.presenterName}
          </Text>
          </Col>
        </Row>
      </Card>
      
    </Row>
      
    
    </>
  );
}

