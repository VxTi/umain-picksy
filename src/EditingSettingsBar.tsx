import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const sliderLabels = [
  "Style",
  "Color",
  "Mood",
  "Lighting",
  "Detail",
  "Pose",
  "Background",
  "Energy",
  "Vibe",
  "Magic",
];

const checkOptions = [
  "High resolution",
  "Cinematic look",
  "Soft shadows",
  "Fantasy theme",
  "Dynamic motion",
];

export default function EditingSettingsBar() {
  const [sliders, setSliders] = useState<number[]>(Array(10).fill(50));
  const [checks, setChecks] = useState<boolean[]>(Array(5).fill(false));

  const updateSlider = (index: number, value: number[]) => {
    const next = [...sliders];
    next[index] = value[0];
    setSliders(next);
  };

  const toggleCheck = (index: number) => {
    const next = [...checks];
    next[index] = !next[index];
    setChecks(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-2xl shadow-xl">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {sliderLabels.map((label, i) => (
              <div key={label} className="space-y-2">
                <div className="text-sm font-medium">{label}</div>
                <Slider
                  value={[sliders[i]]}
                  onValueChange={(v) => updateSlider(i, v)}
                  max={100}
                  step={1}
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {checkOptions.map((text, i) => (
              <label key={text} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={checks[i]}
                  onCheckedChange={() => toggleCheck(i)}
                />
                <span className="text-sm">{text}</span>
              </label>
            ))}
          </div>

          <Button
            className="w-full text-lg font-semibold rounded-2xl"
            size="lg"
            onClick={() => console.log("Generate clicked", sliders, checks)}>
            grok generate them in a bikini
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
