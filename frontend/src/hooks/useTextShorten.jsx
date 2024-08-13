import { useState } from "react";

const useTextShorten = () => {
  const [showFullText, setShowFullText] = useState({}); // State to manage update display

  // handle update text shortening
  const toggleShowFullText = (id) => {
    setShowFullText((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  // shorten text
  const shortenText = (htmlText, maxLength, id) => {
    const isFullTextShown = showFullText[id];
    if (!isFullTextShown && htmlText?.length > maxLength) {
      return (
        <span>
          <span
            dangerouslySetInnerHTML={{
              __html: `${htmlText.substring(0, maxLength)}...`,
            }}
          />
          <button
            onClick={() => toggleShowFullText(id)}
            style={{
              marginLeft: "5px",
              color: "blue",
              cursor: "pointer",
              background: "none",
              border: "none",

              textDecoration: "underline",
            }}>
            Read More
          </button>
        </span>
      );
    } else {
      return (
        <span>
          <span dangerouslySetInnerHTML={{ __html: htmlText }} />
          {htmlText?.length > maxLength && (
            <button
              onClick={() => toggleShowFullText(id)}
              style={{
                marginLeft: "5px",
                color: "blue",
                cursor: "pointer",
                background: "none",
                border: "none",
                textDecoration: "underline",
              }}>
              Show Less
            </button>
          )}
        </span>
      );
    }
  };
  return { shortenText };
};

export default useTextShorten;
