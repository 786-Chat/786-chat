import { hardenPestControlDeviceBackups } from "./pestcontrol-device-backup-hardening"
import { hardenPestControlScopedDeviceBackups } from "./pestcontrol-scoped-device-backup-hardening"

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

  if (next.includes(oldReturn) && !next.includes('download: async () => {')) next = next.replace(oldReturn, newReturn)
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
    '    const branch = await this.getBranch(branchId);',
    '    if (!branch) throw new Error(\'Branch not found\');',
    '',
    '    const now = new Date();',
    '    const nextDueDate = new Date(now);',
    '    nextDueDate.setDate(nextDueDate.getDate() + 30);',
    '',
    '    // Remove legacy duplicate rows created by the old copy-on-send implementation.',
    '    // The original uploaded report remains the single canonical card.',
    '    await db.delete(monthlyReports).where(',
    '      and(',
    '        eq(monthlyReports.filepath, original.filepath),',
    '        ne(monthlyReports.id, reportId)',
    '      )',
    '    );',
    '',
    '    const [updatedReport] = await db',
    '      .update(monthlyReports)',
    '      .set({ branchId, sentAt: now, receivedAt: now, updatedAt: now })',
    '      .where(eq(monthlyReports.id, reportId))',
    '      .returning();',
    '',
    '    await db',
    '      .update(branches)',
    '      .set({ lastInspection: now, nextDue: nextDueDate, updatedAt: now })',
    '      .where(eq(branches.id, branchId));',
    '',
    '    console.log(`Monthly report "${updatedReport.title}" assigned to branch ${branchId}; duplicate cards removed`);',
    '    return updatedReport;',
    '  }',
    '',
  ].join('\n')
  return source.slice(0, start) + replacement + source.slice(end)
}

function patchDeviceBackupDateFormatter(source: string): string {
  if (!source) return source
  return source.replace(
    'formatUkDateTime(deviceBackup.created_at)',
    'new Date(deviceBackup.created_at).toLocaleString("en-GB", { timeZone: "Europe/London" })',
  )
}

const ADMIN_DEVICE_SUMMARY_BLOCK = "                {/* Food Safety device summary only — detailed device cards stay in Smart Devices */}\n                <div className=\"grid grid-cols-1 gap-6\">\n                  <div className=\"group\">\n                    <div className=\"relative h-full transform transition-all duration-300 group-hover:scale-[1.01]\">\n                      <div className={`absolute inset-0 rounded-2xl blur-xl ${iotAlarmDevices.length ? \"bg-red-500/20\" : \"bg-blue-500/20\"}`}></div>\n                      <Card className=\"relative h-full rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl\">\n                        <CardHeader className=\"pb-4\">\n                          <div className=\"flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between\">\n                            <div>\n                              <CardTitle className=\"flex items-center space-x-3 text-lg font-bold text-white\">\n                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iotAlarmDevices.length ? \"bg-red-500\" : \"bg-gradient-to-br from-blue-500 to-cyan-500\"}`}>\n                                  {iotAlarmDevices.length ? <Bell className=\"h-5 w-5 text-white\" /> : <Globe className=\"h-5 w-5 text-white\" />}\n                                </div>\n                                <span>Device Monitoring & Alerts</span>\n                              </CardTitle>\n                              <CardDescription className=\"mt-1 text-slate-400\">\n                                Admin overview only. Open Smart Devices and select a branch to view individual device cards.\n                              </CardDescription>\n                            </div>\n                            <Button onClick={() => setActiveTab(\"iot-cloud\")} variant=\"outline\" className=\"border-slate-600 text-slate-200\">\n                              Open Smart Devices\n                            </Button>\n                          </div>\n                        </CardHeader>\n                        <CardContent className=\"space-y-4\">\n                          <div className=\"grid grid-cols-2 gap-2 sm:grid-cols-4\">\n                            <div className=\"rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center\">\n                              <p className=\"text-2xl font-bold text-blue-200\">{iotDevices.length}</p>\n                              <p className=\"text-xs text-blue-200/80\">Assigned</p>\n                            </div>\n                            <div className=\"rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center\">\n                              <p className=\"text-2xl font-bold text-emerald-300\">{iotOnlineCount}</p>\n                              <p className=\"text-xs text-emerald-200\">Online</p>\n                            </div>\n                            <div className=\"rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center\">\n                              <p className=\"text-2xl font-bold text-slate-200\">{iotOfflineCount}</p>\n                              <p className=\"text-xs text-slate-400\">Offline</p>\n                            </div>\n                            <div className={`rounded-xl border p-3 text-center ${iotAlarmDevices.length ? \"border-red-500/40 bg-red-500/15\" : \"border-emerald-500/20 bg-emerald-500/10\"}`}>\n                              <p className={`text-2xl font-bold ${iotAlarmDevices.length ? \"text-red-300\" : \"text-emerald-300\"}`}>{iotAlarmDevices.length}</p>\n                              <p className={`text-xs ${iotAlarmDevices.length ? \"text-red-200\" : \"text-emerald-200\"}`}>Active Alerts</p>\n                            </div>\n                          </div>\n\n                          <div className=\"rounded-xl border border-slate-700 bg-slate-900/50 p-4\">\n                            <div className=\"mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between\">\n                              <div>\n                                <h3 className=\"font-semibold text-white\">Alarm / Catch History</h3>\n                                <p className=\"text-xs text-slate-400\">Recent catches remain visible after Stop/Acknowledge.</p>\n                              </div>\n                              <span className=\"text-xs text-slate-500\">{iotAlarmHistory.length} recorded event{iotAlarmHistory.length === 1 ? \"\" : \"s\"}</span>\n                            </div>\n                            {iotAlarmHistory.length === 0 ? (\n                              <p className=\"rounded-lg bg-slate-800/60 p-3 text-sm text-slate-400\">No recorded trap alarms yet.</p>\n                            ) : (\n                              <div className=\"space-y-2\">\n                                {iotAlarmHistory.slice(0, 5).map((event: any) => (\n                                  <div key={event.id} className=\"rounded-lg border border-slate-700/70 bg-slate-800/60 p-3\">\n                                    <div className=\"flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between\">\n                                      <div className=\"min-w-0\">\n                                        <div className=\"flex flex-wrap items-center gap-2\">\n                                          <span className=\"font-semibold text-white\">{event.deviceName || \"Food Safety Smart Device\"}</span>\n                                          {event.isTest && <span className=\"rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300\">TEST</span>}\n                                        </div>\n                                        <p className=\"mt-1 text-xs text-slate-300\">\n                                          Branch: {event.branchName || \"Unknown branch\"}\n                                          {event.location ? \" • Location: \" + event.location : \"\"}\n                                        </p>\n                                        <p className=\"mt-1 text-xs text-slate-400\">{event.message}</p>\n                                      </div>\n                                      <div className=\"flex-shrink-0 text-xs font-medium text-slate-300\">\n                                        {event.eventAt ? new Date(event.eventAt).toLocaleString(\"en-GB\") : \"Unknown time\"}\n                                      </div>\n                                    </div>\n                                  </div>\n                                ))}\n                              </div>\n                            )}\n                          </div>\n                        </CardContent>\n                      </Card>\n                    </div>\n                  </div>\n                </div>\n\n"

