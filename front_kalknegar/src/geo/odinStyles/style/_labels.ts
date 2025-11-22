<<<<<<< Updated upstream

/**
 *
 */
export default labels => sidc => (labels[sidc] || []).flat()
=======
export default (labels: any) => (sidc: string | null): any[] => {
  if (!sidc) return []
  return (labels[sidc] || []).flat()
}

>>>>>>> Stashed changes
