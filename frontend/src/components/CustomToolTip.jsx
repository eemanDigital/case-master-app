// import PropTypes from "prop-types";
// import { Table } from "antd";

// const CustomTooltip = ({ active, payload, label }) => {
//   if (active && payload && payload.length) {
//     const { count, parties } = payload[0].payload;

//     const dataSource = [
//       {
//         key: "1",
//         detail: "Number of cases:",
//         value: count,
//       },
//       ...parties.map((party, index) => ({
//         key: `party-${index}`,
//         detail: "Party:",
//         value: party,
//       })),
//     ];

//     const columns = [
//       {
//         title: "Detail",
//         dataIndex: "detail",
//         key: "detail",
//       },
//       {
//         title: "Value",
//         dataIndex: "value",
//         key: "value",
//       },
//     ];

//     return (
//       <div
//         className="custom-tooltip"
//         style={{
//           backgroundColor: "#fff",
//           padding: "10px",
//           border: "1px solid #ccc",
//           boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//           borderRadius: "4px",
//         }}>
//         <h4>Year: {label}</h4>
//         <Table
//           dataSource={dataSource}
//           columns={columns}
//           pagination={false}
//           size="small"
//         />
//       </div>
//     );
//   }

//   return null;
// };

// CustomTooltip.propTypes = {
//   active: PropTypes.bool,
//   payload: PropTypes.arrayOf(
//     PropTypes.shape({
//       payload: PropTypes.shape({
//         count: PropTypes.number,
//         parties: PropTypes.arrayOf(PropTypes.string),
//       }),
//     })
//   ),
//   label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
// };

// export default CustomTooltip;
import PropTypes from "prop-types";
import { Table } from "antd";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const payloadData = payload[0].payload;

    // ✅ Safe data extraction with fallbacks
    const count = payloadData?.count || 0;
    const parties = Array.isArray(payloadData?.parties)
      ? payloadData.parties
      : [];
    const year = payloadData?.year || label;

    // ✅ Create safe data source
    const dataSource = [
      {
        key: "count",
        detail: "Number of cases:",
        value: count,
      },
      ...parties.slice(0, 5).map((party, index) => ({
        // Limit to 5 parties max
        key: `party-${index}`,
        detail: "Case:",
        value: party || "Unknown case",
      })),
    ];

    // Add "more cases" indicator if there are more than 5 parties
    if (parties.length > 5) {
      dataSource.push({
        key: "more",
        detail: "And",
        value: `${parties.length - 5} more cases...`,
      });
    }

    const columns = [
      {
        title: "Detail",
        dataIndex: "detail",
        key: "detail",
        width: 80,
      },
      {
        title: "Value",
        dataIndex: "value",
        key: "value",
        render: (text) => (
          <span
            style={{
              wordBreak: "break-word",
              maxWidth: "200px",
              display: "block",
            }}>
            {text}
          </span>
        ),
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
          maxWidth: "300px",
        }}>
        <h4 style={{ marginBottom: "10px", fontSize: "14px" }}>
          {year ? `Year: ${year}` : "Case Details"}
        </h4>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          size="small"
          showHeader={false}
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
        year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    })
  ),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

CustomTooltip.defaultProps = {
  active: false,
  payload: [],
  label: "",
};

export default CustomTooltip;
