function ensureScaffoldBuildDependencies(files: Record<string, string>): Record<string, string> {
  const repaired = { ...files }
  const rawPackage = repaired["package.json"]
  if (!rawPackage) return repaired

  try {
    const parsed = JSON.parse(rawPackage) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      [key: string]: unknown
    }
    const dependencies = { ...(parsed.dependencies || {}) }
    const devDependencies = { ...(parsed.devDependencies || {}) }
    let changed = false

    const ensureDevDependency = (name: string, version: string) => {
      if (dependencies[name] || devDependencies[name]) return
      devDependencies[name] = version
      changed = true
    }

    // The generated scaffold always supplies Tailwind/PostCSS configuration files.
    // Ensure an existing package.json has the matching build dependencies too,
    // otherwise isolated builds fail with "Cannot find module tailwindcss/autoprefixer".
    ensureDevDependency("tailwindcss", "^3.4.17")
    ensureDevDependency("postcss", "^8.4.49")
    ensureDevDependency("autoprefixer", "^10.4.20")

    if (changed) {
      repaired["package.json"] = `${JSON.stringify({
        ...parsed,
        dependencies,
        devDependencies,
      }, null, 2)}\n`
    }
  } catch {
    // Validation will report malformed package.json separately. Do not replace
    // customer package content when it cannot be parsed safely here.
  }

  return repaired
}

export function ensureGeneratedScaffold(files: Record<string, string>): Record<string, string> {
  const repaired: Record<string, string> = { ...files }

  if (!repaired["package.json"]) {
    repaired["package.json"] = JSON.stringify(
      {
        name: "generated-786-chat-project",
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
        },
        dependencies: {
          next: "15.4.6",
          react: "19.1.0",
          "react-dom": "19.1.0",
          "lucide-react": "^0.468.0",
          clsx: "^2.1.1",
          "tailwind-merge": "^2.6.0",
        },
        devDependencies: {
          typescript: "^5.7.2",
          "@types/node": "^22.10.2",
          "@types/react": "^19.0.2",
          "@types/react-dom": "^19.0.2",
          tailwindcss: "^3.4.17",
          postcss: "^8.4.49",
          autoprefixer: "^10.4.20",
        },
      },
      null,
      2,
    )
  }

  if (!repaired["tsconfig.json"]) {
    repaired["tsconfig.json"] = JSON.stringify(
      {
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    )
  }

  if (!repaired["next-env.d.ts"]) {
    repaired["next-env.d.ts"] = "/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />\n\n// This file is generated automatically by 786.Chat.\n"
  }

  if (!repaired["next.config.mjs"] && !repaired["next.config.js"] && !repaired["next.config.ts"]) {
    repaired["next.config.mjs"] = "/** @type {import('next').NextConfig} */\nconst nextConfig = {}\n\nexport default nextConfig\n"
  }

  if (!repaired["postcss.config.mjs"] && !repaired["postcss.config.js"]) {
    repaired["postcss.config.mjs"] = "export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n"
  }

  if (!repaired["tailwind.config.ts"] && !repaired["tailwind.config.js"] && !repaired["tailwind.config.cjs"]) {
    repaired["tailwind.config.ts"] = "import type { Config } from 'tailwindcss'\n\nconst config: Config = {\n  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],\n  theme: { extend: {} },\n  plugins: [],\n}\n\nexport default config\n"
  }

  return ensureScaffoldBuildDependencies(repaired)
}

export function scaffoldAdditions(files: Record<string, string>): Record<string, string> {
  const repaired = ensureGeneratedScaffold(files)
  return Object.fromEntries(
    Object.entries(repaired).filter(([path, content]) => files[path] !== content),
  )
}
