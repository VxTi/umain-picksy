import { Button } from "@/components/ui/button";
import { Card, CardContent }      from "@/components/ui/card";
import { FolderIcon, ImagesIcon } from 'lucide-react';
import { useNavigate }            from "react-router-dom";
import type { Photo } from "./backend/commandStream";

type PicksyViewProps = {
  photos: Photo[];
  onSelectFolder: () => void;
};

export default function PicksyView({ photos, onSelectFolder }: PicksyViewProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-105 shadow-xl">
        <CardContent className="flex flex-col items-center gap-6 p-8">

          {/* Logo placeholder */}
          <div className="w-100 h-100 rounded-xl flex items-center justify-center text-sm text-muted-foreground">
            <img src="/picksy_logo_2.png" alt="logo" className="w-100 h-100 object-contain" />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <Button size="lg" className="w-full" onClick={onSelectFolder}>
              <FolderIcon/> Select folder
            </Button>

            <Button size="lg" variant="outline" className="w-full" onClick={() => navigate("/gallery", { state: { photos } })}>
              <ImagesIcon/>
              View Gallery
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {photos.length} photos in library
          </p>

          <div className="grid grid-cols-3 gap-2 w-full">
            {photos.map((photo, index) => (
              <img
                key={photo.id ?? index}
                src={photo.base64}
                alt={photo.filename}
                className="h-20 w-full rounded object-cover"
                loading="lazy"
              />
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}