import React from "react";

type ImageViewProps = {
  src: string;
  alt?: string;
};

export const PhotoComponent: React.FC<ImageViewProps> = ({ src, alt = "" }) => {
  return (
        <img
            src={src}
            alt={alt}
            style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain"
            }}
         />
  );
};