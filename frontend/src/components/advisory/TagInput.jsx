import React, { useState, useCallback } from "react";
import { Input, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const TagInput = ({ value = [], onChange, placeholder, maxTags = 20 }) => {
  const [inputValue, setInputValue] = useState("");
  const [inputVisible, setInputVisible] = useState(false);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputConfirm = useCallback(() => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setInputValue("");
      return;
    }

    if (value.includes(trimmed)) {
      message.warning("This tag already exists");
      setInputValue("");
      return;
    }

    if (value.length >= maxTags) {
      message.warning(`Maximum ${maxTags} tags allowed`);
      setInputValue("");
      return;
    }

    onChange([...value, trimmed]);
    setInputValue("");
    setInputVisible(false);
  }, [inputValue, value, onChange, maxTags]);

  const handleClose = useCallback(
    (removedTag) => {
      onChange(value.filter((tag) => tag !== removedTag));
    },
    [value, onChange],
  );

  const showInput = useCallback(() => {
    setInputVisible(true);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
      }}>
      {value.map((tag) => (
        <Tag
          key={tag}
          closable
          onClose={() => handleClose(tag)}
          style={{
            userSelect: "none",
            fontSize: "13px",
            padding: "4px 8px",
            borderRadius: "4px",
          }}>
          {tag}
        </Tag>
      ))}

      {inputVisible ? (
        <Input
          type="text"
          size="small"
          style={{ width: 200 }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
          placeholder={placeholder}
          autoFocus
        />
      ) : (
        <Tag
          onClick={showInput}
          style={{
            background: "#fff",
            borderStyle: "dashed",
            cursor: "pointer",
            fontSize: "13px",
            padding: "4px 8px",
          }}>
          <PlusOutlined /> Add {placeholder?.replace("Add ", "")}
        </Tag>
      )}
    </div>
  );
};

export default React.memo(TagInput);
