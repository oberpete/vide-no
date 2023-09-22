import React from 'react';
import { Steps, ConfigProvider, Typography, Row } from 'antd';
import { useAppSelector } from '../app/hooks'
import {
  useFetchPresentationStatsByIdQuery,
} from '../app/presentationStatsFirestore';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';

const { Text } = Typography;

export default function PresentationStepper (props: {siderBroken: boolean}) {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const numberOfSlides = useAppSelector((state) => state.appState.numberOfSlides);

  const { data } = useFetchPresentationStatsByIdQuery(sessionId ?? skipToken);
  const pageNum = data?.currentSlideNumber ? data?.currentSlideNumber : 1;
  return (
    <ConfigProvider
    theme={{
      token: {
        colorText: '#fff',
        colorTextDisabled: '#fff',
        colorTextLabel: 'rgba(355, 355, 355, 0.45)',
        colorTextDescription: 'rgba(355, 355, 355, 0.45)',
        colorSplit: '#fff'

      },
    }}
    >
      {/* <Divider style={{padding: 5, color: 'lightslategray'}}>Overview</Divider> */}
      <Row>
        { props.siderBroken ?
        <Text type="secondary"  style={{color: 'white', fontSize:10, fontWeight:800, marginLeft:15, marginTop:20}}>
          Pres.
        </Text>
        :
        <Text type="secondary"  style={{color: 'white', fontSize:15, fontWeight:800, marginLeft:15, marginTop:20}}>
          Presentation
        </Text>
        }
      </Row>
      <Steps
        size="small"
        style={{marginLeft: 15, marginTop: 10 }}
        direction="vertical"
        current={pageNum - 1}
        items={
          props.siderBroken ? 
          Array(numberOfSlides).fill({ title: '' })
          : 
          Array(numberOfSlides).fill({ title: 'Slide' })}
      />
    </ConfigProvider>
  );
}
