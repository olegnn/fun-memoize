const { MultiKeyQueue, Single } = require("../build/collections");
const { NO_VALUE } = require("../build/value");

describe("MultiKeyQueue", () => {
  it("basic workflow", () => {
    let inner = new MultiKeyQueue([
      new Single(1),
      new Single(2),
      new Single(3),
    ]);
    let queue = new MultiKeyQueue([inner]);
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

    inner = new MultiKeyQueue([new Single(1), new Single(2), new Single(3)]);
    queue = new MultiKeyQueue([inner]);

    expect(queue.peekFront()).toEqual(inner);
    expect(queue.takeFront()).toEqual(inner);
    expect(queue.takeFront()).toEqual(NO_VALUE);

    for (const key of keys) {
      const item = inner.takeKeyFront();
      expect(item).toEqual(key);
    }
  });
});
