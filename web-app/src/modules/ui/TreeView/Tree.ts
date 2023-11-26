class Tree {
  public readonly children = new Map<string, Tree>();

  public insert(elements: string[]) {
    if (elements.length > 0) {
      const [childKey, ...rest] = elements;
      let child = this.children.get(childKey);
      if (!child) {
        child = new Tree();
        this.children.set(childKey, child);
      }
      child.insert(rest);
    }
  }

  public empty() {
    return this.children.size === 0;
  }
}

export default Tree;