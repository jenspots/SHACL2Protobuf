import rdf from "rdf-ext";
import { Readable } from "stream";
import * as fs from "fs";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Store } from "n3";
import ProtoBuilder from "./protobuilder";

export class Generator {
    static async exec(shacl: string): Promise<string> {
        // Parse SHACL into a dataset.
        const parser = rdf.formats.parsers.get("text/turtle")!;
        const rawStream = Readable.from(shacl);
        const quadStream = parser.import(rawStream);
        const dataset = await rdf
            .dataset()
            .import(quadStream)
            .catch(() => {
                throw "ERROR: Could not parse incoming data.";
            });

        // TODO: This is probably not needed!
        const store = new Store();
        // @ts-expect-error Incorrect typing.
        for await (const quad of dataset.toStream()) {
            store.add(quad);
        }

        // Execute SPARQL query.
        const query = fs
            .readFileSync("./src/resources/query.sparql")
            .toString();
        const engine = new QueryEngine();
        const bindingsStream = await engine.queryBindings(query, {
            sources: [store],
        });

        // We gather the result in a map for easy access while building.
        const schema = await ProtoBuilder.parseBindings(bindingsStream);
        return schema.toProtoBuf();
    }
}
