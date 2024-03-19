// import { CiFileOn } from "react-icons/ci";
import { GrTask } from "react-icons/gr";
import { FaRegFolderOpen, FaRegFileAlt } from "react-icons/fa";

const SummaryFeatures = () => {
  let divStyle = "flex flex-col mb-6 items-center justify-center gap-5 ";
  let svgStyle = " text-4xl text-slate-300 ";
  let svgDivStyle = "rounded-full p-5 bg-slate-500 ";
  let textStyle = "text-slate-300 text-[14px] tracking-wider ";

  return (
    <div className="sm:flex gap-6 items-center justify-center p-3">
      <div className={divStyle}>
        <div className={svgDivStyle}>
          <FaRegFileAlt className={svgStyle} />
        </div>
        <p className={textStyle}> Organize your file seamlessly</p>
      </div>
      <div className={divStyle}>
        <div className={svgDivStyle}>
          <GrTask className={svgStyle} />
        </div>
        <p className={textStyle}>Assign Task easily</p>
      </div>
      <div className={divStyle}>
        <div className={svgDivStyle}>
          <FaRegFolderOpen className={svgStyle} />
        </div>
        <p className={textStyle}> Store file effortlessly</p>
      </div>
    </div>
  );
};

export default SummaryFeatures;
