/**
 * Stitch Screens & Asset Reference Helper
 * Allows importing or referencing original Stitch screens and screen.png snapshots.
 */
export const STITCH_DIR = 'stitch_aarogya_case_public_health_portal'

export const getScreenSnapshotUrl = (screenFolderName) => {
  return `/${STITCH_DIR}/${screenFolderName}/screen.png`
}
