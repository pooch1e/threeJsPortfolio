// Quadtree js utility class to subdivide based on cursor, or xy, position

export class Boundary {
  constructor(x, y, w, h) {
    this.x = x; // top-left corner
    this.y = y;
    this.w = w;
    this.h = h;
  }

  contains(point) {
    return (
      point.x >= this.x &&
      point.x < this.x + this.w &&
      point.y >= this.y &&
      point.y < this.y + this.h
    );
  }

  intersects(range) {
    return !(
      range.x > this.x + this.w ||
      range.x + range.w < this.x ||
      range.y > this.y + this.h ||
      range.y + range.h < this.y
    );
  }
}

export class QuadTreeNode {
  constructor(boundary, capacity) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.points = [];
    this.children = null;
  }

  insert(point) {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity && this.children === null) {
      this.points.push(point);
      return true;
    }

    if (this.children === null) {
      this.subdivide();
    }

    return (
      this.children.nw.insert(point) ||
      this.children.ne.insert(point) ||
      this.children.sw.insert(point) ||
      this.children.se.insert(point)
    );
  }

  subdivide() {
    const { x, y, w, h } = this.boundary;
    const hw = w / 2;
    const hh = h / 2;

    this.children = {
      nw: new QuadTreeNode(new Boundary(x, y, hw, hh), this.capacity),
      ne: new QuadTreeNode(new Boundary(x + hw, y, hw, hh), this.capacity),
      sw: new QuadTreeNode(new Boundary(x, y + hh, hw, hh), this.capacity),
      se: new QuadTreeNode(new Boundary(x + hw, y + hh, hw, hh), this.capacity),
    };

    // Redistribute existing points to children
    for (const point of this.points) {
      this.children.nw.insert(point) ||
      this.children.ne.insert(point) ||
      this.children.sw.insert(point) ||
      this.children.se.insert(point);
    }
    this.points = [];
  }

  queryRange(range, found = []) {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (range.contains(point)) {
        found.push(point);
      }
    }

    if (this.children !== null) {
      this.children.nw.queryRange(range, found);
      this.children.ne.queryRange(range, found);
      this.children.sw.queryRange(range, found);
      this.children.se.queryRange(range, found);
    }
    return found;
  }

  // Get all leaf nodes (for rendering the grid)
  getLeaves(leaves = []) {
    if (this.children === null) {
      leaves.push(this);
      return leaves;
    }
    this.children.nw.getLeaves(leaves);
    this.children.ne.getLeaves(leaves);
    this.children.sw.getLeaves(leaves);
    this.children.se.getLeaves(leaves);
    return leaves;
  }
}
