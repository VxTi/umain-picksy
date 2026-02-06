import { useState } from "react";
import EditingSettingsBar from "./EditingSettingsBar";
import { PhotoComponent } from "./PhotoComponent";

export default function EditingScreen() {
  const [brightness, setBrightness] = useState(100);
  const [blur, setBlur] = useState(0);
  const [saturation, setSaturation] = useState(100);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div
        style={{
          width: "70%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <PhotoComponent src="/photo_to_edit.jpeg" alt="logo" brightness={brightness} blur={blur} saturation={saturation} />
      </div>

      <div style={{ width: "30%", height: "100%", overflow: "auto" }}>
        <EditingSettingsBar
          brightness={brightness}
          saturation={saturation}
          blur={blur}
          onBrightnessChange={(v) => {
            setBrightness(v);
          }}
          onSaturationChange={(v) => {
            setSaturation(v);
          }}
          onBlurChange={(v) => {
            setBlur(v);
          }}
        />
      </div>
    </div>
  );
}