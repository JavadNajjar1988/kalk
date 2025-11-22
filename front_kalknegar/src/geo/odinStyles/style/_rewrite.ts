<<<<<<< Updated upstream

/**
 *
 */
export default fn => ({ geometry, ...rest }) =>
  geometry
    ? ({ geometry: fn(geometry), ...rest })
    : rest
=======
export default (fn: any) => ({ geometry, ...rest }: any) =>
  geometry
    ? ({ geometry: fn(geometry), ...rest })
    : rest

>>>>>>> Stashed changes
