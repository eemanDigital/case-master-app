import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
// import axios from "axios";

const Cases = () => {
  // const [cases, setCases] = useState([]);

  const { data, authenticate } = useAuth();

  console.log(data);

  // console.log(cases);
  // map over data
  // const caseData = cases.map((casedetail, index) => {
  //   // console.log(casedetail.firstParty.name[0]);
  //   return (
  //     <div key={index}>
  //       <Link>
  //         <ul>
  //           {casedetail.firstParty.name.map((fname) => (
  //             <li key={fname}>
  //               {fname} vs.{" "}
  //               {casedetail.secondParty.name.map((secName) => {
  //                 return <li key={secName}>{secName}</li>;
  //               })}
  //             </li>
  //           ))}
  //         </ul>
  //       </Link>
  //     </div>
  //   );
  // });

  // fetch case data
  useEffect(() => {
    authenticate("cases");
    // axios
    //   .get("http://localhost:3000/api/v1/cases")
    //   .then((response) => setCases(response.data.data))
    //   .catch((err) => console.log(err));

    // console.log(res);
  }, []);

  return (
    <section className={` `}>
      {/* <h1 className="text-4xl">{caseData}</h1> */}
    </section>
  );
};

export default Cases;
