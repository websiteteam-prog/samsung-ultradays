import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <>
      {/* Top banner — different image for mobile vs desktop (decorative) */}
      <div className="top-banner">
        <img className="banner-desktop" src="/samsung.png" alt="" />
        <img className="banner-mobile" src="/samsung_mobile.png" alt="" />
      </div>

      <div className="wrap">
        {/* <div className="brand">
          <span className="dot" />
          My Galaxy
        </div> */}

      <div style={{ marginTop: 28 }}>
        <span className="eyebrow">Store reward program</span>
        <h1>Register, Share & Win</h1>
        <p className="lead">
          Complete the steps below to claim your complimentary travel adapter and join the celebration on social media.
        </p>
      </div>

      <div className="gift-banner">
        <span className="ico">🎁</span>
        <div>
          <strong>Complete the steps below to win a gift</strong>
          <div className="note" style={{ marginTop: 2 }}>
            Unlock your gift after you register your purchase.
          </div>
        </div>
      </div>

      <div className="steps">
        <Link className="step" to="/register">
          <span className="num">1</span>
          <div>
            <h3>Register your purchase</h3>
            <small>Fill your details to unlock the gift.</small>
          </div>
        </Link>
        <Link className="step" to="/frame">
          <span className="num">2</span>
          <div>
            <h3>Create your branded frame</h3>
            <small>Upload a photo, get a frame, share it.</small>
          </div>
        </Link>
        <Link className="step" to="/submit">
          <span className="num">3</span>
          <div>
            <h3>Submit your social proof</h3>
            <small>Upload a screenshot of your post.</small>
          </div>
        </Link>
      </div>

        <p className="note" style={{ marginTop: 24, textAlign: "center" }}>
          Store staff? <Link to="/admin" style={{ color: "var(--violet-soft)" }}>Admin login</Link>
        </p>
      </div>
    </>
  );
}