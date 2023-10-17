import React, { useEffect, useRef, useState } from 'react';
import { Row, Col, Card, Typography, Statistic } from 'antd';
import 'chart.js/auto'; 
import { useAppSelector } from '../app/hooks';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { useFetchUserListByRoomIdQuery } from '../app/userMgmtFirestore';
import { UserOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { Chart, registerables } from 'chart.js';
const { Text } = Typography;

Chart.register(...registerables);

export interface DataTransformed {
    data: [
      {
        slideNo: number,
        status: string
      }
    ][]
}

export default function PresentationSummary (props: {summary: any}) {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const { data } = useFetchUserListByRoomIdQuery(sessionId ?? skipToken);
  const numberOfSlides = useAppSelector((state) => state.appState.numberOfSlides);
  const [ dataTransformed, setDataTransformed ] = useState<({ data: {}, label: string, tension: number } )[] | undefined>([]);
  const [ duration, setDuration ] = useState<number>(0);
  const [ participants, setParticipants ] = useState<{max: number, min: number}>({max: 0, min: 0});
  const [ detectedUsers, setDetectedUsers ] = useState<{max: number, min: number}>({max: 0, min: 0});


  const chartRef = useRef<HTMLCanvasElement>(null);
  var chart: any = undefined;
  
  function transformData () {
    var datasets = data?.map( (item) => {
      console.log('single feedbackLogGeneral', item.feedbackLogGeneral)
      
      if (item.feedbackLogGeneral) {
        var res = Object.assign({}, item.feedbackLogGeneral);
        for (var i = 1; i <= numberOfSlides; i++) {
          if (!item.feedbackLogGeneral.hasOwnProperty(i)) {
            Object.assign(res, {[i]: 'none'})
          }
        }
        console.log('single feedbackLogGeneral transformed', res)
      return {data: res, label: item.name}
      } else {
        return {data: [], label: item.name}
      }
    
  })
    console.log('transformed data', datasets, data, props.summary)
    
  }

  function transformSummary (summary: any) {
   
    let confusionArray1: { x: any; y: any;}[] = [];
    let engagementArray1: { x: any; y: any;}[] = [];
    let maxParticipants = 0;
    let maxDetectedUsers = 0;
    let minParticipants = 0;
    let minDetectedUsers = 0;

    summary.forEach((item: { confusion: any; timestamp: any; engagement: any; listeners: any; slideNumber: any; detectedUsers: any; }, index: number)  => {
      confusionArray1.push({x: index+1, y: item.confusion});
      engagementArray1.push({x: index+1, y: item.engagement});
      maxParticipants = (item.listeners && item.listeners > maxParticipants) ? item.listeners : maxParticipants;
      minParticipants = (item.listeners && item.listeners < maxParticipants) ? item.listeners : minParticipants;
      maxDetectedUsers = (item.detectedUsers && item.detectedUsers > maxDetectedUsers) ? item.detectedUsers : maxDetectedUsers;
      minDetectedUsers = (item.detectedUsers && item.detectedUsers < minDetectedUsers) ? item.detectedUsers : minDetectedUsers;
    })

    setParticipants({max: maxParticipants, min: minParticipants});
    setDetectedUsers({max: maxDetectedUsers, min: minDetectedUsers});
    // calculate presentation time of slide  
    var timeDiff = summary[summary.length-1].timestamp - summary[0].timestamp; 
    timeDiff /= 1000;
    timeDiff /= 60;

    //var minutes = Math.round(timeDiff);
    setDuration(timeDiff);
    console.log('duration', summary[summary.length-1].timestamp,  summary[0].timestamp )
    
    setDataTransformed([{data: confusionArray1, label:'confusion', tension: 0.5}, {data: engagementArray1, label:'engagement', tension: 0.5}])
    console.log('dataTransformed', dataTransformed)
  }

  useEffect(() => {
    //transformData();
  }, [data])

  useEffect(() => {
    props.summary && transformSummary(props.summary);
  }, [props.summary])
  
  useEffect(() => {
    const ctx = document.getElementById('line-chart') as HTMLCanvasElement;

    if (ctx && dataTransformed) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: dataTransformed,
        },
        options: {
          
          responsive: true,
          scales: {
            y: {
              type: 'linear',
              //labels: ['low', 'medium low', 'medium high', 'high']
             },
            x: {
              type: 'linear',
              ticks: {
                // Include a dollar sign in the ticks
                callback: function(value, index, ticks) {
                    return 'Slide ' + value;
                }
            }
            }
          }
        }
      });
    }
    return () => {
      chart?.destroy()
    }
  }, [dataTransformed]);
  
    
  

  return (
    <div style={{padding: 10 }}>
      <Row>
        <Text type="secondary"  style={{color: '', fontSize:20, fontWeight:600, marginBottom: 10}}   >Presentation Summary</Text>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card bordered={false} size="small">
            <Statistic
              title="Duration"
              value={duration}
              precision={2}
              prefix={<FieldTimeOutlined style={{marginRight:10}}/>}
              suffix="min"
            />
          </Card>
      </Col>
      <Col span={12}>
        <Card bordered={false} size="small" style={{height:"100%"}}>
          <Row style={{borderBottom: "1px solid #ccc"}} align={'middle'}>
            <Col span={16} style={{color:"#888"}}>
              Participants (min/max)
            </Col>
            <Col span={8}  style={{fontSize: "20px"}}>
              {participants.max}/
              {participants.min}
            </Col>
          </Row>
          <Row align={'middle'}>
            <Col span={16} style={{color:"#888"}}>
              Detected Users (min/max)
            </Col>
            <Col span={8} style={{fontSize: "20px"}}>

              {detectedUsers.max}/
              {detectedUsers.min}
            </Col>
          </Row>
        </Card>
      </Col>
    
  </Row>
      <Row style={{marginTop: '25px'}}>
        <canvas id="line-chart" width="800" height="500"></canvas>
      </Row>
    </div>
  );
}
