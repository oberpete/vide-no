import React, { useEffect } from 'react';
import { Button, Row, Typography } from 'antd';
import { InferenceSession, Tensor } from 'onnxruntime-web';
var session: InferenceSession; 
const TestModel: React.FC = () => {

  
  const warmupModel = async () => {
    
    const baseModelURL = `${process.env.PUBLIC_URL}/model`;
    // create session
    const response = await fetch(
      `${baseModelURL}/yolo.onnx`, // url
    );
    var arrBufNet = await response.arrayBuffer();
    session = await InferenceSession.create(arrBufNet);
    
    
    let res = await runModel(session, [1, 3, 416, 416]);

    console.log('session', session, res)
    //return runModelUtils.warmupModel(session, [1, 3, 416, 416]);
  }

  const runModelAgain = async() => {
    var res = await runModel(session, [1, 3, 416, 416]);
    console.log('result', res)
  }

  const runModel = async(model: InferenceSession, dims: number[]) => {
  const size = dims.reduce((a, b) => a * b);
  const warmupTensor = new Tensor('float32', new Float32Array(size), dims);

  for (let i = 0; i < size; i++) {
    warmupTensor.data[i] = Math.random() * 2.0 - 1.0;  // random value [-1.0, 1.0)
  }
  try {
    const feeds: Record<string, Tensor> = {};
    feeds[model.inputNames[0]] = warmupTensor;
    return await model.run(feeds);
  } catch (e) {
    console.error(e);
  }
  }

  useEffect(() => {
    warmupModel();
  }, []);

  const { Text, Title } = Typography;
  return (
    <div>
      <Row style={{marginTop:"4rem"}} justify={"center"}>
        <Text>TestModel</Text>
        <Button onClick={()=>{runModelAgain()}}>Run Model</Button>
      </Row>
    </div>
  );
};

export default TestModel;