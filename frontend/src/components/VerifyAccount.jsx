import { Button, Card } from "antd";

const VerifyAccount = () => {
  return (
    <div>
      <section>
        <div>
          <Card>
            <h1 className="text-2xl font-bold text-center">
              Verify Your Account
            </h1>
            <p className="text-center mb-6">
              Click the button below to verify your account.
            </p>

            <div className=" text-center space-y-4">
              <Button className="bg-blue-500 text-white">Verify Account</Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default VerifyAccount;
