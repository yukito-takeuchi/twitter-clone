"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";

interface AnimatedCounterProps {
  value: number;
  color?: string;
  duration?: number;
}

export default function AnimatedCounter({
  value,
  color = "inherit",
  duration = 300,
}: AnimatedCounterProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue, duration]);

  // Convert number to string to handle each digit
  const currentDigits = String(value).split("");
  const prevDigits = String(prevValue).split("");

  // Pad to same length for smooth transition
  const maxLength = Math.max(currentDigits.length, prevDigits.length);
  while (currentDigits.length < maxLength) currentDigits.unshift(" ");
  while (prevDigits.length < maxLength) prevDigits.unshift(" ");

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        color,
      }}
    >
      {currentDigits.map((digit, index) => {
        const prevDigit = prevDigits[index];
        const isChanged = digit !== prevDigit && isAnimating;

        return (
          <Box
            key={index}
            sx={{
              position: "relative",
              display: "inline-block",
              overflow: "hidden",
              height: "1em",
              minWidth: digit === " " ? "0" : "0.6em",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                transition: isChanged
                  ? `transform ${duration}ms ease-out`
                  : "none",
                transform: isChanged
                  ? value > prevValue
                    ? "translateY(-1em)"
                    : "translateY(1em)"
                  : "translateY(0)",
              }}
            >
              {/* Previous digit (slides out) */}
              {isChanged && (
                <Box
                  sx={{
                    height: "1em",
                    lineHeight: "1em",
                    textAlign: "center",
                  }}
                >
                  {prevDigit}
                </Box>
              )}
              {/* Current digit */}
              <Box
                sx={{
                  height: "1em",
                  lineHeight: "1em",
                  textAlign: "center",
                }}
              >
                {digit}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
