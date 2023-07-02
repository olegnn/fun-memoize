const { SingleKeyQueue } = require("../build/collections/SingleKeyQueue");

describe("SingleKeyQueue", () => {
  it("basic workflow", () => {
    const keys = [1, 2, 3];
    queue = new SingleKeyQueue(keys);

    expect([...queue.keysFront()]).toEqual(keys);
    expect([...queue.valuesFront()]).toEqual(keys);
    for (const key of keys) {
      const peek = queue.peekKeyFront();
      const item = queue.takeKeyFront();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);

    queue = new SingleKeyQueue([...keys].reverse());
    expect([...queue.keysBack()]).toEqual(keys);
    expect([...queue.valuesBack()]).toEqual(keys);
    for (const key of keys) {
      const peek = queue.peekKeyBack();
      const item = queue.takeKeyBack();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);

    queue = new SingleKeyQueue(keys);
    for (const key of keys) {
      const peek = queue.peekFront();
      const item = queue.takeFront();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);

    queue = new SingleKeyQueue([...keys].reverse());
    for (const key of keys) {
      const peek = queue.peekBack();
      const item = queue.takeBack();
      expect(item).toEqual(key);
      expect(item).toEqual(peek);
    }
    expect(queue.isEmpty()).toBe(true);

    queue = new SingleKeyQueue();
    const back = queue.pushBack(2);
    const front = queue.pushFront(1);
    queue.insertAfter(back, 3);
    queue.insertBefore(front, 0);

    expect([...queue.keysFront()]).toEqual([0, 1, 2, 3]);
    expect([...queue.valuesFront()]).toEqual([0, 1, 2, 3]);
  });
});
