import React from 'react';
import { Avatar, Row, Col, Card, Rate } from 'antd';
import { useSetFeedbackGeneralMutation, useSetFeedbackConfusionMutation } from '../app/userMgmtFirestore';
import { FrownTwoTone, MehTwoTone, SmileTwoTone, QuestionCircleTwoTone, CheckCircleTwoTone, CheckOutlined } from '@ant-design/icons';
import { useAppSelector } from '../app/hooks';

const customIcons: Record<number, React.ReactNode> = {
  0: <FrownTwoTone twoToneColor={'#cc3300'} />,
  1: <MehTwoTone twoToneColor={'#ffcc00'} />,
  2: <SmileTwoTone twoToneColor={'#99cc00'} />,
  3: <SmileTwoTone twoToneColor={'#009933'} />,
};

const customIconsConfusion: Record<number, React.ReactNode> = {
  0: <QuestionCircleTwoTone twoToneColor={'#cc3300'} />,
  1: <QuestionCircleTwoTone  twoToneColor={'#ffcc00'} />,
  2: <CheckCircleTwoTone twoToneColor={'#99cc00'} />,
  3: <CheckCircleTwoTone twoToneColor={'#009933'} />,
};

const FeedbackPicker: React.FC<{currentSlide: number, sessionId: string, userId: string}> = (props) => {
  const user = useAppSelector((state) => state.appState.user);

  const [ setFeedbackGeneral ] = useSetFeedbackGeneralMutation(); 
  const [ setFeedbackConfusion ] = useSetFeedbackConfusionMutation(); 


  function setGeneralFeedback(value: number) {
    user && setFeedbackGeneral({roomId: props.sessionId, user: user, currentSlide: props.currentSlide, feedbackGeneral: value} )
  } 

  function setConfusionFeedback(value: number) {
    user && setFeedbackConfusion({roomId: props.sessionId, user: user, currentSlide: props.currentSlide, feedbackConfusion: value} )
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
              {user?.feedbackLogGeneral && user?.feedbackLogGeneral.hasOwnProperty(props.currentSlide) ?
              <div style={{color:'green'}}><CheckOutlined /> Thanks for your feedback </div>:
              <Rate 
                character={({ index }) => index ? customIcons[index] : customIcons[0]}
                onChange={(value: number)=>setGeneralFeedback(value-1)}
              />
              }
              
            </Col>
            <Col span={11} style={{borderLeft: '1px solid #ccc', paddingLeft: 10}}>
              This part of the presentation is easy to understand: <br></br>
              {user?.feedbackLogConfusion && user?.feedbackLogConfusion.hasOwnProperty(props.currentSlide) ?
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