function patchAdminDashboardDeviceCards(source: string): string {
  if (!source) return source

  const summaryMarker = '                {/* Food Safety device summary only — detailed device cards stay in Smart Devices */}'
  const fullStartMarker = '                {/* Live Food Safety Device Monitoring & Alarm Card */}'
  const endMarker = '                {/* Additional Dashboard Widgets */}'

  if (source.includes(summaryMarker)) return source

  const fullStart = source.indexOf(fullStartMarker)
  const end = source.indexOf(endMarker, Math.max(0, fullStart))
  if (fullStart >= 0 && end >= 0) {
    return source.slice(0, fullStart) + ADMIN_DEVICE_SUMMARY_BLOCK + source.slice(end)
  }

  const insertAt = source.indexOf(endMarker)
  if (insertAt >= 0) {
    return source.slice(0, insertAt) + ADMIN_DEVICE_SUMMARY_BLOCK + source.slice(insertAt)
  }

  return source
}

export function hardenPestControlMonthlyReports(projectId: string, files: Record<string, string>): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files
  const next = { ...files }
  const objectStoragePath = "server/objectStorage.ts"
  const routesPath = "server/routes.ts"
  const storagePath = "server/storage.ts"
  if (next[objectStoragePath]) next[objectStoragePath] = patchObjectStorage(next[objectStoragePath])
  if (next[routesPath]) next[routesPath] = patchMonthlyReportRoutes(next[routesPath])
  if (next[storagePath]) next[storagePath] = patchMonthlyReportSend(next[storagePath])

  const hardened = hardenPestControlDeviceBackups(projectId, next)
  const iotAdminPath = "client/src/components/IotAdminPanel.tsx"
  if (hardened[iotAdminPath]) hardened[iotAdminPath] = patchDeviceBackupDateFormatter(hardened[iotAdminPath])

  const scoped = hardenPestControlScopedDeviceBackups(projectId, hardened)
  const adminDashboardPath = "client/src/pages/AdminDashboard.tsx"
  if (scoped[adminDashboardPath]) scoped[adminDashboardPath] = patchAdminDashboardDeviceCards(scoped[adminDashboardPath])
  return scoped
}
