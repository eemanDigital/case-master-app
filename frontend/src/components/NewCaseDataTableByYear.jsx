import { Table, Card } from "antd";

const NewCaseDataTableByYear = ({ data }) => {
  const tableData = data?.flatMap((item, index) =>
    item.parties.map((party, idx) => ({
      key: `${index}-${idx}`,
      year: item.year,
      party,
    }))
  );

  const columns = [
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
    },
    {
      title: "Parties",
      dataIndex: "party",
      key: "party",
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={tableData}
        className="w-[500px]"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 600 }}
      />
    </div>
  );
};

export default NewCaseDataTableByYear;
