import React from 'react';

import styles from './styles/Home.module.css';
import { Layout, theme, Row } from 'antd';
import { useEffect, useState } from 'react';
import { Typography } from 'antd';
import PresentationStepper from './components/PresentationStepper';
import ParticipantsGrid from './components/ParticipantsGrid';
import UserSettings from './components/UserSettings';
import UserInfo from './components/UserInfo';
import { setSessionId } from './app/appStateSlice';
import FloatingControls from './components/FloatingControls';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { setPresenterMode } from './app/appStateSlice';
import JoinSession from './components/JoinSession';
import PresenterView from './pages/presenterView';
import ListenerView from './pages/listenerView';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;



function App() {
  const [siderBroken, setSiderBroken] = useState(false);
  const [participantsCollapsed, setParticipantsCollapsed] = useState(false);
  const dispatch = useAppDispatch()
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const onboardingInProgress = useAppSelector((state) => state.appState.onboardingInProgress);
  const presenterMode = useAppSelector((state) => state.appState.presenterMode);

  // get user from url param if it exists
  useEffect(function onFirstMount() {
    const queryString = window.location.search;
    if(queryString) {
      const urlParams = new URLSearchParams(queryString);
      const presenterMode = urlParams.get('presenterMode');
      const sessionId = urlParams.get('sessionId');
      if(presenterMode) {
        console.log('presenterMode:', presenterMode, '| sessionId:', sessionId)
        dispatch(setPresenterMode(true));
      }
      if(sessionId) {
        dispatch(setSessionId(sessionId));
      }
    }
  }, []);
  
  return (
    <>
    {/* <TestModel /> */}
    <Layout style={{height: "100%"}}>
      {sessionId &&
        <Sider 
          className={styles.gradientBackground1} 
          breakpoint={"lg"} 
          onBreakpoint={
            (broken)=>setSiderBroken(broken ? true : false)
          } 
          trigger={null} 
        >
          <UserInfo />
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
          <ParticipantsGrid />
        </Sider>
      }
    </Layout>
    </>
  )
}

export default App;
