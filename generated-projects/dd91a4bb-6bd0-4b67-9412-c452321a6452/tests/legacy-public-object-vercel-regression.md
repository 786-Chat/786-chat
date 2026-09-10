# FoodSafety legacy public-object Vercel regression

This generated-project repair protects imported legacy `/objects/public/*` references on Vercel.

Expected behavior:

- Existing `/objects/vercel/*` paths continue to resolve through private Vercel Blob.
- Legacy `/objects/public/<filename>` paths try compatible Vercel Blob locations first.
- If the imported binary was never migrated, the runtime throws `ObjectNotFoundError` so the existing route returns a normal not-found response instead of crashing on missing Replit `PRIVATE_OBJECT_DIR`.
- No restaurant, branch, menu, payment, or customer data is modified.
