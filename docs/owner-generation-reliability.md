# Owner generation reliability

Long owner full-stack generations must not depend on a single oversized JSON response. DeepSeek Flash is the primary provider. The generation controller uses a bounded full-stack output budget and compact retry rules so a complete project fits within the provider response budget. Gemini Flash remains the fallback provider.

The owner prompt-length bypass is enforced separately from provider generation. A provider failure must never delete or modify an existing project.
