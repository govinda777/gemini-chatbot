import { NextResponse } from "next/server";
import { z } from "zod";

import { getTools } from "@/app/(chat)/api/chat/tools";

function getParamInfo(schema: z.ZodTypeAny): any {
  let isRequired = true;
  let currentSchema = schema;

  if (currentSchema._def.typeName === "ZodOptional") {
    isRequired = false;
    currentSchema = (currentSchema as any).unwrap();
  }

  let type = "string";
  let options: string[] | undefined = undefined;
  let itemsType: any = undefined;
  let fields: any = undefined;

  const typeName = currentSchema._def.typeName;

  if (typeName === "ZodNumber") {
    type = "number";
  } else if (typeName === "ZodBoolean") {
    type = "boolean";
  } else if (typeName === "ZodArray") {
    type = "array";
    itemsType = getParamInfo((currentSchema as any).element);
  } else if (typeName === "ZodObject") {
    type = "object";
    const shape = (currentSchema as any).shape;
    fields = Object.entries(shape).map(([k, v]) => ({
      name: k,
      ...getParamInfo(v as z.ZodTypeAny),
    }));
  } else if (typeName === "ZodEnum") {
    type = "enum";
    options = (currentSchema as any)._def.values;
  }

  return {
    type,
    description: currentSchema.description || "",
    required: isRequired,
    options,
    itemsType,
    fields,
  };
}

export async function GET() {
  try {
    const toolsList = Object.entries(getTools).map(([name, tool]) => {
      const shape = tool.parameters.shape;
      const params = Object.entries(shape).map(([paramName, paramSchema]) => {
        const info = getParamInfo(paramSchema as z.ZodTypeAny);
        return {
          name: paramName,
          ...info,
        };
      });

      return {
        name,
        description: tool.description,
        params,
      };
    });

    return NextResponse.json({ success: true, tools: toolsList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
