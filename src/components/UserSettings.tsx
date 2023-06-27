import React, { useState } from 'react';
import { Modal } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { useAddUserMutation } from '../app/userMgmtFirestore';
import { setOnBoardingInProgress, setInferencingInProgress } from '../app/appStateSlice';
import { useAppDispatch, useAppSelector } from '../app/hooks'

const App: React.FC<{presenterMode: boolean}> = ({ presenterMode }) => {
  const open = useAppSelector((state) => state.appState.onboardingInProgress);
  const sessionId = useAppSelector((state) => state.appState.sessionId);
  const [displayName, setDisplayName] = useState('');
  const handleChange = (e: { target: { value: React.SetStateAction<string>; }; }) => setDisplayName(e.target.value);
  const [ addUser ] = useAddUserMutation();
  const dispatch = useAppDispatch()

  function addUserAndClose() {
    addUser({roomId: sessionId, name: displayName, presenterMode: presenterMode});
    dispatch(setOnBoardingInProgress(false));
    if (!presenterMode) {
      dispatch(setInferencingInProgress(true));
    }
  }

  return (
    <>
      <Modal
        title="User Details"
        centered
        open={open}
        onOk={() => addUserAndClose()}
        onCancel={() => dispatch(setOnBoardingInProgress(false))}
        width={800}
      >
        <p>Please provide your display name:</p>
        <Input onChange={handleChange} size="large" placeholder="Name" prefix={<UserOutlined rev={undefined} />} />
      </Modal>
    </>
  );
};

export default App;