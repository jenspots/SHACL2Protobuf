import { Field } from "./field";

/**
 * Model a single message in a Protobuf schema.
 */
export class Message {
    /** A complete list of all the fields in the message. */
    private readonly fields: Field[];

    /** The name of the message. */
    public readonly name: string;

    /**
     * Create a new message with a given name.
     * @param name The name of the message.
     */
    constructor(name: string) {
        this.name = name;
        this.fields = [];
    }

    /**
     * Add a field to the message.
     * @param field The field to add.
     */
    public addField(field: Field) {
        this.fields.push(field);
    }

    /**
     * Convert the message to a Protobuf schema string.
     * @returns A string representation of the message.
     */
    public toProtoBuf(): string {
        let result = `message ${this.name} {\n`;
        this.fields.forEach((field, index) => {
            result += `    ${field.toProtoBuf(index + 1)}`;
        });
        result += "}";
        return result;
    }
}
