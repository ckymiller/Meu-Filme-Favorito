import { useColorScheme } from "react-native";

import palette from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 * Falls back to the light palette when the dark key is missing.
 */
export function useColors() {
  const scheme = useColorScheme();
  const themed = scheme === "dark" && palette.dark ? palette.dark : palette.light;
  return { ...themed, radius: palette.radius };
}
