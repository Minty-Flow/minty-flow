import { matchFont } from "@shopify/react-native-skia"

import { Fonts } from "~/styles/fonts"

const chartFont = matchFont({
  fontFamily: Fonts.sans.regular,
  fontSize: 11,
  fontStyle: "normal",
  fontWeight: "400",
})

export function useChartFont() {
  return chartFont
}
