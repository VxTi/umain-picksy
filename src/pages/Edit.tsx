import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import EditingSettingsBar from "./EditingSettingsBar";
import { PhotoComponent } from "./PhotoComponent";
import type { ImageItem } from "./Gallery";

function Edit() {
  const location = useLocation();
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageItem[]>(
    (location.state?.images as ImageItem[]) || []
  );

  // Listen for images from the gallery window via events
  useEffect(() => {
    const unlisten = listen<ImageItem[]>("edit-images", (event) => {
      setImages(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

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

  const handleSave = () => {
    const payload = {
      imageId: image.id,
      edits: {
        brightness,
        blur,
        saturation,
      },
      timestamp: new Date().toISOString(),
    };
    console.log("Edits " + payload.edits.blur + " " + payload.edits.brightness + " " + payload.edits.saturation)
  }

  return (
    <main className="max-h-screen bg-background flex flex-col">
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
        <div className="w-[30%] h-[80%] overflow-auto">
          <EditingSettingsBar
            brightness={brightness}
            saturation={saturation}
            blur={blur}
            onBrightnessChange={setBrightness}
            onSaturationChange={setSaturation}
            onBlurChange={setBlur}
          />
        </div>

        <button
          onClick={handleSave}
          className="
            fixed bottom-6 right-6
            px-8 py-3
            rounded-full
            font-semibold text-white
            bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
            shadow-lg shadow-purple-500/30
            hover:scale-105 hover:shadow-xl
            active:scale-95
            transition-all duration-200
            backdrop-blur-md
          ">
          Save edits
        </button>
      </div>
    </main>
  );
}

export default Edit;