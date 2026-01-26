// pages/StaffDetails.jsx - COMPLETE MOBILE-FIRST REFACTOR WITH UPDATED USER MODEL SUPPORT
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tag,
  Space,
  Divider,
  Button,
  Alert,
  Descriptions,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BookOutlined,
  CalendarOutlined,
  BankOutlined,
  TeamOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  SolutionOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook, useLawyerHook } from "../hooks/useAdminHook";
import { formatDate } from "../utils/formatDate";
import UpdateUserPositionAndRole from "../components/UpdateUserPositionAndRole";
import UpdateUserPrivileges from "../components/UpdateUserPrivileges";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import PageErrorAlert from "../components/PageErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Title, Text, Paragraph } = Typography;

const StaffDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Use updated hooks
  const { 
    isAdminOrHr, 
    isSuperOrAdmin, 
    userData: currentUserData,
    hasRole,
    canManageUsers,
    canViewReports,
    isAdmin,
    isLawyer: isCurrentUserLawyer
  } = useAdminHook();
  
  const { isLawyer: currentUserIsLawyer } = useLawyerHook();
  
  const loggedInUserId = currentUserData?._id || user?.data?._id || user?._id;
  
  const { dataFetcher, data, loading, error } = useDataFetch();
  
  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    if (id) {
      dataFetcher(`users/${id}`, "GET");
    }
  }, [id]);

  const isCurrentUser = loggedInUserId === id;
  const staffData = data?.data;

  // Get effective roles from user model
  const getEffectiveRoles = () => {
    if (!staffData) return [];
    
    // Use the method from user model if available
    if (staffData.allRoles) {
      return staffData.allRoles;
    }
    
    // Fallback to manual calculation
    const roles = [staffData.role];
    if (staffData.additionalRoles && staffData.additionalRoles.length > 0) {
      roles.push(...staffData.additionalRoles);
    }
    return [...new Set(roles.filter(Boolean))];
  };

  // Get user capabilities
  const getUserCapabilities = () => {
    if (!staffData) return [];
    
    const capabilities = [];
    
    // Lawyer capabilities
    if (staffData.isLawyer || staffData.role === "lawyer" || staffData.userType === "lawyer") {
      capabilities.push("Lawyer");
    }
    
    // Admin capabilities
    if (staffData.adminDetails) {
      if (staffData.adminDetails.canManageUsers) capabilities.push("User Management");
      if (staffData.adminDetails.canManageCases) capabilities.push("Case Management");
      if (staffData.adminDetails.canManageBilling) capabilities.push("Billing Management");
      if (staffData.adminDetails.canViewReports) capabilities.push("Report Access");
    }
    
    // Department-based capabilities
    if (staffData.staffDetails?.department) {
      capabilities.push(`${staffData.staffDetails.department} Department`);
    }
    
    return capabilities;
  };

  const effectiveRoles = getEffectiveRoles();
  const capabilities = getUserCapabilities();

  const renderProfileHeader = () => (
    <Card className="mb-4 sm:mb-6 shadow-md border-0">
      <div className="p-2 sm:p-4">
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4"
          type="text"
        >
          <span className="hidden sm:inline ml-1">Back</span>
        </Button>

        {/* Profile Content */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            <Avatar
              size={window.innerWidth < 640 ? 100 : 140}
              src={staffData?.photo}
              icon={<UserOutlined />}
              className="shadow-lg border-4 border-white ring-2 ring-blue-100"
            />
            {staffData?.isActive && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-400"></div>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left min-w-0 w-full">
            <Title
              level={window.innerWidth < 640 ? 3 : 2}
              className="!mb-2 truncate"
            >
              {staffData?.firstName} {staffData?.lastName}
              {staffData?.middleName && ` ${staffData.middleName}`}
            </Title>

            {/* User Type & Position */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
              <Tag
                color="blue"
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full"
              >
                {staffData?.userType ? staffData.userType.replace("-", " ").toUpperCase() : "USER"}
              </Tag>
              
              {staffData?.position && (
                <Tag
                  color="green"
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full"
                >
                  {staffData.position}
                </Tag>
              )}
              
              {(staffData?.isLawyer || staffData?.role === "lawyer" || staffData?.userType === "lawyer") && (
                <Tag
                  icon={<SafetyCertificateOutlined />}
                  color="purple"
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full"
                >
                  Lawyer
                </Tag>
              )}
            </div>

            {/* Status */}
            <div className="mb-3">
              {staffData?.isActive ? (
                <Tag
                  icon={<CheckCircleOutlined />}
                  color="success"
                  className="text-xs sm:text-sm"
                >
                  Active
                </Tag>
              ) : (
                <Tag
                  icon={<CloseCircleOutlined />}
                  color="error"
                  className="text-xs sm:text-sm"
                >
                  Inactive
                </Tag>
              )}
              
              {staffData?.isVerified && (
                <Tag
                  icon={<SafetyCertificateOutlined />}
                  color="cyan"
                  className="text-xs sm:text-sm ml-2"
                >
                  Verified
                </Tag>
              )}
              
              {staffData?.status && staffData.status !== "active" && (
                <Tag
                  color="orange"
                  className="text-xs sm:text-sm ml-2"
                >
                  {staffData.status}
                </Tag>
              )}
            </div>

            {/* Capabilities */}
            {capabilities.length > 0 && (
              <div className="mb-4">
                <Text type="secondary" className="text-xs sm:text-sm">
                  <strong>Capabilities:</strong> {capabilities.join(", ")}
                </Text>
              </div>
            )}

            {/* Action Buttons */}
            {(isAdminOrHr || isSuperOrAdmin) && (
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <UpdateUserPositionAndRole userId={id} userData={staffData} />
                <UpdateUserPrivileges userId={id} userData={staffData} />
              </div>
            )}
          </div>
        </div>

        {/* Effective Roles Summary */}
        {effectiveRoles.length > 1 && (
          <Alert
            message="Multi-Role User"
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
      </div>
    </Card>
  );

  const renderContactDetails = () => (
    <Card
      title={
        <Space className="text-sm sm:text-base">
          <UserOutlined className="text-blue-600" />
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
              <MailOutlined className="text-blue-600" />
              <span className="text-xs sm:text-sm">Email</span>
            </Space>
          }
        >
          <Text className="text-xs sm:text-sm break-all">
            {staffData?.email}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space size="small">
              <PhoneOutlined className="text-green-600" />
              <span className="text-xs sm:text-sm">Phone</span>
            </Space>
          }
        >
          <Text className="text-xs sm:text-sm">
            {staffData?.phone || "Not provided"}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space size="small">
              <HomeOutlined className="text-orange-600" />
              <span className="text-xs sm:text-sm">Address</span>
            </Space>
          }
          span={2}
        >
          <Text className="text-xs sm:text-sm">
            {staffData?.address || "Not provided"}
          </Text>
        </Descriptions.Item>

        {staffData?.gender && (
          <Descriptions.Item
            label={
              <Space size="small">
                <UserOutlined className="text-purple-600" />
                <span className="text-xs sm:text-sm">Gender</span>
              </Space>
            }
          >
            <Text className="text-xs sm:text-sm capitalize">
              {staffData.gender}
            </Text>
          </Descriptions.Item>
        )}

        {staffData?.dateOfBirth && (
          <Descriptions.Item
            label={
              <Space size="small">
                <CalendarOutlined className="text-pink-600" />
                <span className="text-xs sm:text-sm">Date of Birth</span>
              </Space>
            }
          >
            <Text className="text-xs sm:text-sm">
              {formatDate(staffData.dateOfBirth)}
            </Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Bio */}
      {staffData?.bio && (
        <>
          <Divider className="my-4" />
          <div>
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
              {staffData.bio}
            </Paragraph>
          </div>
        </>
      )}
    </Card>
  );

  const renderAdditionalRoles = () => {
    if (!staffData?.additionalRoles || staffData.additionalRoles.length === 0) 
      return null;

    return (
      <Card
        title={
          <Space className="text-sm sm:text-base">
            <TeamOutlined className="text-indigo-600" />
            <span>Additional Roles & Privileges</span>
          </Space>
        }
        className="mb-4 sm:mb-6 shadow-md"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {staffData.additionalRoles.map((role, index) => (
              <Tag key={index} color="indigo" className="px-3 py-1 text-xs sm:text-sm">
                {role}
              </Tag>
            ))}
          </div>
          
          <Text type="secondary" className="text-xs sm:text-sm block">
            <InfoCircleOutlined className="mr-1" />
            This user has multiple role assignments beyond their primary role.
          </Text>
        </div>
      </Card>
    );
  };

  const renderProfessionalInfo = () => {
    const hasLawyerDetails = 
      staffData?.isLawyer || 
      staffData?.role === "lawyer" || 
      staffData?.userType === "lawyer" || 
      staffData?.lawyerDetails;
    
    const hasStaffDetails = staffData?.staffDetails;

    if (!hasLawyerDetails && !hasStaffDetails && !staffData?.adminDetails) 
      return null;

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
        {hasLawyerDetails && staffData.lawyerDetails && (
          <>
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
                {staffData.lawyerDetails.barNumber && (
                  <Descriptions.Item
                    label={<span className="text-xs sm:text-sm">Bar Number</span>}
                  >
                    <Text className="text-xs sm:text-sm">
                      {staffData.lawyerDetails.barNumber}
                    </Text>
                  </Descriptions.Item>
                )}

                {staffData.lawyerDetails.yearOfCall && (
                  <Descriptions.Item
                    label={<span className="text-xs sm:text-sm">Year of Call</span>}
                  >
                    <Text className="text-xs sm:text-sm">
                      {formatDate(staffData.lawyerDetails.yearOfCall)}
                    </Text>
                  </Descriptions.Item>
                )}

                {staffData.lawyerDetails.practiceAreas &&
                  staffData.lawyerDetails.practiceAreas.length > 0 && (
                    <Descriptions.Item
                      label={<span className="text-xs sm:text-sm">Practice Areas</span>}
                      span={2}
                    >
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {staffData.lawyerDetails.practiceAreas.map((area) => (
                          <Tag key={area} color="purple" className="text-xs">
                            {area}
                          </Tag>
                        ))}
                      </div>
                    </Descriptions.Item>
                  )}

                {staffData.lawyerDetails.specialization && (
                  <Descriptions.Item
                    label={<span className="text-xs sm:text-sm">Specialization</span>}
                    span={2}
                  >
                    <Text className="text-xs sm:text-sm">
                      {staffData.lawyerDetails.specialization}
                    </Text>
                  </Descriptions.Item>
                )}
                
                {staffData.lawyerDetails.hourlyRate && (
                  <Descriptions.Item
                    label={<span className="text-xs sm:text-sm">Hourly Rate</span>}
                  >
                    <Text className="text-xs sm:text-sm">
                      ${staffData.lawyerDetails.hourlyRate}/hour
                    </Text>
                  </Descriptions.Item>
                )}
                
                {staffData.lawyerDetails.isPartner && (
                  <Descriptions.Item
                    label={<span className="text-xs sm:text-sm">Partnership Status</span>}
                  >
                    <Tag color="gold" className="text-xs">
                      Partner
                      {staffData.lawyerDetails.partnershipPercentage && 
                        ` (${staffData.lawyerDetails.partnershipPercentage}%)`
                      }
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Education */}
              {(staffData.lawyerDetails.lawSchool?.name ||
                staffData.lawyerDetails.undergraduateSchool?.name) && (
                <>
                  <Divider className="my-3" />
                  <Space className="mb-2">
                    <BookOutlined className="text-blue-600" />
                    <Text strong className="text-xs sm:text-sm">
                      Education
                    </Text>
                  </Space>

                  <div className="space-y-2">
                    {staffData.lawyerDetails.undergraduateSchool?.name && (
                      <div className="text-xs sm:text-sm">
                        <Text strong>University: </Text>
                        <Text>
                          {staffData.lawyerDetails.undergraduateSchool.name}
                          {staffData.lawyerDetails.undergraduateSchool
                            .graduationYear &&
                            ` (${staffData.lawyerDetails.undergraduateSchool.graduationYear})`}
                        </Text>
                      </div>
                    )}

                    {staffData.lawyerDetails.lawSchool?.name && (
                      <div className="text-xs sm:text-sm">
                        <Text strong>Law School: </Text>
                        <Text>
                          {staffData.lawyerDetails.lawSchool.name}
                          {staffData.lawyerDetails.lawSchool.graduationYear &&
                            ` (${staffData.lawyerDetails.lawSchool.graduationYear})`}
                        </Text>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Staff Details */}
        {hasStaffDetails && staffData.staffDetails && (
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
              {staffData.staffDetails.employeeId && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Employee ID</span>}
                >
                  <Text code className="text-xs sm:text-sm">
                    {staffData.staffDetails.employeeId}
                  </Text>
                </Descriptions.Item>
              )}

              {staffData.staffDetails.department && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Department</span>}
                >
                  <Tag color="blue" className="text-xs">
                    {staffData.staffDetails.department}
                  </Tag>
                </Descriptions.Item>
              )}

              {staffData.staffDetails.designation && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Designation</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {staffData.staffDetails.designation}
                  </Text>
                </Descriptions.Item>
              )}

              {staffData.staffDetails.employmentType && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Employment Type</span>}
                >
                  <Tag color="green" className="text-xs capitalize">
                    {staffData.staffDetails.employmentType}
                  </Tag>
                </Descriptions.Item>
              )}

              {staffData.staffDetails.workSchedule && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Work Schedule</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {staffData.staffDetails.workSchedule}
                  </Text>
                </Descriptions.Item>
              )}

              {staffData.staffDetails.dateOfJoining && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Date Joined</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    {formatDate(staffData.staffDetails.dateOfJoining)}
                  </Text>
                </Descriptions.Item>
              )}
              
              {staffData.staffDetails.reportingTo && (
                <Descriptions.Item
                  label={<span className="text-xs sm:text-sm">Reports To</span>}
                >
                  <Text className="text-xs sm:text-sm">
                    Manager
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Skills */}
            {staffData.staffDetails.skills &&
              staffData.staffDetails.skills.length > 0 && (
                <>
                  <Divider className="my-3" />
                  <div>
                    <Text strong className="block mb-2 text-xs sm:text-sm">
                      Skills
                    </Text>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {staffData.staffDetails.skills.map((skill, index) => (
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

        {/* Admin Details */}
        {staffData?.adminDetails && (
          <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
            <Space className="mb-3">
              <CrownOutlined className="text-orange-600 text-lg" />
              <Text strong className="text-sm sm:text-base">
                Administrative Privileges
              </Text>
            </Space>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {staffData.adminDetails.canManageUsers && (
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text className="text-xs sm:text-sm">User Management</Text>
                </div>
              )}
              {staffData.adminDetails.canManageCases && (
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text className="text-xs sm:text-sm">Case Management</Text>
                </div>
              )}
              {staffData.adminDetails.canManageBilling && (
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text className="text-xs sm:text-sm">Billing Management</Text>
                </div>
              )}
              {staffData.adminDetails.canViewReports && (
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text className="text-xs sm:text-sm">Report Access</Text>
                </div>
              )}
              
              {staffData.adminDetails.adminLevel && (
                <div className="col-span-full mt-2">
                  <Text strong className="text-xs sm:text-sm">Admin Level: </Text>
                  <Tag color="blue" className="text-xs ml-2">
                    {staffData.adminDetails.adminLevel}
                  </Tag>
                </div>
              )}
              
              {staffData.adminDetails.systemAccessLevel && (
                <div className="col-span-full mt-1">
                  <Text strong className="text-xs sm:text-sm">Access Level: </Text>
                  <Tag color="green" className="text-xs ml-2">
                    {staffData.adminDetails.systemAccessLevel}
                  </Tag>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderUserTypeSpecificInfo = () => {
    if (!staffData?.userType) return null;
    
    switch (staffData.userType) {
      case "client":
        return (
          <Card
            title="Client Information"
            className="mb-4 sm:mb-6 shadow-md"
          >
            <Alert
              message="Client Profile"
              description="This is a client account. Different information would be displayed here."
              type="info"
              showIcon
            />
          </Card>
        );
      case "lawyer":
      case "admin":
      case "super-admin":
      case "staff":
      default:
        return (
          <>
            {renderProfessionalInfo()}
            {renderAdditionalRoles()}
          </>
        );
    }
  };

  // Determine what the current user can view
  const canViewFullDetails = isAdminOrHr || isSuperOrAdmin || isCurrentUser;
  const canViewProfessionalInfo = 
    canViewFullDetails || 
    hasRole("staff") || 
    hasRole("lawyer") || 
    (currentUserIsLawyer && staffData?.userType === "staff");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Alert
          message="User Not Found"
          description="The requested staff member could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {renderProfileHeader()}

        <div className="space-y-4 sm:space-y-6">
          {/* Everyone can see contact details */}
          {renderContactDetails()}

          {/* Show type-specific information based on permissions */}
          {canViewFullDetails ? (
            <>
              {renderUserTypeSpecificInfo()}
              <LeaveBalanceDisplay userId={id} />
            </>
          ) : canViewProfessionalInfo ? (
            <>
              {renderProfessionalInfo()}
              <Alert
                message="Limited Access"
                description="You can view professional information but some details are restricted."
                type="info"
                showIcon
                className="mt-4"
              />
            </>
          ) : (
            <Alert
              message="Restricted Access"
              description="You don't have permission to view detailed staff information."
              type="warning"
              showIcon
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetails;