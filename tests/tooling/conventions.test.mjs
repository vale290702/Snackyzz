import { ESLint } from "eslint";
import assert from "node:assert/strict";
import test from "node:test";

const eslint = new ESLint();

async function ruleIds(filePath, source) {
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages.map((message) => message.ruleId);
}

test("purpose modules require a role suffix and allow index/test files", async () => {
  assert.ok(
    (await ruleIds("src/shared/lib/example/example.ts", "export {};")).includes(
      "conventions/role-suffix",
    ),
  );
  for (const name of ["index.ts", "example.helper.ts", "example.helper.test.ts"]) {
    assert.ok(
      !(await ruleIds(`src/shared/lib/example/${name}`, "export {};")).includes(
        "conventions/role-suffix",
      ),
    );
  }
});

test("handwritten source rejects one-line JSDoc and single-letter generics", async () => {
  const messages = await ruleIds(
    "src/shared/lib/example/example.types.ts",
    "/** Value contract. */\nexport type Example<T> = { value: T };\n",
  );
  assert.ok(messages.includes("jsdoc/multiline-blocks"));
  assert.ok(messages.includes("@typescript-eslint/naming-convention"));
  const valid = await ruleIds(
    "src/shared/lib/example/example.types.ts",
    "/**\n * Value contract.\n */\nexport type Example<Value> = { value: Value };\n",
  );
  assert.deepEqual(valid, []);
});

test("generated types and framework filenames remain exempt", async () => {
  assert.ok(
    !(
      await ruleIds("src/integrations/supabase/database.types.ts", "export type Example<T> = T;")
    ).includes("@typescript-eslint/naming-convention"),
  );
  assert.ok(
    !(await ruleIds("src/app/example/page.tsx", "export {};")).includes("conventions/role-suffix"),
  );
});

test("hooks can import nested actions but cannot import repositories", async () => {
  const { mkdir, mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const featurePath = await mkdtemp("src/features/conventions-fixture-");
  await mkdir(`${featurePath}/server/example`, { recursive: true });
  await mkdir(`${featurePath}/hooks`, { recursive: true });
  try {
    for (const role of ["actions", "repository"]) {
      await writeFile(
        `${featurePath}/server/example/example.${role}.ts`,
        "export const operation = 1;\n",
      );
    }
    const actions = await ruleIds(
      `${featurePath}/hooks/example.hook.ts`,
      'export { operation } from "../server/example/example.actions";',
    );
    const repository = await ruleIds(
      `${featurePath}/hooks/example.hook.ts`,
      'export { operation } from "../server/example/example.repository";',
    );
    assert.ok(!actions.includes("boundaries/dependencies"));
    assert.ok(repository.includes("boundaries/dependencies"));
  } finally {
    await rm(featurePath, { recursive: true, force: true });
  }
});
