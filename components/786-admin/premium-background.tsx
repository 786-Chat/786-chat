"use client"

import styles from "./premium-background.module.css"

export type AdminVisualTheme = "cosmic" | "emerald" | "ocean" | "midnight" | "pearl"

const variables: Record<AdminVisualTheme, React.CSSProperties> = {
  cosmic: {
    "--admin-accent": "139 92 246",
    "--admin-secondary": "34 211 238",
    "--admin-tertiary": "236 72 153",
    "--admin-bg-start": "3 2 14",
    "--admin-bg-mid": "12 7 31",
    "--admin-bg-end": "2 7 18",
  } as React.CSSProperties,
  emerald: {
    "--admin-accent": "16 185 129",
    "--admin-secondary": "34 211 238",
    "--admin-tertiary": "163 230 53",
    "--admin-bg-start": "1 13 12",
    "--admin-bg-mid": "3 31 27",
    "--admin-bg-end": "2 10 18",
  } as React.CSSProperties,
  ocean: {
    "--admin-accent": "14 165 233",
    "--admin-secondary": "99 102 241",
    "--admin-tertiary": "34 211 238",
    "--admin-bg-start": "2 6 23",
    "--admin-bg-mid": "4 20 48",
    "--admin-bg-end": "2 8 21",
  } as React.CSSProperties,
  midnight: {
    "--admin-accent": "71 85 105",
    "--admin-secondary": "59 130 246",
    "--admin-tertiary": "139 92 246",
    "--admin-bg-start": "0 0 0",
    "--admin-bg-mid": "4 8 18",
    "--admin-bg-end": "2 6 14",
  } as React.CSSProperties,
  pearl: {
    "--admin-accent": "99 102 241",
    "--admin-secondary": "14 165 233",
    "--admin-tertiary": "168 85 247",
    "--admin-bg-start": "235 239 255",
    "--admin-bg-mid": "245 247 255",
    "--admin-bg-end": "226 232 255",
  } as React.CSSProperties,
}

export function PremiumAdminBackground({ theme = "cosmic" }: { theme?: AdminVisualTheme }) {
  return (
    <div className={styles.backdrop} style={variables[theme]} aria-hidden="true">
      <span className={`${styles.orb} ${styles.orbOne}`} />
      <span className={`${styles.orb} ${styles.orbTwo}`} />
      <span className={`${styles.orb} ${styles.orbThree}`} />
      <span className={styles.sparkles} />
      <span className={styles.vignette} />
    </div>
  )
}
