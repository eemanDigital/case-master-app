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

  //decode text before transforming  it to html element.
  const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  // shorten text
  const shortenText = (htmlText, maxLength, id) => {
    const decodedText = decodeHtml(htmlText); // Decode HTML
    const isFullTextShown = showFullText[id];

    if (!isFullTextShown && decodedText.length > maxLength) {
      return (
        <span>
          <span
            dangerouslySetInnerHTML={{
              __html: `${decodedText.substring(0, maxLength)}...`,
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
          <span dangerouslySetInnerHTML={{ __html: decodedText }} />
          {decodedText.length > maxLength && (
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
