import React from "react";
import Resume from "./components/Resume";

const data = {
  name: "ESTELLE DARCY",
  title: "BUSINESS GRADUATE",
  profile:
    "An independent and self-motivated graduate looking for an entry-level position in the marketing department where I can utilize the extensive knowledge I have gained during my course. Well versed in market research and excellence in creating brand awareness.",
  contact: {
    phone: "123-456-7890",
    email: "hello@reallygreatsite.com",
    address: "123 Anywhere St., Any City",
    website: "reallygreatsite.com",
  },
  skills: ["Teamwork", "Time Management", "Leadership", "Verbal & Written communication"],
  activities: [
    "Organize monthly events to increase the participation of students in different college clubs.",
    "Conducted a CSR programme on World Environment Day.",
  ],
  languages: [
    { name: "English", level: 5 },
    { name: "French",  level: 3 },
    { name: "Hindi",   level: 4 },
  ],
  education: [
    {
      degree: "Masters in Global Business Management",
      school: "Really Great University (2020 - 2022)",
      bullets: ["Post graduated in Marketing and Sales Management", "Minor : Finance"],
    },
    {
      degree: "Graduate in International Business",
      school: "Really Great University (2017 - 2020)",
      bullets: ["Macro Economics", "Risk Management", "Advertising & Sales"],
    },
  ],
  internships: [
    {
      company: "Salford & Co.",
      role: "Marketing Intern",
      bullets: [
        "Conducted market research with the assigned team for the newly launched product and create awareness among the target group.",
        "Assisted the marketing manager in writing press releases and conducting surveys through phones and emails.",
      ],
    },
  ],
  photo: "/profile.jpg", // add file to public/profile.jpg
};

export default function App() {
  return (
    <div className="app-root">
      <div className="top-controls">
        <h2>Resume – Estelle Theme</h2>
        <div>
          <button className="btn" onClick={() => window.print()}>Download PDF</button>
        </div>
      </div>

      <div className="page-wrap">
        <Resume data={data} />
      </div>
    </div>
  );
}
