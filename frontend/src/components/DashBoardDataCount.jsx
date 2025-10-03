import React from "react";
import PropTypes from "prop-types";
import { FaBriefcase, FaUsers, FaHandshake } from "react-icons/fa";
import { GoLaw } from "react-icons/go";

const DashboardCard = ({ icon: Icon, count, label, color }) => (
  <div
    className={`bg-gradient-to-r ${color} p-4 rounded-lg shadow-md flex items-center justify-between`}>
    <div className="flex items-center">
      <Icon className="text-2xl sm:text-3xl text-white opacity-80 mr-2 sm:mr-3" />
      <div>
        <h4 className="text-lg sm:text-xl font-bold text-white">{count}</h4>
        <p className="text-xs sm:text-sm text-white">{label}</p>
      </div>
    </div>
  </div>
);

const DashBoardDataCount = ({ cases, staff, lawyerCount, clientCount }) => {
  const cardData = [
    {
      icon: FaBriefcase,
      count: cases?.pagination.count || 0,
      label: "Number of Cases",
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: FaUsers,
      count: staff,
      label: "Number of Staff",
      color: "from-green-400 to-green-600",
    },
    {
      icon: GoLaw,
      count: lawyerCount,
      label: "Number of Lawyers",
      color: "from-yellow-400 to-yellow-600",
    },
    {
      icon: FaHandshake,
      count: clientCount,
      label: "Number of Clients",
      color: "from-red-400 to-red-600",
    },
  ];

  return (
    <div className="container mx-auto py-2  ">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
        {cardData.map((card, index) => (
          <DashboardCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

DashBoardDataCount.propTypes = {
  cases: PropTypes.shape({
    pagination: PropTypes.shape({
      count: PropTypes.number,
    }),
  }),

  staff: PropTypes.number.isRequired,
  lawyerCount: PropTypes.number.isRequired,
  clientCount: PropTypes.number.isRequired,
};

export default DashBoardDataCount;
