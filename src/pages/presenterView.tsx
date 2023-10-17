
import PresentationView from "../components/PresentationView";
import { Button, Col, Row, Typography } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons'
import PresentationSummary from "../components/PresentationSummary";
import { useAppSelector } from "../app/hooks";
import { useFetchPresentationStatsByIdQuery, useSetPresentationStatsMutation } from "../app/presentationStatsFirestore";
import ShareOptions from "../components/ShareOptions";
import Message from "../components/Message";
import { skipToken } from "@reduxjs/toolkit/dist/query/react";
const { Text } = Typography;



const PresenterView: React.FC = () => {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const { error, data } = useFetchPresentationStatsByIdQuery(sessionId ?? skipToken);
  const numberOfSlides = useAppSelector((state) => state.appState.numberOfSlides);
  const [setPresentationStats] = useSetPresentationStatsMutation();

  function incrementSlideNumber() {
    setPresentationStats({
      roomId: sessionId, 
      nextSlideNumber: data?.currentSlideNumber? data?.currentSlideNumber+1 : 1,
    });
  }

  function decrementSlideNumber() {
    setPresentationStats({
      roomId: sessionId, 
      nextSlideNumber: data?.currentSlideNumber? data?.currentSlideNumber-1 : 1
    });
  }

  function endPresentation() {
    setPresentationStats({
      roomId: sessionId, 
      nextSlideNumber: data?.currentSlideNumber,
      presentationFinished: true
    });
  }

  function restartPresentation() {
    setPresentationStats({
      roomId: sessionId, 
      nextSlideNumber: 1,
      presentationFinished: false
    });

  }

  return (
    <>
    { data &&
    <div style={{width:"100%"}}>
      
        <ShareOptions sessionId={sessionId} recordingInProgress={data.recordingInProgress}/>
        { data?.presentationFinished ?
        <>
        <Row justify={'center'} style={{marginBottom: 15}}>
          <Button 
            shape="round" 
            icon={<ReloadOutlined rev={undefined} />} 
            size="large"
            onClick={()=>restartPresentation()}
            >
              Restart Presentation
          </Button>
        </Row>
        <PresentationSummary summary={data.summary}/> 
        </>
        :
        <>
          <Row align={'middle'} style={{marginBottom: 15}}>
            <Col span={11}>
              <Row justify={'end'}>
                <Button shape="round" disabled={data?.currentSlideNumber !== undefined && data?.currentSlideNumber < 2} onClick={() => decrementSlideNumber()} icon={<ArrowLeftOutlined rev={undefined} />}>Previous Slide</Button>
              </Row>
            </Col>
            <Col span={2}>
              <Row justify={'center'}>  
                <Text strong>{data?.currentSlideNumber}</Text>
              </Row>
            </Col>
            <Col span={11}>
              <Button shape="round" disabled={!(data?.currentSlideNumber !== undefined && data?.currentSlideNumber < numberOfSlides)} onClick={()=> incrementSlideNumber()} icon={<ArrowRightOutlined rev={undefined} />}>Next Slide</Button>
            </Col>            
          </Row>
          { data?.currentSlideNumber === numberOfSlides &&
            <Row justify={'center'} style={{marginBottom: 15}}>
              <Button 
                type="primary" 
                shape="round" 
                icon={<CheckOutlined rev={undefined} />} 
                size="large"
                onClick={()=>endPresentation()}
                >
                  End Presentation
              </Button>
            </Row>
          }
          
          <PresentationView presenterView={true} />
        </>
        }

    </div>
    }
    { error &&
    <Message title={"Session not found"} subtitle={"Please provide a valid session id"} icon={"ExclamationCircleOutlined"} />
    }
    </>
  );
};

export default PresenterView;