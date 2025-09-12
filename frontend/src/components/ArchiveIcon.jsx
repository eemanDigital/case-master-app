import { Tooltip } from "antd";
import { Link } from "react-router-dom";
import { FaArchive } from "react-icons/fa";

function ArchiveIcon({ toolTipName, link }) {
  return (
    <div>
      <Tooltip title={toolTipName}>
        <Link to={link}>
          <FaArchive size={14} className=" text-gray-600" />
        </Link>
      </Tooltip>
    </div>
  );
}

export default ArchiveIcon;
