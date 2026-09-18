import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("builder mounts a compact route bar for exact live preview paths", async () => {
  const [wrapper, routeBar] = await Promise.all([
    read("components/786-chat/workspace-with-projects-route.tsx"),
    read("components/786-chat/preview-route-bar.tsx"),
  ])

  assert.match(wrapper, /<PreviewRouteBar \/>/)
  assert.match(routeBar, /iframe\[title\$="compiled preview"\]/)
  assert.match(routeBar, /786chat_preview_route_/)
  assert.match(routeBar, /new URL\(next, current\.origin\)/)
  assert.match(routeBar, /max-w-\[280px\]/)
  assert.match(routeBar, /min-w-\[118px\]/)
  assert.match(routeBar, /Live preview route/)
})
