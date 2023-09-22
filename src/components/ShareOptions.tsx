import React from 'react';
import { Button, Row, notification } from 'antd';
import { UsergroupAddOutlined } from '@ant-design/icons';

const ShareOptions: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();

  function copyInvitation() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    urlParams.delete("presenterMode");
    urlParams.delete("userId");
    navigator.clipboard.writeText(window.location.origin+'?'+urlParams);
    openNotification();
  }

  const openNotification = () => {
    api.open({
      message: 'Invite Users',
      description:
        'The invitation link has been saved to your clipboard.',
      duration: 3,
    });
  };

  return (
    <>
      {contextHolder}
      <Row justify={"end"}>
        <Button 
          type="link"
          onClick={()=>copyInvitation()}
          icon={<UsergroupAddOutlined rev={undefined} />}
        >
          Copy Invitation Link
        </Button>
      </Row>  
    </>
  );
};

export default ShareOptions;