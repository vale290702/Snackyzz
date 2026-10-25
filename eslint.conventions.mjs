import { basename } from "node:path";

const ROLE_FILENAME =
  /^[a-z][a-z0-9-]*\.(helper|factory|runner|service|loader|repository|schema|capability|actions|query|job|adapter|hook|component|types|constants|enum)(\.int)?(\.test)?\.tsx?$/;

const conventions = {
  rules: {
    "role-suffix": {
      meta: {
        type: "suggestion",
        schema: [],
        messages: {
          missing:
            "Use a purpose name and role suffix (for example session.loader.ts), or index.ts for public exports. See docs/code-conventions.md.",
        },
      },
      create(context) {
        return {
          Program(node) {
            const filename = basename(context.filename);
            if (filename !== "index.ts" && !ROLE_FILENAME.test(filename)) {
              context.report({ node, messageId: "missing" });
            }
          },
        };
      },
    },
  },
};

export default conventions;
