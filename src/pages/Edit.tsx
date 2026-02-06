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

  // editing state for image 1
  const [brightness1, setBrightness1] = useState(100);
  const [blur1, setBlur1] = useState(0);
  const [saturation1, setSaturation1] = useState(100);

  // editing state for image 2
  const [brightness2, setBrightness2] = useState(100);
  const [blur2, setBlur2] = useState(0);
  const [saturation2, setSaturation2] = useState(100);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const image1 = images[0];
  const image2 = images[1];

  const handleSave = () => {
    if (image1) {
      console.log(`Image 1 (${image1.id}) edits: blur=${blur1}, brightness=${brightness1}, saturation=${saturation1}`);
    }
    if (image2) {
      console.log(`Image 2 (${image2.id}) edits: blur=${blur2}, brightness=${brightness2}, saturation=${saturation2}`);
    }
  }

  const isDouble = images.length === 2;

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      <TopBar title={isDouble ? "Compare & Edit" : "Edit Page"} />

      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {images.length > 0
              ? `${images.length} image(s) selected for editing`
              : "No images selected"}
          </p>

          <div className="flex gap-2">
            {isDouble && (
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={activeImageIndex === 0 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveImageIndex(0)}
                >
                  Image 1
                </Button>
                <Button
                  variant={activeImageIndex === 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveImageIndex(1)}
                >
                  Image 2
                </Button>
              </div>
            )}
            {images.length === 0 && (
              <Button variant="outline" onClick={() => navigate("/gallery")}>
                Go to Gallery
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Image Preview Area */}
        <div className="flex-1 flex justify-center items-center bg-black/5 p-4 gap-4 overflow-hidden">
          {image1 && (
            <div className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-300 ${isDouble && activeImageIndex === 1 ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
               <PhotoComponent
                src={image1.url}
                alt={image1.title}
                brightness={brightness1}
                blur={blur1}
                saturation={saturation1}
              />
              {isDouble && <span className="mt-2 text-xs font-medium text-muted-foreground">Image 1</span>}
            </div>
          )}

          {image2 && (
            <div className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-300 ${activeImageIndex === 0 ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
              <PhotoComponent
                src={image2.url}
                alt={image2.title}
                brightness={brightness2}
                blur={blur2}
                saturation={saturation2}
              />
              <span className="mt-2 text-xs font-medium text-muted-foreground">Image 2</span>
            </div>
          )}

          {!image1 && !image2 && (
             <div className="text-muted-foreground">No images to display</div>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="w-[350px] border-l bg-card overflow-y-auto">
          <EditingSettingsBar
            brightness={activeImageIndex === 0 ? brightness1 : brightness2}
            saturation={activeImageIndex === 0 ? saturation1 : saturation2}
            blur={activeImageIndex === 0 ? blur1 : blur2}
            onBrightnessChange={activeImageIndex === 0 ? setBrightness1 : setBrightness2}
            onSaturationChange={activeImageIndex === 0 ? setSaturation1 : setSaturation2}
            onBlurChange={activeImageIndex === 0 ? setBlur1 : setBlur2}
          />

          <div className="p-6 pt-0">
             <Button
              onClick={handleSave}
              className="w-full rounded-full font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:scale-102 transition-all"
            >
              Save edits
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Edit;