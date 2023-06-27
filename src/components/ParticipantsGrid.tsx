import React, { useEffect } from 'react';
import { Row, Col, Card, Typography } from 'antd';
import styles from '../styles/Home.module.css';
import { useFetchUserListByRoomIdQuery } from '../app/userMgmtFirestore';
import { useAppSelector } from '../app/hooks';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
const { Text } = Typography;


export default function ParticipantsGrid () {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const { data } = useFetchUserListByRoomIdQuery(sessionId ?? skipToken);

  function getStateEmoji(status: string) {
    switch (status) {
      case 'present':
        return '0x1F917';
      case 'notPresent':
        return '0x1F645';
      default: 
        return '0x1F573'
    }
  }

  return (
    <div style={{padding: 10 }}>
      <Row>
        <Text type="secondary"  style={{color: 'white', fontSize:20, fontWeight:800, marginBottom: 10}}>Participants</Text>
      </Row>
      <Row gutter={[10,10]}>
        {data?.map(({ name, id, status, presenter }) => (
        <Col xl={12} md={24} key={id}>
        <Card className={styles.participantCard} bodyStyle={{ padding: 2 }}>  
          <div>
          <Row justify="center">
            <span role="img"  style={{ fontSize: 40 }}>
              { presenter ?
              	<>&#128104;&#8205;&#127979;</>
              :
              String.fromCodePoint(Number(getStateEmoji(status)))
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
      </Row>
    </div>
  );
}
