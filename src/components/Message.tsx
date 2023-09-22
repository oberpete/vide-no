import React from 'react';
import { Row, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';


const Message: React.FC<{title: string, subtitle: string, icon: string}> = ({ title, subtitle, icon }) => {
  const { Text, Title } = Typography;
  return (
    <div>
      <Row style={{marginTop:"4rem"}} justify={"center"}>
        { icon === 'ExclamationCircleOutlined' &&
        <ExclamationCircleOutlined style={{ fontSize: 60, color: "#293849" }} rev={undefined} />
        }
        { icon === 'CheckCircleOutlined' &&
        <CheckCircleOutlined style={{ fontSize: 60, color: "#293849" }} rev={undefined} />
        }
      </Row>
      <Row justify={"center"}>
        <Title level={4}>
          { title }
        </Title>
      </Row>
      <Row justify={"center"}>
        <Text style={{fontSize:"1rem"}}>
           { subtitle } 
        </Text>
      </Row>
    </div>
  );
};

export default Message;