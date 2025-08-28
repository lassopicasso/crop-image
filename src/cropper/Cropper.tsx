import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./Cropper.module.css";
import {
  clampPosition,
  computeScaleLimits,
  drawCropCanvas,
} from "./CropperUtils";

export const Cropper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageLink =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Cumulus_Clouds_over_Yellow_Prairie2.jpg/1280px-Cumulus_Clouds_over_Yellow_Prairie2.jpg";
  const [image] = useState(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageLink;
    return img;
  });

  const [scale, setScale] = useState(0.5);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const cropCircle = useMemo(() => ({ x: 200, y: 200, radius: 100 }), []); // circle center and radius

  const { minScale, maxScale } = useMemo(
    () => computeScaleLimits({ image, cropCircle }),
    [image, cropCircle]
  );

  useEffect(() => {
    const handleWindowMouseUp = () => {
      dragging.current = false;
    };

    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (image.complete) {
      drawCropCanvas({ ctx, image, position, scale, cropCircle });
    } else {
      image.onload = () =>
        drawCropCanvas({ ctx, image, position, scale, cropCircle });
    }
  }, [image, position, scale, cropCircle]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;

    const newPos = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    };

    setPosition(clampPosition({ pos: newPos, image, scale, cropCircle }));
  };

  const updateScale = (nextScale: number) => {
    const clampedScale = Math.min(maxScale, Math.max(minScale, nextScale));

    setPosition((pos) =>
      clampPosition({ pos, image, scale: clampedScale, cropCircle })
    );
    setScale(clampedScale);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    updateScale(scale - e.deltaY * 0.001);
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateScale(Number(e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 10;
    setPosition((pos) => {
      const newPos = { ...pos };

      switch (e.key) {
        case "ArrowUp":
          newPos.y += step;
          break;
        case "ArrowDown":
          newPos.y -= step;
          break;
        case "ArrowLeft":
          newPos.x += step;
          break;
        case "ArrowRight":
          newPos.x -= step;
          break;
        default:
          return pos;
      }

      return clampPosition({ pos: newPos, image, scale, cropCircle });
    });
  };

  const handleSave = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = cropCircle.radius * 2;
    canvas.height = cropCircle.radius * 2;

    ctx.beginPath();
    ctx.arc(
      cropCircle.radius,
      cropCircle.radius,
      cropCircle.radius,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();

    // Compute the source rectangle from the original image
    const sx = (cropCircle.x - cropCircle.radius - position.x) / scale;
    const sy = (cropCircle.y - cropCircle.radius - position.y) / scale;
    const sWidth = (cropCircle.radius * 2) / scale;
    const sHeight = (cropCircle.radius * 2) / scale;

    ctx.drawImage(
      image,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      cropCircle.radius * 2,
      cropCircle.radius * 2
    );

    const link = document.createElement("a");
    link.download = "cropped.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className={classes.canvasContent}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        //Keyboard support
        tabIndex={0}
        onKeyDown={handleKeyDown}
      />

      <input
        type="range"
        min={minScale}
        max={maxScale}
        step={0.01}
        value={scale}
        onChange={(e) => handleSlider(e)}
      />

      <button onClick={handleSave}>Save Cropped Image</button>
    </>
  );
};
