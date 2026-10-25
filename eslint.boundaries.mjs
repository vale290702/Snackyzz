// Import rules from docs/rebuild/04-structure.md (DIR-02). Keep both in sync.

export const boundaryElements = [
  { type: "app", pattern: "src/app" },
  { type: "feature", pattern: "src/features/*", capture: ["feature"] },
  { type: "shared-lib", pattern: "src/shared/lib" },
  { type: "shared-ui", pattern: "src/shared/ui" },
  { type: "shared-config", pattern: "src/shared/config" },
  { type: "integrations", pattern: "src/integrations" },
  { type: "i18n", pattern: "src/i18n" },
  { type: "styles", pattern: "src/styles" },
];

const SAME_FEATURE = { feature: "{{ from.element.captured.feature }}" };

function element(type, extra = {}) {
  return { element: { type, ...extra } };
}

function featureLayer(layerPath) {
  return element("feature", { fileInternalPath: layerPath });
}

function sameFeatureLayer(layerPath) {
  return element("feature", { captured: SAME_FEATURE, fileInternalPath: layerPath });
}

const ANY_FEATURE_INDEX = featureLayer("index.ts");

export const boundaryPolicies = [
  {
    allow: { to: [{ module: { origin: ["external", "core"] } }] },
  },
  {
    from: element("app"),
    allow: {
      to: [
        element("app"),
        element("i18n"),
        element("styles"),
        element("shared-*"),
        ANY_FEATURE_INDEX,
      ],
    },
  },
  {
    from: featureLayer("index.ts"),
    allow: { to: [sameFeatureLayer("**")] },
  },
  {
    from: featureLayer("domain/**"),
    allow: { to: [sameFeatureLayer("domain/**"), element("shared-lib")] },
  },
  {
    from: featureLayer("domain/**"),
    allow: { to: [ANY_FEATURE_INDEX], dependency: { kind: "type" } },
  },
  {
    from: featureLayer("server/**"),
    allow: {
      to: [
        sameFeatureLayer("**"),
        ANY_FEATURE_INDEX,
        element("shared-*"),
        element("integrations"),
        element("i18n"),
      ],
    },
  },
  {
    from: featureLayer("hooks/**"),
    allow: {
      to: [
        sameFeatureLayer("domain/**"),
        sameFeatureLayer("hooks/**"),
        sameFeatureLayer("server/actions.ts"),
        ANY_FEATURE_INDEX,
        element("shared-lib"),
        element("i18n"),
      ],
    },
  },
  {
    from: featureLayer("ui/**"),
    allow: {
      to: [
        sameFeatureLayer("ui/**"),
        sameFeatureLayer("hooks/**"),
        ANY_FEATURE_INDEX,
        element("shared-*"),
        element("i18n"),
      ],
    },
  },
  {
    from: featureLayer("ui/**"),
    allow: { to: [sameFeatureLayer("domain/**")], dependency: { kind: "type" } },
  },
  {
    from: element("shared-lib"),
    allow: { to: [element("shared-lib")] },
  },
  {
    from: element("shared-config"),
    allow: { to: [element("shared-config"), element("shared-lib")] },
  },
  {
    from: element("shared-ui"),
    allow: { to: [element("shared-ui"), element("shared-lib"), element("i18n")] },
  },
  {
    from: element("integrations"),
    allow: {
      to: [element("integrations"), element("shared-lib"), element("shared-config")],
    },
  },
  {
    from: element("i18n"),
    allow: { to: [element("i18n"), element("shared-lib")] },
  },
];
