import React from "react";

type ImageViewProps = {
  src: string;
  alt?: string;
  brightness?: number; // percent
  blur?: number;
  saturation?: number;
};

export const PhotoComponent: React.FC<ImageViewProps> = ({
  src,
  alt = "",
  brightness = 100,
  blur = 0,
  saturation = 0,
}) => {
    const filter = `brightness(${brightness}%) saturate(${saturation}%) blur(${blur}px)`;
  return (
    <img
      src={src}
      alt={alt}
      style={{
        maxHeight: "100%",
        maxWidth: "100%",
        objectFit: "contain",
        filter
      }}
    />
  );
};