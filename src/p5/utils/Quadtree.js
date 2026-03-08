// Quadtree js utility class to subdivide based on cursor, or xy, position

export class QuadTreeNode {
  constructor(boundary, capacity) {
    this.boundary = boundary; // { x, y, width, height }
    this.capacity = capacity;
    this.points = [];
    this.children = null;
  }

  insert(point) {
    if (!this.boundary.contains(point)) {
      return false; // Point outside this node's boundary
    }

    if (this.points.length < this.capacity && this.children === null) {
      this.points.push(point);
      return true;
    }

    if (this.children === null) {
      this.subdivide();
    }

    // Try inserting into children
    return (
      this.children.nw.insert(point) ||
      this.children.ne.insert(point) ||
      this.children.sw.insert(point) ||
      this.children.se.insert(point)
    );
  }

  subdivide() {
    
  }
}
