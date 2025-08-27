import React, { useState } from 'react';
import './App.css';

function App() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    education: '',
    experience: '',
    projects: '',
    skills: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const listify = (value) =>
    value
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => `- ${line.trim()}`)
      .join('\n');

  const buildResumeText = () => {
    const lines = [form.name, `${form.email} | ${form.phone}`, ''];
    if (form.summary) {
      lines.push('Summary', form.summary.trim(), '');
    }
    if (form.education) {
      lines.push('Education', listify(form.education), '');
    }
    if (form.experience) {
      lines.push('Experience', listify(form.experience), '');
    }
    if (form.projects) {
      lines.push('Projects', listify(form.projects), '');
    }
    if (form.skills) {
      lines.push('Skills', listify(form.skills));
    }
    return lines.join('\n').trim();
  };

  const downloadResume = () => {
    const blob = new Blob([buildResumeText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <h1>Student Portfolio Builder</h1>
      <form className="resume-form" onSubmit={(e) => { e.preventDefault(); downloadResume(); }}>
        <label>
          Full Name
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
          />
        </label>
        <label>
          Email
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
        </label>
        <label>
          Phone
          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />
        </label>
        <label>
          Summary
          <textarea
            name="summary"
            placeholder="Summary"
            value={form.summary}
            onChange={handleChange}
          />
        </label>
        <label>
          Education
          <textarea
            name="education"
            placeholder="Education"
            value={form.education}
            onChange={handleChange}
          />
        </label>
        <label>
          Experience
          <textarea
            name="experience"
            placeholder="Experience"
            value={form.experience}
            onChange={handleChange}
          />
        </label>
        <label>
          Projects
          <textarea
            name="projects"
            placeholder="Projects"
            value={form.projects}
            onChange={handleChange}
          />
        </label>
        <label>
          Skills
          <textarea
            name="skills"
            placeholder="Skills"
            value={form.skills}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Download Resume</button>
      </form>
      <h2>Preview</h2>
      <pre className="preview">{buildResumeText()}</pre>
    </div>
  );
}

export default App;

