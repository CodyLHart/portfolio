import styles from "./LandingPage.module.css";

export function LandingPage({
  onSignIn,
  statusMessage,
}: {
  onSignIn: () => void;
  statusMessage: string | null;
}) {
  return (
    <main className={styles.main}>
      <section className={styles.landing} aria-labelledby="landing-title">
        <div className={styles.copy}>
          <p className="eyebrow">Lists</p>
          <h1 className={styles.title} id="landing-title">
            Keep the things you need in one place.
          </h1>
          <p className={styles.description}>
            Create simple lists for errands, projects, trips, ideas, and
            anything else you want to keep organized.
          </p>
          <div className={`inline-actions ${styles.actions}`}>
            <button
              className={`primary-button ${styles.googleButton}`}
              onClick={onSignIn}
              type="button"
            >
              Continue with Google
            </button>
            <span className="muted">Your lists stay with your account.</span>
          </div>
          {statusMessage ? (
            <p className="status-message" role="status">
              {statusMessage}
            </p>
          ) : null}
        </div>
        <div className={styles.preview} aria-label="App preview">
          <div className={styles.previewSidebar}>
            <span className={styles.previewBrand}>Lists</span>
            <button
              className={`${styles.previewList} ${styles.previewListActive}`}
              type="button"
            >
              <span>Weekend errands</span>
              <small>5 items</small>
            </button>
            <button className={styles.previewList} type="button">
              <span>Trip planning</span>
              <small>8 items</small>
            </button>
            <button className={styles.previewList} type="button">
              <span>House projects</span>
              <small>3 items</small>
            </button>
          </div>
          <div className={styles.previewDetail}>
            <div>
              <p className="eyebrow">Current list</p>
              <h2>Weekend errands</h2>
            </div>
            <div className={styles.previewInput}>Add an item</div>
            <ul className={styles.previewItems}>
              <li><span /> Pick up coffee</li>
              <li><span /> Return library books</li>
              <li className={styles.done}><span /> Water plants</li>
            </ul>
          </div>
        </div>
        <div className={styles.benefits}>
          <span>Separate lists for every part of life</span>
          <span>Shared editing with people you trust</span>
          <span>Fast add, complete, edit, and restore</span>
        </div>
      </section>
    </main>
  );
}
