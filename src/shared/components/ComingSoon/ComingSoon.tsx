import styles from "./ComingSoon.module.css";

export function ComingSoon() {
  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <h1 className={styles.brand}>WCIL</h1>

        <span className={styles.badge}>Coming soon</span>

        <h2 className={styles.heading}>We&apos;re building something new</h2>
      </div>
    </main>
  );
}
