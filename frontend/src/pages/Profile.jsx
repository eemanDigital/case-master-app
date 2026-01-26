// pages/Profile.jsx - COMPLETE MOBILE-FIRST REFACTOR
import { useSelector } from "react-redux";
import {
  Card,
  Avatar,
  Typography,
  Tag,
  Space,
  Row,
  Col,
  Divider,
  Button,
  Descriptions,
  Alert,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  CalendarOutlined,
  BankOutlined,
  TeamOutlined,
  CrownOutlined,
  IdcardOutlined,
  EditOutlined,
  LockOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { formatDate, formatYear } from "../utils/formatDate";
import ProfilePictureUpload from "../components/ProfilePictureUpload";
import EditUserProfile from "../components/EditUserProfile";
import ChangePassword from "../components/ChangePassword";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import LeaveSummaryCard from "../components/LeaveSummaryCard";

const { Title, Text, Paragraph } = Typography;

const Profile = () => {
  useRedirectLogoutUser("/users/login");

  const { user, isError, isLoading, message } = useSelector(
    (state) => state.auth
  );

  console.log(user)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <PageErrorAlert errorCondition={isError} errorMessage={message} />
      </div>
    );
  }

  const userData = user?.data || user;
  const isClient = userData?.role === "client" || userData?.userType === "client";
  const isLawyer = userData?.isLawyer || userData?.userType === "lawyer";

  // Get effective roles
  const getEffectiveRoles = () => {
    const roles = [userData?.role];
    if (userData?.additionalRoles && userData.additionalRoles.length > 0) {
      roles.push(...userData.additionalRoles);
    }
    return [...new Set(roles)].filter(Boolean);
  };

  const effectiveRoles = getEffectiveRoles();

  // Profile Header Component
  const ProfileHeader = () => (
    <Card className="mb-4 sm:mb-6 shadow-lg border-0">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-2 sm:p-4">
        {/* Avatar Section */}
        <div className="flex flex-col items-center lg:items-start flex-shrink-0">
          <div className="relative mb-4">
            <Avatar
              size={window.innerWidth < 640 ? 120 : 160}
              src={userData?.photo}
              icon={<UserOutlined />}
              className="shadow-xl border-4 border-white ring-4 ring-blue-100"
            />
            {userData?.isActive && (
              <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1.5 border-2 border-white">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            )}
          </div>

          {/* Action Buttons - Mobile Stack */}
          <div className="flex flex-col w-full gap-2">
            <ProfilePictureUpload />
            <EditUserProfile userData={userData} />
            <ChangePassword />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="text-center lg:text-left">
            <Title
              level={window.innerWidth < 640 ? 3 : 2}
              className="!mb-2 truncate"
            >
              {userData?.firstName} {userData?.lastName}
            </Title>

            {/* Position & Role Tags */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
              <Tag
                color="blue"
                className="px-3 py-1 text-xs sm:text-sm font-semibold rounded-full"
              >
                {userData?.userType}
              </Tag>
              {userData?.position && (
                <Tag
                  color="green"
                  className="px-3 py-1 text-xs sm:text-sm font-semibold rounded-full"
                >
                  {userData.position}
                </Tag>
              )}
              {isLawyer && (
                <Tag
                  icon={<SafetyCertificateOutlined />}
                  color="purple"
                  className="px-3 py-1 text-xs sm:text-sm font-semibold rounded-full"
                >
                  Lawyer
                </Tag>
              )}
            </div>

            {/* Status Tags */}
            <Space wrap className="mb-4">
              {userData?.isActive && (
                <Tag color="success" icon={<SafetyCertificateOutlined />}>
                  Active
                </Tag>
              )}
              {userData?.isVerified && (
                <Tag color="cyan" icon={<SafetyCertificateOutlined />}>
                  Verified
                </Tag>
              )}
            </Space>

            {/* Multi-Role Alert */}
            {effectiveRoles.length > 1 && (
              <Alert
                message="Multi-Role Account"
                description={
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Text className="text-xs sm:text-sm">
                      <strong>All Roles:</strong>
                    </Text>
                    {effectiveRoles.map((role) => (
                      <Tag key={role} color="blue" className="text-xs">
                        {role}
                      </Tag>
                    ))}
                  </div>
                }
                type="info"
                showIcon
                className="mt-4"
              />
            )}

            <Divider className="my-4" />

            {/* Bio */}
            {userData?.bio && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <Text strong className="block mb-2 text-xs sm:text-sm">
                  Professional Bio
                </Text>
                <Paragraph
                  ellipsis={{
                    rows: 3,
                    expandable: true,
                    symbol: (expanded) =>
                      expanded ? "Show less" : "Read more",
                  }}
                  className="text-xs sm:text-sm text-gray-700"
                >
                  {userData.bio}
                </Paragraph>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  // Contact Information Component
  const ContactInformation = () => (
    <Card
      title={
        <Space className="text-sm sm:text-base">
          <MailOutlined className="text-blue-600" />
          <span>Contact Information</span>
        </Space>
      }
      className="mb-4 sm:mb-6 shadow-md"
    >
      <Descriptions
        column={{ xs: 1, sm: 1, md: 2 }}
        size={window.innerWidth < 640 ? "small" : "middle"}
        labelStyle={{ fontWeight: 600 }}
      >
        <Descriptions.Item
          label={
            <Space size="small">
              <MailOutlined />
              <span className="text-xs sm:text-sm">Email</span>
            </Space>
          }
        >
          <Text className="text-xs sm:text-sm break-all">
            {userData?.email}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space size="small">
              <PhoneOutlined />
              <span className="text-xs sm:text-sm">Phone</span>
            </Space>
          }
        >
          <Text className="text-xs sm:text-sm">
            {userData?.phone || "Not provided"}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space size="small">
              <HomeOutlined />
              <span className="text-xs sm:text-sm">Address</span>
            </Space>
          }
          span={2}
        >
          <Text className="text-xs sm:text-sm">
            {userData?.address || "Not provided"}
          </Text>
        </Descriptions.Item>

        {userData?.gender && (
          <Descriptions.Item
            label={
              <Space size="small">
                <UserOutlined />
                <span className="text-xs sm:text-sm">Gender</span>
              </Space>
            }
          >
            <Text className="text-xs sm:text-sm capitalize">
              {userData.gender}
            </Text>
          </Descriptions.Item>
        )}

        {userData?.dateOfBirth && (
          <Descriptions.Item
            label={
              <Space size="small">
                <CalendarOutlined />
                <span className="text-xs sm:text-sm">Date of Birth</span>
              </Space>
            }
          >
            <Text className="text-xs sm:text-sm">
              {formatDate(userData.dateOfBirth)}
            </Text>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );

  // Professional Information Component
  const ProfessionalInformation = () => {
    const hasLawyerDetails = isLawyer && userData?.lawyerDetails;
    const hasStaffDetails = userData?.staffDetails;
    const hasClientDetails = isClient && userData?.clientDetails;

    if (!hasLawyerDetails && !hasStaffDetails && !hasClientDetails) {
      return null;
    }

    return (
      <Card
        title={
          <Space className="text-sm sm:text-base">
            <IdcardOutlined className="text-purple-600" />
            <span>Professional Information</span>
          </Space>
        }
        className="mb-4 sm:mb-6 shadow-md"
      >
        {/* Lawyer Details */}
        {hasLawyerDetails && (
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg mb-4">
            <Space className="mb-3">
              <SafetyCertificateOutlined className="text-purple-600 text-lg" />
              <Text strong className="text-sm sm:text-base">
                Legal Credentials
              </Text>
            </Space>

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size={window.innerWidth < 640 ? "small" : "middle"}
            >
              {userData.lawyerDetails.barNumber && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Bar Number</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {userData.lawyerDetails.barNumber}
                  </Text>
                </Descriptions.Item>
              )}

              {userData.lawyerDetails.yearOfCall && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Year of Call</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {formatYear(userData.lawyerDetails.yearOfCall)}
                  </Text>
                </Descriptions.Item>
              )}

              {userData.lawyerDetails.practiceAreas?.length > 0 && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Practice Areas</span>}
                  span={2}
                >
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {userData.lawyerDetails.practiceAreas.map((area) => (
                      <Tag key={area} color="purple" className="text-xs">
                        {area}
                      </Tag>
                    ))}
                  </div>
                </Descriptions.Item>
              )}

              {userData.lawyerDetails.specialization && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Specialization</span>}
                  span={2}
                >
                  <Text className="text-xs sm:text-sm">
                    {userData.lawyerDetails.specialization}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Education */}
            {(userData.lawyerDetails.lawSchool?.name ||
              userData.lawyerDetails.undergraduateSchool?.name) && (
              <>
                <Divider className="my-3" />
                <Space className="mb-2">
                  <BookOutlined className="text-blue-600" />
                  <Text strong className="text-xs sm:text-sm">
                    Education
                  </Text>
                </Space>

                <div className="space-y-2">
                  {userData.lawyerDetails.undergraduateSchool?.name && (
                    <div className="text-xs sm:text-sm">
                      <Text strong>University: </Text>
                      <Text>
                        {userData.lawyerDetails.undergraduateSchool.name}
                        {userData.lawyerDetails.undergraduateSchool
                          .graduationYear &&
                          ` (${userData.lawyerDetails.undergraduateSchool.graduationYear})`}
                      </Text>
                    </div>
                  )}

                  {userData.lawyerDetails.lawSchool?.name && (
                    <div className="text-xs sm:text-sm">
                      <Text strong>Law School: </Text>
                      <Text>
                        {userData.lawyerDetails.lawSchool.name}
                        {userData.lawyerDetails.lawSchool.graduationYear &&
                          ` (${userData.lawyerDetails.lawSchool.graduationYear})`}
                      </Text>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Staff Details */}
        {hasStaffDetails && (
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4">
            <Space className="mb-3">
              <TeamOutlined className="text-blue-600 text-lg" />
              <Text strong className="text-sm sm:text-base">
                Employment Details
              </Text>
            </Space>

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size={window.innerWidth < 640 ? "small" : "middle"}
            >
              {userData.staffDetails.employeeId && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Employee ID</span>}
                >
                  <Text code className="text-xs sm:text-sm">
                    {userData.staffDetails.employeeId}
                  </Text>
                </Descriptions.Item>
              )}

              {userData.staffDetails.department && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Department</span>}
                >
                  <Tag color="blue" className="text-xs">
                    {userData.staffDetails.department}
                  </Tag>
                </Descriptions.Item>
              )}

              {userData.staffDetails.designation && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Designation</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {userData.staffDetails.designation}
                  </Text>
                </Descriptions.Item>
              )}

              {userData.staffDetails.employmentType && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Employment Type</span>}
                >
                  <Tag color="green" className="text-xs capitalize">
                    {userData.staffDetails.employmentType}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {userData.staffDetails.skills?.length > 0 && (
              <>
                <Divider className="my-3" />
                <div>
                  <Text strong className="block mb-2 text-xs sm:text-sm">
                    Skills
                  </Text>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {userData.staffDetails.skills.map((skill, index) => (
                      <Tag key={index} color="cyan" className="text-xs">
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Client Details */}
        {hasClientDetails && (
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <Space className="mb-3">
              <BankOutlined className="text-green-600 text-lg" />
              <Text strong className="text-sm sm:text-base">
                Business Information
              </Text>
            </Space>

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size={window.innerWidth < 640 ? "small" : "middle"}
            >
              {userData.clientDetails.company && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Company</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {userData.clientDetails.company}
                  </Text>
                </Descriptions.Item>
              )}

              {userData.clientDetails.industry && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Industry</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {userData.clientDetails.industry}
                  </Text>
                </Descriptions.Item>
              )}

              {userData.clientDetails.clientCategory && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Category</span>}
                >
                  <Tag color="blue" className="text-xs capitalize">
                    {userData.clientDetails.clientCategory}
                  </Tag>
                </Descriptions.Item>
              )}

              {userData.clientDetails.preferredContactMethod && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Preferred Contact</span>}
                >
                  <Tag color="green" className="text-xs capitalize">
                    {userData.clientDetails.preferredContactMethod}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}

        {/* Admin Details */}
        {userData?.adminDetails && (
          <div className="bg-orange-50 p-3 sm:p-4 rounded-lg mt-4">
            <Space className="mb-3">
              <CrownOutlined className="text-orange-600 text-lg" />
              <Text strong className="text-sm sm:text-base">
                Admin Permissions
              </Text>
            </Space>

            <div className="flex flex-wrap gap-2">
              {userData.adminDetails.canManageUsers && (
                <Tag color="orange" className="text-xs">
                  Manage Users
                </Tag>
              )}
              {userData.adminDetails.canManageCases && (
                <Tag color="orange" className="text-xs">
                  Manage Cases
                </Tag>
              )}
              {userData.adminDetails.canManageBilling && (
                <Tag color="orange" className="text-xs">
                  Manage Billing
                </Tag>
              )}
              {userData.adminDetails.canViewReports && (
                <Tag color="orange" className="text-xs">
                  View Reports
                </Tag>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <ProfileHeader />
        <ContactInformation />
        <ProfessionalInformation />

        {/* Leave Summary - Only for non-clients */}
        {!isClient && <LeaveSummaryCard id={userData?._id} />}
      </div>
    </div>
  );
};

export default Profile;