import React from 'react';

import styles from './styles/Home.module.css';
import { Layout, theme, Row } from 'antd';
import { useEffect, useState } from 'react';
import { Typography } from 'antd';
import PresentationStepper from './components/PresentationStepper';
import ParticipantsGrid from './components/ParticipantsGrid';
import UserSettings from './components/UserSettings';
import UserInfo from './components/UserInfo';
import { setSessionId, setRecordEnabled } from './app/appStateSlice';
import FloatingControls from './components/FloatingControls';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { setPresenterMode } from './app/appStateSlice';
import JoinSession from './components/JoinSession';
import PresenterView from './pages/presenterView';
import ListenerView from './pages/listenerView';
import { useFetchPresentationStatsByIdQuery } from './app/presentationStatsFirestore';
import { skipToken } from '@reduxjs/toolkit/dist/query';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;



function App() {
  const [siderBroken, setSiderBroken] = useState(false);
  const [userId, setUserId] = useState('');
  const [participantsCollapsed, setParticipantsCollapsed] = useState(false);
  const dispatch = useAppDispatch()
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const onboardingInProgress = useAppSelector((state) => state.appState.onboardingInProgress);
  const presenterMode = useAppSelector((state) => state.appState.presenterMode);
  const { data } = useFetchPresentationStatsByIdQuery(sessionId ?? skipToken);
  const currentSlideNumber = data?.currentSlideNumber ? data?.currentSlideNumber : 1;

  // get user from url param if it exists
  useEffect(function onFirstMount() {
    const queryString = window.location.search;
    if(queryString) {
      const urlParams = new URLSearchParams(queryString);
      const presenterMode = urlParams.get('presenterMode');
      const sessionId = urlParams.get('sessionId');
      const recordEnabled = urlParams.get('recordEnabled');
      const userId = urlParams.get('userId');
      if(presenterMode) {
        console.log('presenterMode:', presenterMode, '| sessionId:', sessionId)
        dispatch(setPresenterMode(true));
      }
      if(sessionId) {
        dispatch(setSessionId(sessionId));
      }
      if(recordEnabled) {
        dispatch(setRecordEnabled(true));
      }
      if(userId) {
        setUserId(userId);
      }
    }
  }, []);
  
  return (
    <>
    {/* <TestModel /> */}
    <Layout style={{height: "100%"}}>
      {sessionId && userId !== '' &&
        <Sider 
          className={styles.gradientBackground1} 
          breakpoint={"lg"} 
          onBreakpoint={
            (broken)=>setSiderBroken(broken ? true : false)
          } 
          trigger={null} 
        >
          <UserInfo sessionId={sessionId} userId={userId}/>
          <PresentationStepper siderBroken={siderBroken}/>
        </Sider>
      }
      <Layout>
        <Header className={styles.header} style={{ padding: 0, height: 20 }}>
          <Row justify="center" align="middle" style={{height: '100%'}}>
          <Text style={{
              fontSize: '10px',
              fontWeight: '400',
              color: '#141e30'
            }}>V I D E <span style={{fontWeight:800}}>N O</span></Text>
          </Row>
        </Header>
        <Content
          style={{
            margin: '0px 10px',
            padding: 10,
            minHeight: 280,
            background: 'none',
          }}
        >
          {sessionId ?
          <div className={styles.container}>
            <main className={styles.main}>

              {presenterMode ? 
                <PresenterView />
                :
                !onboardingInProgress &&
                <ListenerView />
              }
            </main>
            <UserSettings presenterMode={presenterMode}></UserSettings>
            {!presenterMode && <FloatingControls></FloatingControls> }
          </div>
        :
          <JoinSession />
        }
        </Content>
        
      </Layout>
      {presenterMode && 
        <Sider className={styles.gradientBackground2} breakpoint={"lg"} 
          onBreakpoint={(broken)=>setParticipantsCollapsed(broken ? true : false)}
          collapsible collapsed={participantsCollapsed} trigger={null}>
          <ParticipantsGrid currentSlideNumber={currentSlideNumber} recordPresentationStats={data?.recordingInProgress} presentationFinished={data?.presentationFinished}/>
        </Sider>
      }
    </Layout>
    </>
  )
}

export default App;
