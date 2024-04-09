import { greet } from "../src";
import { expect, describe, test } from "vitest";

describe("log", () => {
    test("successful", async () => {
        expect.assertions(1);
        expect(greet("World")).toBe("Hello, World!");
    });
});
