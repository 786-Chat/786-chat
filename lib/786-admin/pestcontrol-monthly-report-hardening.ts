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
    '          const chunks: Buffer[] = [];',
    '          for await (const chunk of result.stream as any) {',
    '            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));',
    '          }',
    '          return [Buffer.concat(chunks)];',
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

function patchMonthlyReportSend(source: string): string {
  if (!source) return source

  const startMarker = '  async sendMonthlyReportToBranch(reportId: string, branchId: string): Promise<MonthlyReport> {'
  const endMarker = '  // Yearly Docs operations'
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, Math.max(0, start))
  if (start < 0 || end <= start) return source

  const replacement = [
    '  async sendMonthlyReportToBranch(reportId: string, branchId: string): Promise<MonthlyReport> {',
    '    const original = await this.getMonthlyReport(reportId);',
    '    if (!original) throw new Error(\'Report not found\');',
    '',
    '    const branch = await this.getBranch(branchId);',
    '    if (!branch) throw new Error(\'Branch not found\');',
    '',
    '    const now = new Date();',
    '    const nextDueDate = new Date(now);',
    '    nextDueDate.setDate(nextDueDate.getDate() + 30);',
    '',
    '    // One report = one database record. Sending assigns the existing card',
    '    // to the selected branch instead of creating a duplicate copy.',
    '    const [updatedReport] = await db',
    '      .update(monthlyReports)',
    '      .set({',
    '        branchId,',
    '        sentAt: now,',
    '        receivedAt: now,',
    '        updatedAt: now,',
    '      })',
    '      .where(eq(monthlyReports.id, reportId))',
    '      .returning();',
    '',
    '    await db',
    '      .update(branches)',
    '      .set({ lastInspection: now, nextDue: nextDueDate, updatedAt: now })',
    '      .where(eq(branches.id, branchId));',
    '',
    '    console.log(`Monthly report "${updatedReport.title}" assigned to branch ${branchId} without creating a duplicate`);',
    '    return updatedReport;',
    '  }',
    '',
  ].join('\n')

  return source.slice(0, start) + replacement + source.slice(end)
}

export function hardenPestControlMonthlyReports(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  const next = { ...files }
  const objectStoragePath = "server/objectStorage.ts"
  const routesPath = "server/routes.ts"
  const storagePath = "server/storage.ts"

  if (next[objectStoragePath]) next[objectStoragePath] = patchObjectStorage(next[objectStoragePath])
  if (next[routesPath]) next[routesPath] = patchMonthlyReportRoutes(next[routesPath])
  if (next[storagePath]) next[storagePath] = patchMonthlyReportSend(next[storagePath])

  return next
}