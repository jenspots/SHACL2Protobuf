import { Message } from "./message";

/**
 * The count of a field in a Protobuf schema, which is either required (null),
 * optional, or repeated.
 */
export type Count = "repeated" | "optional" | null;

/**
 * Model a single field in a Protobuf message.
 */
export class Field {
    /** How many times a value is present. */
    private readonly count: Count;

    /** The data type of the field. This can be either a string or another
     * Message. */
    private readonly type: string | Message;

    /** The field name. */
    private readonly name: string;

    /**
     * Create a new field with a given count, type, and name.
     * @param count The count of the field.
     * @param type The data type of the field.
     * @param name The field name.
     */
    public constructor(count: Count, type: string | Message, name: string) {
        this.count = count;
        this.type = type;
        this.name = name;
    }

    /**
     * Convert the field to a Protobuf schema string.
     * @param identifier The field identifier. Note this is 1-indexed.
     */
    public toProtoBuf(identifier: number): string {
        const result: string[] = [];

        if (this.count) {
            result.push(this.count);
        }

        if (this.type instanceof Message) {
            result.push(this.type.name);
        } else {
            result.push(this.type);
        }

        result.push(`${this.name} = ${identifier}`);

        return result.join(" ") + ";\n";
    }
}
