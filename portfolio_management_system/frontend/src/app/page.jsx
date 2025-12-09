import Image from "next/image";
import styles from "./page.module.css";
import { redirect } from 'next/navigation';
import Link from 'next/link'


const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export function HomePage2() {
  redirect('/dashboard');
}


export const metadata = {
  title: 'Portfolio Management System',
};

export default function HomePage() {
  return (
    <div className="html-top-content">
      {/* Top banner + header */}
      <div className="theme-top-section">
        {/* Header / main menu */}
        <header className="theme-main-menu">
          <div className="container">
            <div className="menu-wrapper clearfix">
              <div className="logo">
                <Link href="/">
                  <h3>Logo Placeholder</h3>
                </Link>
              </div>

              <ul className="right-widget celarfix">
                {/* We don&apos;t know auth state here, so always show Login for now */}
                <li className="login-button">
                  <a href="/accounts/login">
                    Login <i className="flaticon-right-thin" />
                  </a>
                </li>
              </ul>

              {/* Navigation (anchors) */}
              <nav className="navbar navbar-expand-lg" id="mega-menu-holder">
                <div className="container">
                  <button
                    className="navbar-toggler"
                    type="button"
                    data-toggle="collapse"
                    data-target="#navbarResponsive"
                    aria-controls="navbarResponsive"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                  >
                    <i className="fa fa-bars" aria-hidden="true" />
                  </button>
                  <div className="collapse navbar-collapse" id="navbarResponsive">
                    <ul className="navbar-nav">
                      <li className="nav-item">
                        <a className="nav-link js-scroll-trigger" href="#features">
                          Feature
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link js-scroll-trigger" href="#services">
                          Services
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link js-scroll-trigger" href="#apps-review">
                          Apps Review
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link js-scroll-trigger" href="#progress">
                          Work Progress
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link js-scroll-trigger" href="#team">
                          Team
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link js-scroll-trigger" href="#contact">
                          Contact us
                        </a>
                      </li>
                      {/* Dashboard link goes to Next dashboard page */}
                      <li className="nav-item">
                        <Link className="nav-link js-scroll-trigger" href="/dashboard">
                          Dashboard
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Banner */}
        <div id="theme-banner" className="theme-banner-one">
          <img src="/home/images/home/k.png" alt="" className="illustration" />
          <img src="/home/images/icon/1.png" alt="" className="icon-shape-one" />
          <img src="/home/images/icon/2.png" alt="" className="icon-shape-two" />
          <img src="/home/images/icon/3.png" alt="" className="icon-shape-three" />
          <div className="container">
            <div className="main-text-wrapper">
              <h1>
                Portfolio <br />
                Management System
              </h1>
              <p>A revolutionary digital solution for managing your portfolio.</p>
              <ul className="button-group clearfix">
                <li>
                  <a href="#features">Explore</a>
                </li>
                <li>
                  <div className="btn-group">
                    <a
                      href="/accounts/login"
                      className="download-button"
                    >
                      Let&apos;s Get Started &nbsp; &#10230;
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Stock market ticker strip (static) */}
          <div className="container">
            <div className="stock-market-price">
              <div id="market-rate">
                <div className="item">
                  <div className="main-wrapper">
                    <div className="amount">43,815.09</div>
                    <h6 className="title">Sensex</h6>
                    <div className="current-info range-down">
                      <i className="icon flaticon-down-caret" />
                      <span className="rate">-67.09</span>
                    </div>
                  </div>
                </div>
                <div className="item">
                  <div className="main-wrapper">
                    <div className="amount">12,859.05</div>
                    <h6 className="title">Nifty</h6>
                    <div className="current-info range-up">
                      <i className="icon flaticon-up-carret" />
                      <span className="rate">+87.35</span>
                    </div>
                  </div>
                </div>
                <div className="item">
                  <div className="main-wrapper">
                    <div className="amount">50,260.00</div>
                    <h6 className="title">Gold</h6>
                    <div className="current-info range-up">
                      <i className="icon flaticon-up-carret" />
                      <span className="rate">+268</span>
                    </div>
                  </div>
                </div>
                <div className="item">
                  <div className="main-wrapper">
                    <div className="amount">62,260.00</div>
                    <h6 className="title">Silver</h6>
                    <div className="current-info range-up">
                      <i className="icon flaticon-up-carret" />
                      <span className="rate">+750</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>{' '}
        {/* /.theme-banner-one */}
      </div>{' '}
      {/* /.theme-top-section */}

      {/* Features */}
      <div className="our-features-one" id="features">
        <div className="container">
          <div className="theme-title">
            <h2>
              The Largest &amp; Best <span>System</span> <br />
              for Managing your Portfolio
            </h2>
          </div>

          <div className="row">
            <div className="col-md-4 col-xs-12">
              <div className="single-feature">
                <div className="icon-box">
                  <img
                    src="/home/images/icon/5.png"
                    alt=""
                    className="primary-icon"
                  />
                </div>
                <h3>Feature 1</h3>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
              </div>
            </div>
            <div className="col-md-4 col-xs-12">
              <div className="single-feature border-fix">
                <div className="icon-box">
                  <img
                    src="/home/images/icon/6.png"
                    alt=""
                    className="primary-icon"
                  />
                </div>
                <h3>Feature 2</h3>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
              </div>
            </div>
            <div className="col-md-4 col-xs-12">
              <div className="single-feature">
                <div className="icon-box">
                  <img
                    src="/home/images/icon/7.png"
                    alt=""
                    className="primary-icon"
                  />
                </div>
                <h3>Feature 3</h3>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services (our-feature-two) */}
      <div className="our-feature-two" id="services">
        <div className="container">
          <div className="row single-block">
            <div className="col-lg-6">
              <div className="text">
                <div className="number">01</div>
                <h2 className="title">
                  <span>Portfolio Management</span> our core focus
                </h2>
                <p>
                  Managing portfolio should be simple, that&apos;s why we provide user dashboard
                  for easy management of portfolio.
                </p>
                <a href="#" className="learn-more">
                  Learn More <i className="flaticon-right-thin" />
                </a>
              </div>
            </div>
            <div className="col-lg-6 img-box">
              <div>
                <img src="/home/images/shape/1.png" alt="" />
              </div>
            </div>
          </div>

          <div className="row single-block">
            <div className="col-lg-6 order-lg-last">
              <div className="text">
                <div className="number">02</div>
                <h2 className="title">
                  <span>Portfolio Analysis</span> makes simplified
                </h2>
                <p>
                  Portfolio without analysis is of no use! That&apos;s why we provide Portfolio
                  Insights in few clicks.
                </p>
                <a href="#" className="learn-more">
                  Learn More <i className="flaticon-right-thin" />
                </a>
              </div>
            </div>
            <div className="col-lg-6 order-lg-first img-box">
              <div>
                <img src="/home/images/shape/1.1.png" alt="" />
              </div>
            </div>
          </div>

          <div className="row single-block">
            <div className="col-lg-6">
              <div className="text">
                <div className="number">03</div>
                <h2 className="title">
                  <span>Smart Recommendations</span> with transparency
                </h2>
                <p>
                  We provide Machine Learning and Traditional Algorithmic based recommendations
                  for your portfolio with transparent backtest reports.
                </p>
                <a href="#" className="learn-more">
                  Learn More <i className="flaticon-right-thin" />
                </a>
              </div>
            </div>
            <div className="col-lg-6 img-box">
              <div>
                <img src="/home/images/shape/2.png" alt="" />
              </div>
            </div>
          </div>

          <div className="row single-block">
            <div className="col-lg-6 order-lg-last">
              <div className="text">
                <div className="number">04</div>
                <h2 className="title">
                  <span>Risk Analysis</span> with no efforts
                </h2>
                <p>
                  Recommendations without analysing user&apos;s risk makes no sense, that&apos;s why
                  analysing user&apos;s risk is our first priority.
                </p>
                <a href="#" className="learn-more">
                  Learn More <i className="flaticon-right-thin" />
                </a>
              </div>
            </div>
            <div className="col-lg-6 order-lg-first img-box">
              <div>
                <img src="/home/images/shape/1.1.png" alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apps overview */}
      <div className="apps-overview color-one" id="apps-review">
        <div
          className="overlay-bg"
          style={{ backgroundImage: 'url(/home/images/home/bg2.png)' }}
        >
          <div className="container">
            <div className="inner-wrapper">
              <img
                src="/home/images/home/s8.png"
                alt=""
                className="s8-mockup"
              />
              <img
                src="/home/images/home/x.png"
                alt=""
                className="x-mockup"
              />
              <div className="row">
                <div className="col-lg-5 offset-lg-7">
                  <div className="text">
                    <h3>don’t miss our apps</h3>
                    <h2>Mobile Application for Faster Access.</h2>
                    <h6>Now you can control dashboard from the mobile!</h6>
                    <p>
                      Our apps will be available soon at your fingertips on your mobile. Our Development Team is
                      committed to build apps for you and it will be available soon ...
                    </p>
                    <ul className="button-group">
                      <li>
                        <a href="#">
                          <i className="flaticon-apple" /> Apple Store
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <img
                            src="/home/images/icon/playstore.png"
                            alt=""
                          />{' '}
                          Google Play
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>{' '}
            {/* /.inner-wrapper */}
          </div>
        </div>
      </div>

      {/* Counter section */}
      <div className="theme-counter">
        <div className="container">
          <div className="bg-image">
            <div className="row theme-title">
              <div className="col-lg-6 order-lg-last">
                <h2>
                  <span>Fastest</span> Growing Global Network.
                </h2>
              </div>
              <div className="col-lg-6 order-lg-first">
                <p>
                  We’re the fastest growing portfolio management system with strong community &amp; security. Check
                  our info with numbers.
                </p>
              </div>
            </div>

            <div className="counter-wrapper">
              <div className="row">
                <div className="col-sm-4">
                  <h2 className="number">
                    <span className="timer">120</span>K
                  </h2>
                  <p>Global Customers</p>
                </div>
                <div className="col-sm-4">
                  <h2 className="number">
                    <span className="timer">36</span>
                  </h2>
                  <p>Portfolio Managed</p>
                </div>
                <div className="col-sm-4">
                  <h2 className="number">
                    <span className="timer">98</span>%
                  </h2>
                  <p>Recommendations Success Rate</p>
                </div>
              </div>
            </div>
          </div>{' '}
          {/* /.bg-image */}
        </div>
      </div>

      {/* Work progress */}
      <div className="our-work-progress bg-color" id="progress">
        <div className="main-wrapper clearfix">
          <div className="section-title-wrapper clearfix">
            <div className="theme-title">
              <div className="upper-heading">Solutions</div>
              <h2>
                <span>Work</span> Process &amp; Solutions.
              </h2>
              <p>Follow few simple steps and manage your portfolio easily.</p>
            </div>
          </div>
          <div className="progress-slider-wrapper">
            {/* Instead of slider, we just render the items statically */}
            <div className="progress-slider">
              {[
                {
                  icon: '/home/images/icon/11.png',
                  title: 'Create Account with Email',
                  text: 'Create your own account or login with social accounts.',
                  num: '1',
                },
                {
                  icon: '/home/images/icon/12.png',
                  title: 'Fill the Questionnaire',
                  text: 'Answer the questions for analysing your risk profile.',
                  num: '2',
                },
                {
                  icon: '/home/images/icon/13.png',
                  title: 'Create your Portfolio',
                  text: 'Create a new portfolio or upload existing one.',
                  num: '3',
                },
                {
                  icon: '/home/images/icon/11.png',
                  title: 'Analyze Portfolio',
                  text: 'Check portfolio insights tab for understanding the portfolio.',
                  num: '4',
                },
                {
                  icon: '/home/images/icon/12.png',
                  title: 'Check our Recommendations',
                  text: 'Check recommendations and update your portfolio.',
                  num: '5',
                },
              ].map((step) => (
                <div className="item" key={step.num}>
                  <div className="inner-block">
                    <div className="icon">
                      <img src={step.icon} alt="" />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    <div className="num">{step.num}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>{' '}
        {/* /.main-wrapper */}
      </div>

      {/* Team */}
      <div className="our-team" id="team">
        <div className="container">
          <div className="theme-title text-center">
            <h2>
              Our Development <span>Team</span>
            </h2>
          </div>
          <div className="row text-center">
            {[
              {
                name: 'Bhushan Pagare',
                linkedin: 'https://linkedin.com/in/bpagare6',
                github: 'https://github.com/bpagare6',
                site: 'https://bpagare6.github.io',
              },
              {
                name: 'Purvesh Jain',
                linkedin: 'https://linkedin.com/in/purvesh-jain-035727155/',
                github: 'https://github.com/purvesh314',
              },
              {
                name: 'Manav Peshwani',
                linkedin: 'https://linkedin.com/in/manavpeshwani',
                github: 'https://github.com/manavpeshwani',
              },
              {
                name: 'Nipun Khivansara',
                linkedin: 'https://linkedin.com/in/nipun-khivansara-152bb8199/',
                github: 'https://github.com/Nipunkhivansara',
              },
            ].map((member) => (
              <div className="col" key={member.name}>
                <div className="single-block clearfix">
                  <div className="img-block">
                    <img src="/home/images/home/1.jpg" alt="" />
                  </div>
                  <div className="text">
                    <h3 className="name">{member.name}</h3>
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noreferrer">
                        <i className="fa fa-linkedin-square" style={{ fontSize: 24 }} />
                      </a>
                    )}
                    {member.github && (
                      <a href={member.github} target="_blank" rel="noreferrer">
                        <i
                          className="fa fa-github"
                          style={{ fontSize: 24, color: 'black' }}
                        />
                      </a>
                    )}
                    {member.site && (
                      <a href={member.site} target="_blank" rel="noreferrer">
                        <i
                          className="fa fa-globe"
                          style={{ fontSize: 24, color: 'black' }}
                        />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="contact-us-one" id="contact">
        <div className="overlay">
          <div className="container">
            <div className="theme-title text-center">
              <h2>Get In Touch</h2>
              <p>Send your requests/queries and we will get back to you with solutions soon</p>
            </div>

            <form className="form-validation" autoComplete="off">
              <div className="row">
                <div className="col-md-6">
                  <label>First Name*</label>
                  <input type="text" placeholder="First Name" name="firstName" />
                </div>
                <div className="col-md-6">
                  <label>Last Name*</label>
                  <input type="text" placeholder="Last Name" name="lastName" />
                </div>
                <div className="col-md-6">
                  <label>Email*</label>
                  <input type="email" placeholder="Email Address" name="email" />
                </div>
                <div className="col-md-6">
                  <label>Phone</label>
                  <input type="text" placeholder="Phone Number" name="phone" />
                </div>
                <div className="col-12">
                  <label>I would like to discuss*</label>
                  <input type="text" name="message" />
                </div>
              </div>
              <button type="button">Send Message</button>
            </form>
          </div>
        </div>
      </div>

      {/* Partner logos */}
      <div className="partner-section">
        <div className="container">
          <div className="partner-slider">
            {['p-1.png', 'p-2.png', 'p-3.png', 'p-4.png', 'p-5.png'].map((logo) => (
              <div className="item" key={logo}>
                <a href="#">
                  <img src={`/home/images/logo/${logo}`} alt="" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="theme-footer">
        <div className="container">
          <div className="inner-wrapper">
            <div className="top-footer-data-wrapper">
              <div className="row">
                <div className="col-lg-4 col-sm-6 footer-logo">
                  <div className="logo">
                    <Link href="/">
                      <h3>Logo Placeholder</h3>
                    </Link>
                  </div>
                  <a href="mailto:contact@pms.com" className="email">
                    contact@pms.com
                  </a>
                  <a href="tel:+91xxxxxxxxxx" className="mobile">
                    +91-xxxxx-xxxxx
                  </a>
                </div>
                <div className="col-lg-2 col-sm-6 footer-list">
                  <h4 className="title">Quick Links</h4>
                  <ul>
                    <li>
                      <a href="#progress">How it Works</a>
                    </li>
                    <li>
                      <a href="#contact">Report Bug</a>
                    </li>
                    <li>
                      <a href="#">Pricing</a>
                    </li>
                  </ul>
                </div>
                <div className="col-lg-3 col-sm-6 footer-list">
                  <h4 className="title">About Us</h4>
                  <ul>
                    <li>
                      <a href="#team">Team</a>
                    </li>
                    <li>
                      <a href="#">Testimonials</a>
                    </li>
                  </ul>
                </div>
                <div className="col-lg-3 col-sm-6 footer-list">
                  <h4 className="title">Get Started</h4>
                  <ul>
                    <li>
                      <Link href="/dashboard">Dashboard</Link>
                    </li>
                    <li>
                      <a href="#">Terms &amp; Conditions</a>
                    </li>
                    <li>
                      <a href="#">Privacy Policy</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bottom-footer clearfix">
              <p className="copyright">
                {new Date().getFullYear()} &copy; All Right Reserved
              </p>
              <ul>
                <li>
                  <a href="#">
                    <i className="fa fa-facebook" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i className="fa fa-twitter" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i className="fa fa-instagram" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll top button (no JS wired yet) */}
      <button className="scroll-top tran3s color-one-bg">
        <i className="fa fa-long-arrow-up" aria-hidden="true" />
      </button>
    </div>
  );
}