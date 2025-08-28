type DrawCropCanvasProps = {
  ctx: CanvasRenderingContext2D;
  image: HTMLImageElement;
  position: { x: number; y: number };
  scale: number;
  cropCircle: { x: number; y: number; radius: number };
};

export const drawCropCanvas = ({
  ctx,
  image,
  position,
  scale,
  cropCircle,
}: DrawCropCanvasProps) => {
  const BLUR = "blur(2px)";
  const BORDER_COLOR = "white";
  const BORDER_WIDTH = 3;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw blurred image
  ctx.save();
  ctx.filter = BLUR;
  ctx.drawImage(
    image,
    position.x,
    position.y,
    image.width * scale,
    image.height * scale
  );
  ctx.restore();

  // Draw sharp image inside circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cropCircle.x, cropCircle.y, cropCircle.radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    image,
    position.x,
    position.y,
    image.width * scale,
    image.height * scale
  );
  ctx.restore();

  // Draw circle border
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.beginPath();
  ctx.arc(cropCircle.x, cropCircle.y, cropCircle.radius, 0, Math.PI * 2);
  ctx.stroke();
};

type ComputeScaleLimitsProps = {
  image: HTMLImageElement | null;
  cropCircle: { x: number; y: number; radius: number };
};

export const computeScaleLimits = ({
  image,
  cropCircle,
}: ComputeScaleLimitsProps) => {
  if (!image) return { minScale: 0.5, maxScale: 3 }; // fallback
  const { width: iw, height: ih } = image;
  const { radius } = cropCircle;

  const minScale = Math.max((radius * 2) / iw, (radius * 2) / ih);
  const maxScale = minScale * 3;

  return { minScale, maxScale };
};

type Position = { x: number; y: number };
type CropCircle = { x: number; y: number; radius: number };
type ClampPositionProps = {
  pos: Position;
  image: HTMLImageElement;
  scale: number;
  cropCircle: CropCircle;
};

export const clampPosition = ({
  pos,
  image,
  scale,
  cropCircle,
}: ClampPositionProps): Position => {
  const imgW = image.width * scale;
  const imgH = image.height * scale;

  const minX = cropCircle.x + cropCircle.radius - imgW;
  const maxX = cropCircle.x - cropCircle.radius;
  const minY = cropCircle.y + cropCircle.radius - imgH;
  const maxY = cropCircle.y - cropCircle.radius;

  return {
    x: Math.min(Math.max(pos.x, minX), maxX),
    y: Math.min(Math.max(pos.y, minY), maxY),
  };
};
