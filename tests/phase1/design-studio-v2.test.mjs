import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("786.Chat mounts Design Studio without replacing the existing workspace", async () => {
  const page = await read("app/786.chat/page.tsx")
  const overlay = await read("components/786-chat/design-studio-overlay.tsx")

  assert.match(page, /SevenEightSixWorkspace/)
  assert.match(page, /DesignStudioOverlay/)
  assert.match(overlay, /findNativeDesignPanel/)
  assert.match(overlay, /VVIP Visual Editor/)
  assert.match(overlay, /Suggested & custom sizes/)
  assert.match(overlay, /Text & fonts/)
  assert.match(overlay, /Elements/)
})

test("Design Studio exposes searchable size presets in px, inches and cm", async () => {
  const studio = await read("lib/786-chat/design-studio.ts")
  const overlay = await read("components/786-chat/design-studio-overlay.tsx")

  assert.match(studio, /STUDIO_SIZE_PRESETS/)
  assert.match(studio, /1366/)
  assert.match(studio, /1242/)
  assert.match(studio, /43\.18/)
  assert.match(studio, /unit: "px"/)
  assert.match(studio, /unit: "in"/)
  assert.match(studio, /unit: "cm"/)
  assert.match(studio, /sizeToPixels/)
  assert.match(overlay, /Search resize options/)
  assert.match(overlay, /Apply custom size/)
})

test("Design Studio provides font, text effect and brand-font controls", async () => {
  const studio = await read("lib/786-chat/design-studio.ts")
  const overlay = await read("components/786-chat/design-studio-overlay.tsx")
  const visualEditor = await read("lib/786-chat/visual-editor.ts")

  assert.match(studio, /STUDIO_FONTS/)
  assert.match(studio, /Bebas Neue/)
  assert.match(studio, /Playfair Display/)
  assert.match(studio, /Press Start 2P/)
  assert.match(studio, /STUDIO_TEXT_PRESETS/)
  assert.match(studio, /NEW PRODUCT/)
  assert.match(studio, /COMING SOON/)
  assert.match(overlay, /Brand fonts/)
  assert.match(overlay, /Recently used/)
  assert.match(overlay, /Letter spacing/)
  assert.match(overlay, /Line height/)
  assert.match(visualEditor, /"shadow"/)
  assert.match(visualEditor, /"outline"/)
  assert.match(visualEditor, /"glow"/)
  assert.match(visualEditor, /"neon"/)
  assert.match(visualEditor, /"gradient"/)
  assert.match(visualEditor, /"threeD"/)
})

test("Design Studio persists original element categories and media support", async () => {
  const studio = await read("lib/786-chat/design-studio.ts")
  const overlay = await read("components/786-chat/design-studio-overlay.tsx")
  const visualEditor = await read("lib/786-chat/visual-editor.ts")
  const upload = await read("app/api/upload/route.ts")

  for (const category of ["Shapes", "Frames", "Graphics", "Forms", "Tables", "Charts", "Mockups", "3D"]) {
    assert.match(studio, new RegExp(`"${category}"`))
  }
  assert.match(studio, /STUDIO_BACKGROUND_PRESETS/)
  assert.match(overlay, /Photos & videos/)
  assert.match(overlay, /Upload photo or video/)
  assert.match(visualEditor, /textBlocks/)
  assert.match(visualEditor, /elements/)
  assert.match(visualEditor, /786-editor:studio-selected/)
  assert.match(upload, /video\/mp4/)
  assert.match(upload, /video\/webm/)
  assert.match(upload, /video\/quicktime/)
})

test("Studio state survives older visual-editor saves and requires verified rebuild before deploy", async () => {
  const route = await read("app/api/786-chat/projects/[id]/visual-editor/route.ts")
  const overlay = await read("components/786-chat/design-studio-overlay.tsx")
  const visualEditor = await read("lib/786-chat/visual-editor.ts")

  assert.match(route, /existingState/)
  assert.match(route, /incomingState/)
  assert.match(route, /\.\.\.existingState/)
  assert.match(route, /\.\.\.incomingState/)
  assert.match(visualEditor, /VISUAL_EDITOR_BRIDGE_VERSION/)
  assert.match(visualEditor, /786_STUDIO_V2/)
  assert.match(overlay, /data-786-publish/)
  assert.match(overlay, /queueBuilderBuild/)
  assert.match(overlay, /Build passed/)
  assert.match(overlay, /Upgrade Studio & rebuild/)
})

test("Escape closes Design Studio and prompt input still accepts literal special characters", async () => {
  const overlay = await read("components/786-chat/design-studio-overlay.tsx")
  const workspace = await read("components/786-chat/workspace.tsx")
  const specialCharacters = `+ _ x % $ £ & < > ( ) { } [ ] " ; : ' @ . , / ? | - * =`

  assert.ok(specialCharacters.includes("£"))
  assert.ok(specialCharacters.includes("{"))
  assert.ok(specialCharacters.includes("}"))
  assert.match(overlay, /event\.key !== "Escape"/)
  assert.match(overlay, /setTab\(null\)/)
  assert.match(overlay, /Esc closes this Studio panel without changing your AI prompt/)
  assert.match(workspace, /value=\{prompt\}/)
  assert.match(workspace, /onChange=\{\(event\) => setPrompt\(event\.target\.value\)\}/)
  assert.doesNotMatch(workspace, /setPrompt\([^)]*replace\(/)
})
