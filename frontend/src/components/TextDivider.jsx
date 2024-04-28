import { Divider, Typography } from "antd";
// import DeleteI
export default function TextDivider({ text }) {
  return (
    <Divider orientation="left" orientationMargin="0">
      <Typography>{text}</Typography>
    </Divider>
  );
}
