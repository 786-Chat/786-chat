const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

function patchObjectStorage(source: string): string {
  if (!source) return source
  let next = source

  const oldReturn = '      return { __vercelBlobPath: pathname, __ownerBranchId: ownerBranchId } as unknown as File;'
  const newReturn = [
    '      const virtualFile = {',
    '        __vercelBlobPath: pathname,',
    '        __ownerBranchId: ownerBranchId,',
    '        download: async () => {',
    '          const { get } = await import("@vercel/blob");',
    '          const result = await get(pathname, { access: "private" });',
    '          if (!result || result.statusCode !== 200) throw new ObjectNotFoundError();',
    '          const bytes = Buffer.from(await new Response(result.stream as any).arrayBuffer());',
    '          return [bytes];',
    '        },',
    '      };',
    '      return virtualFile as unknown as File;',
  ].join("\n")

  if (next.includes(oldReturn) && !next.includes('download: async () => {')) {
    next = next.replace(oldReturn, newReturn)
  }

  return next
}

function patchMonthlyReportRoutes(source: string): string {
  if (!source) return source
  let next = source

  const needles = [
    "        category: 'monthly-reports',\n        filename: req.file.originalname\n      });",
    '        category: "monthly-reports",\n        filename: req.file.originalname\n      });',
  ]

  for (const needle of needles) {
    if (!next.includes(needle)) continue
    const guard = `${needle}\n\n      if (process.env.VERCEL && !filepath.startsWith('/objects/vercel/')) {\n        throw new Error('Monthly report was not persisted to durable Vercel Blob storage');\n      }`
    next = next.replace(needle, guard)
  }

  return next
}

export function hardenPestControlMonthlyReports(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  const next = { ...files }
  const objectStoragePath = "server/objectStorage.ts"
  const routesPath = "server/routes.ts"

  if (next[objectStoragePath]) next[objectStoragePath] = patchObjectStorage(next[objectStoragePath])
  if (next[routesPath]) next[routesPath] = patchMonthlyReportRoutes(next[routesPath])

  return next
}
