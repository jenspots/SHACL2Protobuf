import { Message } from "./message";
import { Count, Field } from "./field";
import type { BindingsStream, Bindings } from "@comunica/types";

/**
 * Models a Protobuf schema which can be extended on a per-field basis.
 */
export class Schema {
    /** The collection of all messages. */
    private readonly messages: Map<string, Message>;

    /**
     * Initialize a Schema instance using a stream of bindings.
     * @param stream The stream of bindings to parse.
     * @returns The Schema object.
     */
    public static async parseBindings(stream: BindingsStream): Promise<Schema> {
        const result = new Schema();
        for (const binding of await stream.toArray()) {
            result.parseBinding(binding);
        }
        return result;
    }

    /**
     * Initialize an empty Schema.
     */
    constructor() {
        this.messages = new Map();
    }

    /**
     * Parse a single binding as a field and add it to the schema.
     * @param binding The binding to parse.
     */
    private parseBinding(binding: Bindings): void {
        const target = binding.get("target")!.value;
        const name = binding.get("path")!.value;
        const min = Number.parseInt(binding.get("minCount")?.value ?? "");
        const max = Number.parseInt(binding.get("maxCount")?.value ?? "");

        // Parse the target type. TODO: this is very hacky.
        const targetClass = binding.get("class")?.value;
        const targetType = binding.get("datatype")?.value;
        const type = targetClass ?? targetType!.split("#")[1];

        // Determine the field count based on min and max counts.
        let count: Count = null;
        if (max !== 1) {
            count = "repeated";
        } else if (min !== 1) {
            count = "optional";
        }

        // Add field to the schema.
        const field: Field = new Field(count, type, name);
        this.addField(target, field);
    }

    /**
     * Get a message by name, create it if it does not exist yet.
     * @param messageName The name of the message.
     */
    private getMessage(messageName: string): Message {
        let message = this.messages.get(messageName);
        if (!message) {
            message = new Message(messageName);
            this.messages.set(messageName, message);
        }
        return message;
    }

    /**
     * Add a Field object to the schema, creating the message if it does not
     * exist yet.
     * @param messageName The name of the message.
     * @param field The Field object to add.
     */
    public addField(messageName: string, field: Field) {
        const message = this.getMessage(messageName);
        message.addField(field);
    }

    /**
     * Convert the schema to a Protobuf schema string.
     * @returns The Protobuf schema string.
     */
    public toProtoBuf(): string {
        let result = 'syntax = "proto3";\n\n';
        for (const message of this.messages.values()) {
            result += message.toProtoBuf() + "\n\n";
        }
        return result;
    }
}
