import PropTypes from "prop-types";
import { Table } from "antd";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { count, parties } = payload[0].payload;

    const dataSource = [
      {
        key: "1",
        detail: "Number of cases:",
        value: count,
      },
      ...parties.map((party, index) => ({
        key: `party-${index}`,
        detail: "Party:",
        value: party,
      })),
    ];

    const columns = [
      {
        title: "Detail",
        dataIndex: "detail",
        key: "detail",
      },
      {
        title: "Value",
        dataIndex: "value",
        key: "value",
      },
    ];

    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: "#fff",
          padding: "10px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderRadius: "4px",
        }}>
        <h4>Year: {label}</h4>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          size="small"
        />
      </div>
    );
  }

  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        count: PropTypes.number,
        parties: PropTypes.arrayOf(PropTypes.string),
      }),
    })
  ),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CustomTooltip;
