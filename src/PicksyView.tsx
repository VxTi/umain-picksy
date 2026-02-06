import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderIcon, ImagePlusIcon, ImagesIcon } from "lucide-react";
import { SetLibraryResult } from "./backend/events";
import { openGalleryWindow } from "@/lib/windows";

type PicksyViewProps = {
  photos: SetLibraryResult["photos"];
  onSelectFolder: () => void;
  onAddPhoto: () => void;
};

export default function PicksyView({
  photos,
  onSelectFolder,
  onAddPhoto,
}: PicksyViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-105 shadow-xl">
        <CardContent className="flex flex-col items-center gap-6 p-8">

          <div className="w-100 h-100 rounded-xl flex items-center justify-center text-sm text-muted-foreground">
            <img
              src="/picksy_logo_2.png"
              alt="logo"
              className="w-100 h-100 object-contain"
            />
          </div>

          <div className="flex flex-col gap-2 w-full">

            <Button size="lg" className="w-full" onClick={onAddPhoto}>
              <ImagePlusIcon /> Add photo
            </Button>

            <Button size="lg" className="w-full" onClick={onSelectFolder}>
              <FolderIcon /> Select photo folder
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => openGalleryWindow(photos)}
            >
              <ImagesIcon />
              View Library
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {photos.length} photos in library
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
