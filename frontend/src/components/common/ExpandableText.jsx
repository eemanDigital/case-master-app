import { Typography } from "antd";
import PropTypes from "prop-types";

const ExpandableText = ({ children, rows = 3, className = "" }) => {
  if (!children) return <span className="text-gray-400">-</span>;

  return (
    <Typography.Paragraph
      className={`mb-0 break-words whitespace-pre-wrap ${className}`}
      ellipsis={{
        rows,
        expandable: true,
        symbol: (expanded) => (expanded ? "Show less" : "Show more"),
      }}>
      {children}
    </Typography.Paragraph>
  );
};

ExpandableText.propTypes = {
  children: PropTypes.node,
  rows: PropTypes.number,
  className: PropTypes.string,
};

export default ExpandableText;
