<<<<<<< Updated upstream

/**
 *
 */
export default (globalStyle, schemeStyle, layerStyle, featureStyle) => {
=======
export default (globalStyle: any, schemeStyle: any, layerStyle: any, featureStyle: any): Record<string, any> => {
>>>>>>> Stashed changes
  if (!layerStyle['line-color']) delete layerStyle['line-color']
  if (!layerStyle['line-halo-color']) delete layerStyle['line-halo-color']
  return {
    ...globalStyle,
    ...schemeStyle,
    ...layerStyle,
    ...featureStyle
  }
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
