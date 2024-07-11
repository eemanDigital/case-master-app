import avatar from "../assets/avatar.png";
import { Card, Avatar, List } from "antd";

function AccountOfficerDetails({ accountOfficer }) {
  console.log("AO", accountOfficer);

  return (
    <Card title="Account Officer Details" style={{ width: 300 }}>
      {accountOfficer && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}>
            <Avatar
              size={64}
              src={
                accountOfficer?.photo
                  ? `http://localhost:3000/images/users/${accountOfficer?.photo}`
                  : avatar
              }
            />
          </div>
          <List>
            <List.Item>
              <List.Item.Meta
                title="Full Name"
                description={accountOfficer.fullName}
              />
            </List.Item>
            <List.Item>
              <List.Item.Meta
                title="Email"
                description={accountOfficer.email}
              />
            </List.Item>
            <List.Item>
              <List.Item.Meta
                title="Phone"
                description={accountOfficer.phone}
              />
            </List.Item>
          </List>
        </>
      )}
    </Card>
  );
}

export default AccountOfficerDetails;
