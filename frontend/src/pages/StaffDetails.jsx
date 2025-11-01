import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, Divider, Row, Col, Typography, Avatar, Space, Tag } from "antd";
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
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook } from "../hooks/useAdminHook";
import { formatDate } from "../utils/formatDate";
import UpdateUserPositionAndRole from "./UpdateUserPositionAndRole";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import PageErrorAlert from "../components/PageErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Title, Text, Paragraph } = Typography;

const StaffDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const loggedInClientId = user?.data?._id;
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isAdminOrHr } = useAdminHook();
  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    if (id) {
      dataFetcher(`users/${id}`, "GET");
    }
  }, [id, dataFetcher]);

  const isCurrentUser = loggedInClientId === id;

  const renderProfileSection = () => (
    <Card className="mb-6 shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white to-blue-50/30">
      <div className="p-6">
        <GoBackButton />
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mt-4">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar
                size={140}
                src={data?.data?.photo}
                icon={<UserOutlined />}
                className="shadow-2xl border-4 border-white ring-4 ring-blue-100"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <Title
                  level={1}
                  className="!mb-2 !text-3xl font-bold text-gray-900">
                  {`${data?.data?.firstName} ${data?.data?.lastName}`}
                </Title>
                <div className="flex flex-wrap gap-2">
                  <Tag className="px-3 py-1.5 text-sm font-semibold bg-blue-100 text-blue-800 border-0 rounded-full">
                    {data?.data?.role}
                  </Tag>
                  <Tag className="px-3 py-1.5 text-sm font-semibold bg-green-100 text-green-800 border-0 rounded-full">
                    {data?.data?.position}
                  </Tag>
                </div>
              </div>
            </div>

            <Divider className="!my-4" />

            {/* Action Buttons */}
            {isAdminOrHr && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <UpdateUserPositionAndRole userId={id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderPersonalInformation = () => (
    <Card className="mb-6 shadow-xl rounded-2xl border-0 hover:shadow-2xl transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <IdcardOutlined className="text-purple-600 text-lg" />
          </div>
          <div>
            <Title
              level={3}
              className="!mb-0 !text-xl font-semibold text-gray-900">
              Professional Information
            </Title>
            <Text className="text-gray-500 text-sm">
              Legal qualifications and practice details
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Year of Call */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <CalendarOutlined className="text-blue-600 text-lg mt-1 flex-shrink-0" />
            <div>
              <Text strong className="text-gray-700 block mb-1">
                Year of Call
              </Text>
              <Text className="text-gray-900 font-medium">
                {formatDate(data?.data?.yearOfCall) || "Not specified"}
              </Text>
            </div>
          </div>

          {/* University */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <BookOutlined className="text-green-600 text-lg mt-1 flex-shrink-0" />
            <div>
              <Text strong className="text-gray-700 block mb-1">
                University
              </Text>
              <Text className="text-gray-900 font-medium">
                {data?.data?.universityAttended || "Not specified"}
              </Text>
            </div>
          </div>

          {/* Law School */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <BankOutlined className="text-orange-600 text-lg mt-1 flex-shrink-0" />
            <div>
              <Text strong className="text-gray-700 block mb-1">
                Law School
              </Text>
              <Text className="text-gray-900 font-medium">
                {data?.data?.lawSchoolAttended || "Not specified"}
              </Text>
            </div>
          </div>

          {/* Practice Area */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <TeamOutlined className="text-purple-600 text-lg mt-1 flex-shrink-0" />
            <div>
              <Text strong className="text-gray-700 block mb-1">
                Practice Area
              </Text>
              <Text className="text-gray-900 font-medium">
                {data?.data?.practiceArea || "Not specified"}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderContactDetails = () => (
    <Card className="mb-6 shadow-xl rounded-2xl border-0 hover:shadow-2xl transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <UserOutlined className="text-blue-600 text-lg" />
          </div>
          <div>
            <Title
              level={3}
              className="!mb-0 !text-xl font-semibold text-gray-900">
              Contact Details
            </Title>
            <Text className="text-gray-500 text-sm">
              Personal and professional contact information
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <MailOutlined className="text-blue-600 text-lg mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <Text strong className="text-gray-700 block mb-1">
                Email Address
              </Text>
              <Text className="text-gray-900 font-medium break-words">
                {data?.data?.email}
              </Text>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <PhoneOutlined className="text-green-600 text-lg mt-1 flex-shrink-0" />
            <div>
              <Text strong className="text-gray-700 block mb-1">
                Phone Number
              </Text>
              <Text className="text-gray-900 font-medium">
                {data?.data?.phone || "Not specified"}
              </Text>
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2 flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <HomeOutlined className="text-orange-600 text-lg mt-1 flex-shrink-0" />
            <div className="flex-1">
              <Text strong className="text-gray-700 block mb-1">
                Address
              </Text>
              <Text className="text-gray-900 font-medium">
                {data?.data?.address || "Not specified"}
              </Text>
            </div>
          </div>

          {/* Bio */}
          {data?.data?.bio && (
            <div className="md:col-span-2">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <Text strong className="text-gray-700 block mb-3">
                  Professional Bio
                </Text>
                <Paragraph
                  ellipsis={{
                    rows: 4,
                    expandable: true,
                    symbol: (expanded) =>
                      expanded ? "Show less" : "Read more",
                  }}
                  className="text-gray-700 leading-relaxed">
                  {data?.data?.bio}
                </Paragraph>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4">
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4">
      <div className="max-w-6xl mx-auto">
        {renderProfileSection()}

        <div className="space-y-6">
          {isAdminOrHr || isCurrentUser ? (
            <>
              {renderPersonalInformation()}
              {renderContactDetails()}
              <LeaveBalanceDisplay userId={id} />
            </>
          ) : (
            renderPersonalInformation()
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetails;
