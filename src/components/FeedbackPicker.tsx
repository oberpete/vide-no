import React, { useEffect, useReducer, useState } from 'react';
import { Avatar, Row, Col, Card, Rate } from 'antd';
import { useSetFeedbackGeneralMutation, useSetFeedbackConfusionMutation } from '../app/userMgmtFirestore';
import { FrownTwoTone, MehTwoTone, SmileTwoTone, QuestionCircleTwoTone, CheckCircleTwoTone, CheckOutlined } from '@ant-design/icons';
import { useAppSelector } from '../app/hooks';

var customIcons: Record<number, React.ReactNode> = {
  0: <FrownTwoTone twoToneColor={'#cc3300'} />,
  1: <MehTwoTone twoToneColor={'#ffcc00'} />,
  2: <SmileTwoTone twoToneColor={'#99cc00'} />,
  3: <SmileTwoTone twoToneColor={'#009933'} />,
};

var customIconsConfusion: Record<number, React.ReactNode> = {
  0: <QuestionCircleTwoTone twoToneColor={'#cc3300'} />,
  1: <QuestionCircleTwoTone  twoToneColor={'#ffcc00'} />,
  2: <CheckCircleTwoTone twoToneColor={'#99cc00'} />,
  3: <CheckCircleTwoTone twoToneColor={'#009933'} />,
};

const FeedbackPicker: React.FC<{currentSlide: number, sessionId: string, userId: string}> = (props) => {
  const user = useAppSelector((state) => state.appState.user);
  const [engagementFeedbackSetForSlide, setEngagementFeedbackSetForSlide] = useState<number[]>([]);
  const [confusionFeedbackSetForSlide, setConfusionFeedbackSetForSlide] = useState<number[]>([]);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [ setFeedbackGeneral ] = useSetFeedbackGeneralMutation(); 
  const [ setFeedbackConfusion ] = useSetFeedbackConfusionMutation(); 

  useEffect(() => {
    if(user?.confusion) {
      customIconsConfusion = {
        0: <QuestionCircleTwoTone twoToneColor={'#cc3300'} style={{fontSize: user?.confusion === 4 ? '25px' : '20px'}}/>,
        1: <QuestionCircleTwoTone  twoToneColor={'#ffcc00'} style={{fontSize: user?.confusion === 3 ? '25px' : '20px'}}/>,
        2: <CheckCircleTwoTone twoToneColor={'#99cc00'} style={{fontSize: user?.confusion === 2 ? '25px' : '20px'}}/>,
        3: <CheckCircleTwoTone twoToneColor={'#009933'} style={{fontSize: user?.confusion === 1 ? '25px' : '20px'}}/>,
    };
    customIcons = {
      0: <FrownTwoTone twoToneColor={'#cc3300'}  style={{fontSize: user?.engagement === 1 ? '25px' : '20px'}}/>,
      1: <MehTwoTone twoToneColor={'#ffcc00'} style={{fontSize: user?.engagement === 2 ? '25px' : '20px'}}/>,
      2: <SmileTwoTone twoToneColor={'#99cc00'} style={{fontSize: user?.engagement === 3 ? '25px' : '20px'}}/>,
      3: <SmileTwoTone twoToneColor={'#009933'} style={{fontSize: user?.engagement === 4 ? '25px' : '20px'}}/>,
    };
    console.log('user changed hook feedback')
    forceUpdate();
  }
  }, [user])

  function setGeneralFeedback(value: number) {
    user && setFeedbackGeneral({roomId: props.sessionId, user: user, currentSlide: props.currentSlide, feedbackGeneral: value} );
    setEngagementFeedbackSetForSlide([...engagementFeedbackSetForSlide, props.currentSlide]);
  } 

  function setConfusionFeedback(value: number) {
    // replace value to account for reversed order
    let reversedValue = 0;
    switch (value) {
      case 0:
        reversedValue = 3;
        break;
      case 1:
        reversedValue = 2;
        break;
      case 2:
        reversedValue = 1;
        break;
      case 3:
        reversedValue = 0;
        break;
      default:
        break;
    }
    user && setFeedbackConfusion({roomId: props.sessionId, user: user, currentSlide: props.currentSlide, feedbackConfusion: reversedValue} );
    setConfusionFeedbackSetForSlide([...confusionFeedbackSetForSlide, props.currentSlide]);
  } 

  return (
    <>
      <Row >
        <Card size='small' style={{ width: '100%', marginTop: 16, borderRadius: 0, backgroundColor: '#eaeaea', border: '1px solid #cecece' }}>
          <Row>
            <Col span={2} style={{textAlign: 'center'}}>
              Slide <br></br>
              <Avatar shape="square" size={'small'} icon={props.currentSlide} />
            </Col>
            <Col span={11} style={{borderLeft: '1px solid #ccc', paddingLeft: 10}}>
              Overall Feedback for this part of the presentation: <br></br>
              {engagementFeedbackSetForSlide.includes(props.currentSlide) ?
              <div style={{color:'green'}}><CheckOutlined /> Thanks for your feedback </div>:
              <Rate 
                character={({ index }) => index ? customIcons[index] : customIcons[0]}
                onChange={(value: number)=>setGeneralFeedback(value-1)}
              />
              }
              
            </Col>
            <Col span={11} style={{borderLeft: '1px solid #ccc', paddingLeft: 10}}>
              This part of the presentation is easy to understand: <br></br>
              {confusionFeedbackSetForSlide.includes(props.currentSlide) ?
              <div style={{color:'green'}}><CheckOutlined /> Thanks for your feedback </div>:
              <Rate 
                character={({ index }) => index ? customIconsConfusion[index] : customIconsConfusion[0]} 
                onChange={(value: number)=>setConfusionFeedback(value-1)}
                />
              }
              </Col>
          </Row>
          
        </Card>
      </Row>  
    </>
  );
};

export default FeedbackPicker;