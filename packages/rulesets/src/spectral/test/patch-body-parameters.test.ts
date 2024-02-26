import { Spectral } from "@stoplight/spectral-core"
import linterForRule from "./utils"

let linter: Spectral

beforeAll(async () => {
  linter = await linterForRule("PatchBodyParametersSchema")
  return linter
})

test("PatchBodyParametersSchema should find errors for default value body parameter", () => {
  const oasDoc = {
    swagger: "2.0",
    paths: {
      "/foo": {
        patch: {
          tags: ["SampleTag"],
          operationId: "Foo_Update",
          description: "Test Description",
          parameters: [
            {
              name: "foo_patch",
              in: "body",
              schema: {
                $ref: "#/definitions/FooRequestParams",
              },
            },
          ],
          responses: {},
        },
      },
    },
    definitions: {
      FooRequestParams: {
        allOf: [
          {
            $ref: "#/definitions/FooProps",
          },
        ],
      },
      FooProps: {
        properties: {
          prop0: {
            type: "string",
            default: "my def val",
          },
        },
      },
    },
  }
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(1)
    expect(results[0].path.join(".")).toBe("paths./foo.patch.parameters.0.schema")
    expect(results[0].message).toContain("Properties of a PATCH request body must not have default value, property:prop0.")
  })
})

test("PatchBodyParametersSchema should find errors for required/create value", () => {
  const oasDoc = {
    swagger: "2.0",
    paths: {
      "/foo": {
        patch: {
          tags: ["SampleTag"],
          operationId: "Foo_Update",
          description: "Test Description",
          parameters: [
            {
              name: "foo_patch",
              in: "body",
              schema: {
                $ref: "#/definitions/FooRequestParams",
              },
            },
          ],
          responses: {},
        },
      },
    },
    definitions: {
      FooRequestParams: {
        allOf: [
          {
            $ref: "#/definitions/FooProps",
          },
        ],
      },
      FooProps: {
        properties: {
          prop0: {
            type: "string",
          },
          prop1: {
            type: "string",
            "x-ms-mutability": ["create"],
          },
        },
        required: ["prop0"],
      },
    },
  }
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(2)
    expect(results[0].path.join(".")).toBe("paths./foo.patch.parameters.0.schema")
    expect(results[0].message).toContain("Properties of a PATCH request body must not be required, property:prop0.")
    expect(results[1].path.join(".")).toBe("paths./foo.patch.parameters.0.schema")
    expect(results[1].message).toContain('Properties of a PATCH request body must not be x-ms-mutability: ["create"], property:prop1.')
  })
})

test("PatchBodyParametersSchema should find errors for default value in nested body parameter", () => {
  const oasDoc = {
    swagger: "2.0",
    paths: {
      "/foo": {
        patch: {
          parameters: [
            {
              name: "foo_patch",
              in: "body",
              schema: {
                $ref: "#/definitions/FooRequestParams",
              },
            },
          ],
          responses: {},
        },
      },
      "/bar": {
        patch: {
          parameters: [
            {
              name: "bar_patch",
              in: "body",
              schema: {
                $ref: "#/definitions/BarRequestParams",
              },
            },
          ],
          responses: {},
        },
      },
    },
    definitions: {
      FooRequestParams: {
        properties: {
          type: "object",
          properties: {
            $ref: "#/definitions/FooProps",
          },
        },
      },
      FooProps: {
        type: "object",
        properties: {
          prop0: {
            type: "string",
            default: "my def val",
          },
        },
      },
      BarRequestParams: {
        properties: {
          properties: {
            $ref: "#/definitions/BarProps",
          },
        },
      },
      BarProps: {
        properties: {
          prop0: {
            type: "string",
            default: "my def val",
          },
        },
      },
    },
  }
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(2)
    expect(results[0].path.join(".")).toBe("paths./foo.patch.parameters.0.schema.properties.properties")
    expect(results[0].message).toContain("Properties of a PATCH request body must not have default value, property:prop0.")
    expect(results[1].path.join(".")).toBe("paths./bar.patch.parameters.0.schema.properties.properties")
    expect(results[1].message).toContain("Properties of a PATCH request body must not have default value, property:prop0.")
  })
})

test("PatchBodyParametersSchema should find no errors", () => {
  const oasDoc = {
    swagger: "2.0",
    paths: {
      "/foo": {
        patch: {
          tags: ["SampleTag"],
          operationId: "Foo_Update",
          description: "Test Description",
          parameters: [
            {
              name: "foo_patch",
              in: "body",
              schema: {
                $ref: "#/definitions/FooRequestParams",
              },
            },
          ],
          responses: {},
        },
      },
    },
    definitions: {
      FooRequestParams: {
        allOf: [
          {
            $ref: "#/definitions/FooProps",
          },
        ],
        properties: {
          inner: {
            $ref: "#/definitions/InnerProps",
          },
        },
      },
      FooProps: {
        properties: {
          prop0: {
            type: "string",
          },
          prop1: {
            type: "string",
          },
        },
      },
      InnerProps: {
        properties: {
          innerProp0: {
            type: "string",
          },
        },
        required: ["innerProp0"],
      },
    },
  }
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(0)
  })
})
