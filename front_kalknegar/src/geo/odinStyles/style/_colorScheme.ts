<<<<<<< Updated upstream

/**
 *
 */
export default (globalStyle, layerStyle, featureStyle) => {
=======
export default (globalStyle: any, layerStyle: any, featureStyle: any): string => {
>>>>>>> Stashed changes
  return featureStyle?.['color-scheme'] ||
    layerStyle?.['color-scheme'] ||
    globalStyle?.['color-scheme'] ||
    'medium'
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
