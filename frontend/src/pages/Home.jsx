import homeIcon from "../assets/HomeIcon.png";
import homeIcon2 from "../assets/HomeIcon2.jpeg";

function Home() {
  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          min-height: 100%;
        }

        body {
          font-family: Arial, sans-serif;
          background: #ffffff;
        }

        /* ================= HEADER ================= */

        .header {
          width: 100%;
          min-height: 80px;
          padding: 0 6%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          background: #ffffff;
          border-bottom: 1px solid #e8edf3;

          position: relative;
          z-index: 1000;
        }

        /* ================= LOGO ================= */

        .logo {
          display: flex;
          align-items: center;

          text-decoration: none;
          cursor: pointer;
        }

        .logo-image {
          width: 140px;
          height: 140px;
          object-fit: contain;
          display: block;
          transform: scale(3.4);
        }

        /* ================= LOGIN ================= */

        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 9px;

          padding: 12px 24px;

          border: none;
          border-radius: 8px;

          background: #1769e0;
          color: #ffffff;

          font-size: 15px;
          font-weight: 600;

          cursor: pointer;

          transition: all 0.25s ease;
        }

        .login-btn:hover {
          background: #0b1f3a;
          transform: translateY(-1px);
        }

        /* ================= LARGE LAPTOP ================= */

        @media (min-width: 1200px) {

          .header {
            min-height: 86px;
            padding: 0 7%;
            padding: 0 3% 0 6%;
          }

          .logo-image {
            width: 62px;
            height: 62px;
          }

          .login-btn {
            padding: 13px 28px;
            font-size: 16px;
          }
        }

        /* ================= TABLET ================= */

        @media (max-width: 900px) {

          .header {
            padding: 0 5%;
          }

          .logo-image {
            width: 52px;
            height: 52px;
          }

          .login-btn {
            padding: 11px 20px;
          }
        }

        /* ================= MOBILE ================= */

        @media (max-width: 600px) {

          .header {
            min-height: 68px;
            padding: 0 4%;
          }

          .logo-image {
            width: 44px;
            height: 44px;
            tranform: scale(1);
          }

          .login-btn {
            padding: 9px 15px;
            font-size: 14px;
            border-radius: 7px;
          }
        }

        /* ================= SMALL MOBILE ================= */

        @media (max-width: 400px) {

          .header {
            min-height: 64px;
            padding: 0 9%;
          }

          .logo-image {
            width: 90px;
            height: 40px;
            transform: scale(1.6);
          }

          .login-btn {
            padding: 8px 12px;
            font-size: 13px;
          }
        }

        /* ================= VERY SMALL SCREEN ================= */

        @media (max-width: 320px) {

          .logo-image {
            width: 36px;
            height: 36px;
          }

          .login-btn {
            padding: 7px 10px;
            font-size: 12px;
          }
        }
      `}</style>

      {/* ================= HEADER ================= */}

      <header className="header">

        {/* Logo */}
        <a href="/" className="logo">
          <picture>
            <source media="(max-width: 600px)" srcSet={homeIcon} />

            <img
              src={homeIcon}
              alt="Agentic AI Smart Library"
              className="logo-image"
            />
          </picture>
        </a>

        {/* Login */}
        <button className="login-btn">
          <i className="fa-solid fa-right-to-bracket"></i>
          Login
        </button>

      </header>
    </>
  );
}

export default Home;