import Image from "next/image"

import styles from "./animated-world-background.module.css"

type AnimatedWorldBackgroundProps = {
  intensity?: "full" | "subtle"
}

const WORLD_ART =
  "https://seven86-chat-v2.link24-7days.chatgpt.site/hero-blue-glass-v2.png"

export function AnimatedWorldBackground({
  intensity = "full",
}: AnimatedWorldBackgroundProps) {
  return (
    <div
      className={`${styles.scene} ${styles[intensity]}`}
      aria-hidden="true"
    >
      <span className={styles.stars} />
      <Image
        className={styles.art}
        src={WORLD_ART}
        alt=""
        fill
        sizes="100vw"
        priority
        unoptimized
      />
      <div className={styles.world}>
        <span className={styles.globe} />
        <span className={`${styles.orbit} ${styles.orbitOne}`} />
        <span className={`${styles.orbit} ${styles.orbitTwo}`} />
        <span className={`${styles.orbit} ${styles.orbitThree}`} />
        <span className={styles.worldHighlight} />
      </div>
      <span className={`${styles.caustics} ${styles.causticsOne}`} />
      <span className={`${styles.caustics} ${styles.causticsTwo}`} />
      <span className={styles.reflection} />
    </div>
  )
}
