import rdf from "rdf-ext";
import { Readable } from "stream";
import * as fs from "fs";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Store} from "n3";

type Field = {
    count: "required" | "repeated" | "optional";
    type: string;
    id: string;
}

type Message = {
    name: string;
    fields: Field[];
}

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
                throw "ERROR: Could not parse incoming data."
            });

        // TODO: This is probably not needed!
        const store = new Store();
        // @ts-expect-error
        for await (const quad of dataset.toStream()) {
            store.add(quad);
        }

        // Execute SPARQL query.
        const query = fs.readFileSync("./src/resources/query.sparql").toString();
        const engine = new QueryEngine();
        const bindingsStream = await engine.queryBindings(query, {
            sources: [ store ],
        });

        // We gather the result in a map for easy access while building.
        const result: Map<string, Message> = new Map();

        for (const binding of await bindingsStream.toArray()) {
            // Parse the resulting binding.
            const target = binding.get("target")!.value;
            const id = binding.get("path")!.value;
            const min = Number.parseInt(binding.get("minCount")?.value ?? "");
            const max = Number.parseInt(binding.get("maxCount")?.value ?? "");

            // Parse the target type. TODO: this is very hacky.
            const targetClass = binding.get("class")?.value;
            const targetType = binding.get("datatype")?.value;
            const type = targetClass ? targetClass : targetType!.split("#")[1];

            // Get the message from the result. If it doesn't exist already,
            // create it.
            let message = result.get(target);
            if (!message) {
                message = {
                    name: target,
                    fields: [],
                };
                result.set(target, message);
            }

            // Initialize the field with placeholder count.
            let field: Field = { count: "required", type, id };

            // Determine the field count based on min and max counts.
            if (max != 1) {
                field.count = "repeated";
            } else if (min == 1) {
                field.count = "required";
            } else {
                field.count = "optional";
            }

            // Add to the tree.
            message.fields.push(field);
        }

        // Parse tree into Protobuf file.
        let schema = "";
        for (const { name, fields } of result.values()) {
            schema += `message ${name} {\n`;
            fields.forEach((field, index) => {
                schema += `    ${field.count} ${field.type} ${field.id} = ${index + 1};\n`;
            });
            schema += "}\n\n";
        }
        return schema;
    }
}
