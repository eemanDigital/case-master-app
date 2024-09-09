import PropTypes from "prop-types";
import { Button, Popover } from "antd";
import avatar from "../assets/avatar.png";
import { CheckCircleOutlined } from "@ant-design/icons";
import { MdPendingActions } from "react-icons/md";

function ClientCaseInfo({ cases }) {
  return (
    <div className="flex flex-col justify-center items-start flex-wrap">
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
        {cases?.map((singleCase, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-rose-400 to-rose-600 rounded-lg shadow-sm p-4 md:w-[80%] w-full h-[200px]">
            <h4 className="text-lg font-medium mb-1 text-white text-justify">
              Case {index + 1}: {singleCase?.firstParty?.name[0]?.name} vs{" "}
              {singleCase?.secondParty?.name[0]?.name}
            </h4>
            <p className="capitalize">
              <div className="flex items-center justify-between">
                <p className="font-medium">Status: </p>
                {singleCase.caseStatus === "decided" ? (
                  <p>
                    <CheckCircleOutlined className="text-green-600 text-[40px]" />
                  </p>
                ) : (
                  <p>
                    <MdPendingActions className="text-orange-500 text-[40px]" />
                  </p>
                )}
              </div>
              {singleCase.caseStatus}
            </p>
            {singleCase?.accountOfficer?.map((officer, officerIndex) => (
              <Popover
                key={officerIndex}
                content={
                  <div className="space-y-2">
                    <img
                      className="w-16 h-16 rounded-full"
                      src={officer?.photo || avatar}
                      alt="Avatar"
                    />
                    <p>
                      <span className="font-medium">Full Name: </span>
                      {officer.firstName} {officer.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Email: </span>
                      {officer?.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone: </span>
                      {officer?.phone}
                    </p>
                  </div>
                }
                title="Account Officer Details"
                trigger="hover">
                <Button
                  type="link"
                  className="flex bg-blue-500 text-white justify-center my-2">
                  See Case Account Officer
                </Button>
              </Popover>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Define PropTypes
ClientCaseInfo.propTypes = {
  cases: PropTypes.arrayOf(
    PropTypes.shape({
      firstParty: PropTypes.shape({
        name: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          })
        ),
      }),
      secondParty: PropTypes.shape({
        name: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          })
        ),
      }),
      caseStatus: PropTypes.string.isRequired,
      accountOfficer: PropTypes.arrayOf(
        PropTypes.shape({
          photo: PropTypes.string,
          fullName: PropTypes.string.isRequired,
          email: PropTypes.string.isRequired,
          phone: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
};

export default ClientCaseInfo;
