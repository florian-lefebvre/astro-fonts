# `@astrolicious/fonts`

This is an [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that allows plug-and-play web font optimization and configuration.

## Usage

### Prerequisites

TODO:

### Installation

Install the integration **automatically** using the Astro CLI:

```bash
pnpm astro add @astrolicious/fonts
```

```bash
npx astro add @astrolicious/fonts
```

```bash
yarn astro add @astrolicious/fonts
```

Or install it **manually**:

1. Install the required dependencies

```bash
pnpm add @astrolicious/fonts
```

```bash
npm install @astrolicious/fonts
```

```bash
yarn add @astrolicious/fonts
```

2. Add the integration to your astro config

```diff
+import integration from "@astrolicious/fonts";

export default defineConfig({
  integrations: [
+    integration(),
  ],
});
```

### Configuration

TODO:configuration

## Contributing

This package is structured as a monorepo:

- `playground` contains code for testing the package
- `package` contains the actual package

Install dependencies using pnpm: 

```bash
pnpm i --frozen-lockfile
```

Start the playground and package watcher:

```bash
pnpm dev
```

You can now edit files in `package`. Please note that making changes to those files may require restarting the playground dev server.

## Licensing

[MIT Licensed](https://github.com/astrolicious/fonts/blob/main/LICENSE). Made with ❤️ by [Florian Lefebvre](https://github.com/florian-lefebvre).

## Acknowledgements

- [Nuxt fonts module](https://github.com/nuxt/fonts)
