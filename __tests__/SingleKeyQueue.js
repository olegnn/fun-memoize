const { SingleKeyQueue } = require("../build/collections/SingleKeyQueue");

describe("SingleKeyQueue", () => {
  it("basic workflow", () => {
    let queue = new SingleKeyQueue([1, 2, 3]);
    expect(queue.len()).toBe(3);
    expect(queue.isEmpty()).toBe(false);

    const keys = [1, 2, 3];
    expect([...queue.keysFront()]).toEqual(keys);
    for (const key of keys) {
      const peeked = queue.peekKeyFront();
      const item = queue.takeKeyFront();
      expect(item).toBe(key);
      expect(item).toBe(peeked);
    }

    queue = new SingleKeyQueue([1, 2, 3]);
    for (const key of keys) {
      const peek = queue.peekKeyFront();
      const item = queue.takeKeyFront();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);

    queue = new SingleKeyQueue([3, 2, 1]);
    for (const key of keys) {
      const peek = queue.peekKeyBack();
      const item = queue.takeKeyBack();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);

    queue = new SingleKeyQueue([1, 2, 3]);
    for (const key of keys) {
      const peek = queue.peekFront();
      const item = queue.takeFront();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);

    queue = new SingleKeyQueue([3, 2, 1]);
    for (const key of keys) {
      const peek = queue.peekBack();
      const item = queue.takeBack();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);
  });

  it("front workflow", () => {
    let queue = new SingleKeyQueue();
    queue.pushFront(1);
    queue.pushFront(2);
    queue.pushFront(3);

    const keys = [3, 2, 1];
    expect([...queue.keysBack()]).toEqual([...queue.keysFront()].reverse());
    for (const key of keys) {
      const peeked = queue.peekKeyFront();
      const item = queue.takeKeyFront();
      expect(item).toBe(key);
      expect(item).toBe(peeked);
    }
  });

  it("back workflow", () => {
    let queue = new SingleKeyQueue();
    queue.pushBack(1);
    queue.pushBack(2);
    queue.pushBack(3);

    const keys = [3, 2, 1];
    expect([...queue.keysFront()]).toEqual([...queue.keysBack()].reverse());
    for (const key of keys) {
      const peeked = queue.peekKeyBack();
      const item = queue.takeKeyBack();
      expect(item).toBe(key);
      expect(item).toBe(peeked);
    }
  });
});
