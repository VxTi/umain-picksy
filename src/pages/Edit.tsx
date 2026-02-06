import { useLocation, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import type { ImageItem } from "./Gallery";

function Edit() {
  const location = useLocation();
  const navigate = useNavigate();
  const images = (location.state?.images as ImageItem[]) || [];

  return (
    <main className="min-h-screen bg-background">
      <TopBar title="Edit Page" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {images.length} image(s) selected for editing
          </p>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No images selected.</p>
            <Button
              className="mt-4"
              onClick={() => navigate("/gallery")}
            >
              Go to Gallery
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="rounded-lg overflow-hidden border bg-card"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-sm text-muted-foreground">ID: {image.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Edit;
