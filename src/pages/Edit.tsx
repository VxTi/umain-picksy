import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import EditingSettingsBar from "./EditingSettingsBar";
import { PhotoComponent } from "./PhotoComponent";
import type { ImageItem } from "./Gallery";

function Edit() {
  const location = useLocation();
  const navigate = useNavigate();
  const images = (location.state?.images as ImageItem[]) || [];

  // editing state
  const [brightness, setBrightness] = useState(100);
  const [blur, setBlur] = useState(0);
  const [saturation, setSaturation] = useState(100);

  // fallback mock image if nothing selected
  const image =
    images[0] ??
    ({
      id: "mock",
      title: "Mock image",
      url: "/photo_to_edit.jpeg",
    } as ImageItem);

  return (
    <main className="max-h-screen bg-background flex flex-col">
      <TopBar title="Edit Page" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {images.length > 0
              ? `${images.length} image(s) selected for editing`
              : "No images selected — showing mock image"}
          </p>

          {images.length === 0 && (
            <Button variant="outline" onClick={() => navigate("/gallery")}>
              Go to Gallery
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Image Preview */}
        <div className="w-[70%] flex justify-center items-center overflow-hidden">
          <PhotoComponent
            src={image.url}
            alt={image.title}
            brightness={brightness}
            blur={blur}
            saturation={saturation}
          />
        </div>

        {/* Settings Sidebar */}
        <div className="w-[30%] h-full overflow-auto">
          <EditingSettingsBar
            brightness={brightness}
            saturation={saturation}
            blur={blur}
            onBrightnessChange={setBrightness}
            onSaturationChange={setSaturation}
            onBlurChange={setBlur}
          />
        </div>
      </div>
    </main>
  );
}

export default Edit;