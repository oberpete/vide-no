import React, { useEffect, useRef, useState } from 'react';
import { Steps, ConfigProvider, Divider, Row, Col, Card, Typography, Tag } from 'antd';
import styles from '../styles/Home.module.css';
import 'chart.js/auto'; 
import { useAppSelector } from '../app/hooks';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import { useFetchUserListByRoomIdQuery, useAddUserMutation } from '../app/userMgmtFirestore';
import { Chart, ChartItem, registerables } from 'chart.js';
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

export default function PresentationSummary () {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const { data } = useFetchUserListByRoomIdQuery(sessionId ?? skipToken);
  const numberOfSlides = useAppSelector((state) => state.appState.numberOfSlides);
  const [ dataTransformed, setDataTransformed ] = useState<({ data: {}; } )[] | undefined>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [ addUser ] = useAddUserMutation();
  var chart: any = undefined;
  
  function transformData () {
    var datasets = data?.map( (item) => {
      console.log('single statusLog', item.statusLog)
      
      if (item.statusLog) {
        var res = Object.assign({}, item.statusLog);
        for (var i = 1; i <= numberOfSlides; i++) {
          if (!item.statusLog.hasOwnProperty(i)) {
            Object.assign(res, {[i]: 'none'})
          }
        }
        console.log('single statusLog transformed', res)
      return {data: res, label: item.name}
      } else {
        return {data: [], label: item.name}
      }
    
  })
    console.log('transformed data', datasets, data)
    setDataTransformed(datasets)
    
  }

  useEffect(() => {
    transformData();
  }, [data])
  
  useEffect(() => {
    const ctx = document.getElementById('line-chart') as HTMLCanvasElement;
    console.log('userdata', data)

    if (ctx && dataTransformed) {
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: dataTransformed,
        },
        options: {
          scales: {
            y: {
              type: 'category',
              labels: ['present', 'notPresent', 'none']
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
        <canvas id="line-chart" width="800" height="450"></canvas>
      </Row>
    </div>
  );
}
