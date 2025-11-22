/**
 * Stateful equality function to compare old/new keys of OL features/geometries.
 */
const keyequals = () => {
<<<<<<< Updated upstream
  const key = target => `${target.ol_uid}:${target.getRevision()}`
  let last
  return (_, b) => {
=======
  const key = (target: any) => `${target.ol_uid}:${target.getRevision()}`
  let last: string | undefined
  return (_: any, b: any) => {
>>>>>>> Stashed changes
    if (last === key(b)) return true
    else last = key(b)
    return false
  }
}

export default keyequals
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
