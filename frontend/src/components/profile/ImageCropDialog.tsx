"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
} from "@mui/material";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop/types";

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  cropShape?: "rect" | "round";
  aspect?: number;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
}

export default function ImageCropDialog({
  open,
  imageSrc,
  cropShape = "rect",
  aspect = 3,
  onClose,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (location: Point) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Set canvas size to cropped area size
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleSave = async () => {
    const croppedImage = await createCroppedImage();
    if (croppedImage) {
      onCropComplete(croppedImage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: "background.default",
          color: "text.primary",
          width: "95vw",
          maxWidth: cropShape === 'round' ? '700px' : '1600px',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        画像を編集
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          position: "relative",
          height: cropShape === 'round' ? '700px' : 'calc(95vw / 3)',
          maxHeight: cropShape === 'round' ? '700px' : 'calc(1600px / 3)',
          minHeight: cropShape === 'round' ? '500px' : '400px',
          width: "100%",
          bgcolor: "black",
        }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={true}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaChange}
          objectFit="contain"
        />
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: "column",
          gap: 2,
          p: 3,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            ズーム
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, value) => onZoomChange(value as number)}
            sx={{ color: "primary.main" }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              borderRadius: "9999px",
              textTransform: "none",
              px: 3,
            }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              borderRadius: "9999px",
              textTransform: "none",
              px: 3,
            }}
          >
            適用
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
