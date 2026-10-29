import { ImageResponse } from "next/og";
export const alt =
  "Genie 4 AI — A world beyond the frame. Independent World Labs studio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#0c090a",
        color: "#f7f2ef",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "70px",
        borderBottom: "12px solid #e94b40",
      }}
    >
      <div
        style={{
          color: "#ee675c",
          fontSize: 24,
          letterSpacing: 6,
          display: "flex",
        }}
      >
        GENIE 4 AI / WORLD CREATION STUDIO
      </div>
      <div
        style={{
          fontSize: 94,
          letterSpacing: -5,
          lineHeight: 1.05,
          marginTop: 70,
          display: "flex",
        }}
      >
        A world beyond
        <br />
        the frame.
      </div>
      <div
        style={{
          fontSize: 23,
          color: "#c2b5b2",
          marginTop: "auto",
          display: "flex",
        }}
      >
        Image & text to 3D worlds · Independent World Labs Marble studio
      </div>
    </div>,
    size,
  );
}
