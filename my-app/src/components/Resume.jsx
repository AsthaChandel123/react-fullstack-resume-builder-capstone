import React from "react";
import { FiPhone, FiMail, FiMapPin, FiGlobe } from "react-icons/fi";

const DotBar = ({ level = 0, total = 5 }) => {
  const filled = Array.from({ length: level });
  const empty  = Array.from({ length: total - level });
  return (
    <div className="dotbar">
      {filled.map((_, i) => <span key={i} className="dot filled" />)}
      {empty.map((_, i) => <span key={i} className="dot empty" />)}
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <div className="section-title">{children}</div>
);

export default function Resume({ data }) {
  return (
    <div className="resume-card">
      <aside className="left-col">
        <div className="photo-wrap">
          <img src={data.photo} alt="profile" />
        </div>

        <div className="contact">
          <h4>CONTACT</h4>
          <div className="info"><FiPhone /> <span>{data.contact.phone}</span></div>
          <div className="info"><FiMail /> <span>{data.contact.email}</span></div>
          <div className="info"><FiMapPin /> <span>{data.contact.address}</span></div>
          <div className="info"><FiGlobe /> <span>{data.contact.website}</span></div>
        </div>

        <div className="skills">
          <h4>SKILLS</h4>
          <ul>{data.skills.map((s,i) => <li key={i}>{s}</li>)}</ul>
        </div>

        <div className="activities">
          <h4>EXTRACURRICULAR ACTIVITIES</h4>
          <ul>{data.activities.map((a,i) => <li key={i}>{a}</li>)}</ul>
        </div>

        <div className="langs">
          <h4>LANGUAGE</h4>
          <div className="lang-list">
            {data.languages.map((l,i) => (
              <div key={i} className="lang-row">
                <span>{l.name}</span>
                <DotBar level={l.level} />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="right-col">
        <header className="hero">
          <h1>{data.name}</h1>
          <p className="title">{data.title}</p>
        </header>

        <section className="profile">
          <SectionTitle>Professional Profile</SectionTitle>
          <p>{data.profile}</p>
        </section>

        <section className="education">
          <SectionTitle>Education</SectionTitle>
          {data.education.map((edu, idx) => (
            <div className="edu-item" key={idx}>
              <h5>{edu.degree}</h5>
              <p className="muted">{edu.school}</p>
              <ul>{edu.bullets.map((b,i) => <li key={i}>{b}</li>)}</ul>
            </div>
          ))}
        </section>

        <section className="internship">
          <SectionTitle>Internship</SectionTitle>
          {data.internships.map((it, idx) => (
            <div className="int-item" key={idx}>
              <h5>{it.company}</h5>
              <p className="muted">{it.role}</p>
              <ul>{it.bullets.map((b,i) => <li key={i}>{b}</li>)}</ul>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
