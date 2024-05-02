import { Spin } from "antd";
const App = () => (
  <div className="flex justify-center items-center h-screen">
    <Spin tip="Loading" size="large">
      <div className="content" />
    </Spin>
  </div>
);
export default App;
