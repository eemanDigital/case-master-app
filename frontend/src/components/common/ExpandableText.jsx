import { useState } from "react";
import { Typography } from "antd";
import PropTypes from "prop-types";

const ExpandableText = ({ children, rows = 3, className = "" }) => {
  const [expanded, setExpanded] = useState(false);

  if (!children) return <span className="text-gray-400">-</span>;

  return (
    <Typography.Paragraph
      className={`mb-0 break-words whitespace-pre-wrap ${className}`}
      style={
        expanded
          ? { maxHeight: "12rem", overflowY: "auto", paddingRight: "0.5rem" }
          : undefined
      }
      ellipsis={{
        rows,
        expandable: true,
        symbol: (expanded) => (expanded ? "Show less" : "Show more"),
        onExpand: (_, { expanded: isExpanded }) => setExpanded(isExpanded),
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
