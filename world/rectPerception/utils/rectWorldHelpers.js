  import { randomInt } from "../../../utils/helpers";

/* Returns an array of objects which define the amount
  of ribbons in a group, their width and offset
*/
export function createGroupSpecs(ribbonCountLength, offset, spacing) {
  let result = [];

  for (let i = 0; i < ribbonCountLength; i++) {
    const ribbonCount = randomInt(1, 15);
    const width = (offset + spacing) * ribbonCount;
    const ribbonGroupSpec = { ribbonCount, width }
    result.push(ribbonGroupSpec)
  }
  return result;
}

/* Returns an array of numbers which define a single X-offset for
   each group of ribbons, based on the width of each group and the spacing between groups
   This is used to position groups in the world so none should overlap and
   whole row is centered on x=0 (rather than starting at x=0 and extending to the right)
*/

// groupsSpecs {ribbonCount: number, width: number}[]
// groupGap number
// returns number[]
export function computeGroupOffsets(groupSpecs, groupGap) {
  let start = 0;
  let offsets = [];
  for (let i = 0; i < groupSpecs.length; i++) {
    const leftEdge = start;
    start += groupSpecs[i].width + groupGap;
    offsets.push(leftEdge);
  }
  const totalSpan = start - groupGap; // takes off the last added gap in loop to be flush with ribbonCount
  const centeredOffsets = offsets.map((c) => c - totalSpan / 2);
  return centeredOffsets;
}
