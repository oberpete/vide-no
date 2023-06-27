import React, { useEffect, useState } from 'react';
import { Input, Button, Row, Typography, Card, Space, Grid } from 'antd';
import { useAppSelector, useAppDispatch } from '../app/hooks'
import {
  useFetchUserByIdQuery,
} from '../app/userMgmtFirestore';
import {
    FieldNumberOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { selectUserStatus } from '../app/appStateSlice';
import { setSessionId } from '../app/appStateSlice';
const { Text } = Typography;
const { useBreakpoint } = Grid;


export default function JoinSession () {
  const [sessionIdValue, setSessionIdValue] = useState<string|undefined>('12345678');
  const dispatch = useAppDispatch();
  const screens = useBreakpoint();
  const handleChange = (e: { target: { value: React.SetStateAction<string|undefined>; }; }) => setSessionIdValue(e.target.value);

  function setSessionParam() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    sessionIdValue && urlParams.append("sessionId", sessionIdValue);
    window.history.replaceState(null, "", `?${urlParams}`);
    dispatch(setSessionId(sessionIdValue));
  }
  const style = (): React.CSSProperties => {
    switch (screens.sm) {
      case false:
        return { width: "100%", margin: 0, textAlign: "center", padding: 0 };
      case true:
        return { width: "80%", margin: 30, textAlign: "center", padding: 20 };
      default:
        return { width: "100%", margin: 0, textAlign: "center", padding: 0 };
    }
  }
  
  return (
    <Row justify="center">
      <Card title="Join a Session" style={style()}>
        <Row justify={"center"} style={{ marginBottom: 20 }}>
          <Text>Please provide a valid session ID to join a presentation session:</Text>
        </Row>
      
        <Space.Compact size="large" style={{width: "100%", maxWidth: "500px"}} direction={screens.sm ? 'horizontal' : 'vertical'}>
          <Input onChange={handleChange} value={sessionIdValue} size="large" placeholder="12345678" prefix={<FieldNumberOutlined rev={undefined} style={{marginRight: 5}} />} />
          <Button onClick={setSessionParam} type="primary" icon={<ArrowRightOutlined rev={undefined} />}>Join Session</Button>
        </Space.Compact>
      </Card>
    </Row>
  );
}
