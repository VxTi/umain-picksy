import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  brightness: number; // 0..200
  saturation: number;
  blur: number;
  onBrightnessChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  //onContrastChange: (value: number) => void;
  onBlurChange: (value: number) => void;
  //onSepiaChange: (value: number) => void;
  //onGrayscaleChange: (value: number) => void;
};

export default function EditingSettingsBar({
   brightness,
   saturation,
   blur,
  onBrightnessChange,
  onSaturationChange,
  //onContrastChange,
  onBlurChange,
  //onSepiaChange,
  //onGrayscaleChange
}: Props) {
  return (
    <div className="h-full w-full p-6">

      {/* Brightness */}
      <Card className="w-full rounded-2xl shadow-xl">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Brightness: {brightness}%
            </div>
            <Slider
              value={[brightness]}
              onValueChange={(v) => onBrightnessChange(v[0])}
              min={0}
              max={200}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Saturation */}
      <Card className="w-full rounded-2xl shadow-xl">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Saturation: {saturation}%
            </div>
            <Slider
              value={[saturation]}
              onValueChange={(v) => onSaturationChange(v[0])}
              min={0}
              max={200}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blur */}
      <Card className="w-full rounded-2xl shadow-xl">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Blur: {blur}%
            </div>
            <Slider
              value={[blur]}
              onValueChange={(v) => onBlurChange(v[0])}
              min={0}
              max={10}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}