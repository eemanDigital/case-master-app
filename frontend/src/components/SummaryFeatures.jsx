import {
  FaBriefcase,
  FaCalendarAlt,
  FaChartLine,
  FaLock,
} from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";
import FeatureCard from "./FeatureCard";

const SummaryFeatures = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FaBriefcase />}
            title="Case Organization"
            description="Easily organize and access all your case files in one place."
          />
          <FeatureCard
            icon={<FaCalendarAlt />}
            title="Scheduling"
            description="Manage appointments, court dates, and deadlines efficiently."
          />
          <FeatureCard
            icon={<HiDocumentText />}
            title="Document Management"
            description="Create, edit, and share legal documents seamlessly."
          />
          <FeatureCard
            icon={<FaChartLine />}
            title="Performance Tracking"
            description="Monitor case progress and firm performance with insightful analytics."
          />
          <FeatureCard
            icon={<FaLock />}
            title="Secure Data"
            description="Keep your client information safe with advanced security measures."
          />
        </div>
      </div>
    </section>
  );
};

export default SummaryFeatures;
