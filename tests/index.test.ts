import { expect, describe, test } from "vitest";
import { Generator } from "../src";
import * as fs from "fs";

const shacl = fs.readFileSync("./tests/resources/shapes.ttl").toString();
const protobuf = fs.readFileSync("./tests/resources/shapes.proto").toString();

describe("log", () => {
    test("successful", async () => {
        // Call generator.
        const result = await Generator.exec(shacl);
        expect(result.trim()).toBe(protobuf.trim());
    });
});
