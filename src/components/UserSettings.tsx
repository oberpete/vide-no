import React from 'react';
import { Modal, Tabs, Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
// import { Input } from 'antd';
import { useAddUserMutation } from '../app/userMgmtFirestore';
import { setOnBoardingInProgress, setInferencingInProgress } from '../app/appStateSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { ReactComponent as Onboarding1 } from '../assets/videNo_onboarding_1.svg';
import { ReactComponent as Onboarding2 } from '../assets/videNo_onboarding_2.svg';
import { ReactComponent as Onboarding3 } from '../assets/videNo_onboarding_3.svg';


const App: React.FC<{presenterMode: boolean}> = ({ presenterMode }) => {
  const open = useAppSelector((state) => state.appState.onboardingInProgress);
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  // const [displayName, setDisplayName] = useState('');
  // const handleChange = (e: { target: { value: React.SetStateAction<string>; }; }) => setDisplayName(e.target.value);
  const [ addUser ] = useAddUserMutation();
  const dispatch = useAppDispatch()
  const [activeKey, setActiveKey] = React.useState('1')
  const onKeyChange = (key: React.SetStateAction<string>) => setActiveKey(key)

  function addUserAndClose() {
    // addUser({roomId: sessionId, name: displayName, presenterMode: presenterMode});
    addUser({roomId: sessionId, name: 'Anonymous User', presenterMode: presenterMode});
    dispatch(setOnBoardingInProgress(false));
    if (!presenterMode) {
      dispatch(setInferencingInProgress(true));
    }
  }

  return (
    <>
      <Modal
        title="Welcome!"
        centered
        open={open}
        onCancel={() => dispatch(setOnBoardingInProgress(false))}
        width={700}
        footer={[
          <Button 
            disabled={activeKey==='3'} 
            icon={<ArrowRightOutlined />}
            key="next" 
            type="primary" 
            onClick={() => onKeyChange((Number(activeKey)+1).toString())}
          >
            Next
          </Button>,          
          <Button disabled={activeKey!=='3'} key="submit" type="primary" onClick={() => addUserAndClose()}>
            Join Presentation
          </Button>,
          
        ]}
      >
        <Tabs
        tabPosition='left'
        activeKey={activeKey}
        onChange={onKeyChange}
        items={[{
          key: '1',
          label: 'Introduction',
          children: <Onboarding1/>,
        },
        {
          key: '2',
          label: 'Feedback',
          children: <Onboarding2/>,
        },
        {
          key: '3',
          label: 'Access to Webcam',
          children: <Onboarding3/>,
        }]}
      />
       
      {/* <p>Please provide your display name:</p> <Input onChange={handleChange} size="large" value="Anonymous User" prefix={<UserOutlined rev={undefined} /> */}
      </Modal>
    </>
  );
};

export default App;