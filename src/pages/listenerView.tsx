import { useAppSelector } from "../app/hooks";
import { useFetchPresentationStatsByIdQuery } from "../app/presentationStatsFirestore";
import { skipToken } from "@reduxjs/toolkit/dist/query/react";
import Message from "../components/Message";
import PresentationView from "../components/PresentationView";
import WebcamModal from "../components/WebcamModal";
import FeedbackPicker from "../components/FeedbackPicker";



const ListenerView: React.FC = () => {
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const userId = useAppSelector((state) => state.appState.user?.id);
  const { error, data } = useFetchPresentationStatsByIdQuery(sessionId ?? skipToken);

  return (
    <div style={{width:"100%", height:"100%", marginTop: "1rem"}}>
      { data &&        
        <>
        { data?.presentationFinished ?
        <Message 
          title={"The presentation has ended"} 
          subtitle={"Thank you for your attention"} 
          icon={"CheckCircleOutlined"} />
        :  
        <>
        <WebcamModal /> 
        <PresentationView presenterView={false} />
        { sessionId !== undefined && userId !== undefined &&
        <FeedbackPicker currentSlide={data.currentSlideNumber} sessionId={sessionId} userId={userId}/>
        }
        </>
        }
        </>
      }
      { (error !== undefined) &&
        <>
        {console.log(error)}
        <Message title={"Session not found"} subtitle={"Please provide a valid session id"} icon={"ExclamationCircleOutlined"} />
        </>
      }
    </div>
  );
};

export default ListenerView;